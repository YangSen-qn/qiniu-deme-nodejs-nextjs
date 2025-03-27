import * as qiniu from 'qiniu';
import {BucketDomainV3} from "qiniu/StorageResponseInterface";
import {File} from "undici-types";

// 定义七牛云API响应的接口
interface QiniuResponse {
    statusCode: number;
    statusMessage: string;
    data?: any;
    body?: any;
}

// 定义七牛云SDK回调函数类型
type QiniuCallback<T = any> = (err?: Error | null, respBody?: T, respInfo?: any) => void;

class QiniuService {
    private mac: qiniu.auth.digest.Mac;
    private bucketManager: qiniu.rs.BucketManager;
    private config: qiniu.conf.Config;
    private domainsCache: Record<string, string[]> = {}; // 缓存存储桶域名
    private bucketInfoCache: Record<string, { isPrivate: boolean }> = {}; // 缓存存储桶访问权限信息

    constructor() {
        const accessKey = process.env.QINIU_ACCESS_KEY || '';
        const secretKey = process.env.QINIU_SECRET_KEY || '';
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.config = new qiniu.conf.Config();
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    async listBuckets(): Promise<string[]> {
        try {
            const result = await this.bucketManager.listBucket();
            if (result && result.data) {
                return result.data as string[];
            }
            return [];
        } catch (error) {
            console.error('Error listing buckets:', error);
            throw error;
        }
    }

    async listFiles(bucket: string, prefix: string = '', marker: string = ''): Promise<any> {
        try {
            const options = {prefix, marker};
            const result = await this.bucketManager.listPrefix(bucket, options);
            if (result && result.data) {
                return result.data;
            }
            return {items: []};
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    async getFileInfo(bucket: string, key: string): Promise<any> {
        try {
            const result = await this.bucketManager.stat(bucket, key);
            if (result && result.data) {
                return result.data;
            }
            return {};
        } catch (error) {
            console.error('Error getting file info:', error);
            throw error;
        }
    }

    // 检查存储桶是否为私有
    async isBucketPrivate(bucket: string): Promise<boolean> {
        try {
            // 检查缓存
            if (this.bucketInfoCache[bucket] !== undefined) {
                return this.bucketInfoCache[bucket].isPrivate;
            }

            console.log(`正在检查存储桶 ${bucket} 的访问权限...`);

            // 七牛云SDK中没有直接获取存储桶属性的方法，我们可以通过尝试获取一个不存在的文件来判断
            return new Promise<boolean>((resolve) => {
                // 尝试获取一个很可能不存在的文件
                const testKey = '_qiniu_access_test_' + Date.now();

                // 调用stat方法，查看响应
                this.bucketManager.stat(bucket, testKey, (err?: Error | null, respBody?: any, respInfo?: any) => {
                    // 如果错误码是612（资源不存在）且没有其他错误，说明我们有权限访问该存储桶
                    // 但这并不能确定存储桶是公开还是私有的

                    // 由于无法直接确定，我们采用一种保守的方式：
                    // 如果能够成功访问存储桶（即使文件不存在），默认视为公开的
                    // 如果访问出错（非612错误），视为私有的
                    if (respInfo && respInfo.statusCode === 612) {
                        console.log(`存储桶 ${bucket} 可访问，默认视为公开`);
                        this.bucketInfoCache[bucket] = {isPrivate: false};
                        resolve(false);
                        return;
                    }

                    // 其他错误情况下，视为私有（更安全）
                    console.warn(`无法确定存储桶 ${bucket} 访问权限，默认视为私有:`, err);
                    this.bucketInfoCache[bucket] = {isPrivate: true};
                    resolve(true);
                });
            });
        } catch (error) {
            console.error(`检查存储桶 ${bucket} 访问权限失败:`, error);
            // 错误时默认为私有，更安全
            return true;
        }
    }

    // 获取存储桶的域名
    async getBucketDomains(bucket: string): Promise<string[]> {
        try {
            // 检查缓存
            if (this.domainsCache[bucket] && this.domainsCache[bucket].length > 0) {
                return this.domainsCache[bucket];
            }

            console.log(`正在获取存储桶 ${bucket} 的域名列表...`);

            // 尝试使用七牛云SDK的listBucketDomains方法获取域名
            const result = await this.bucketManager.listBucketDomains(bucket);

            if (result && result.data) {
                // 从结果中提取域名字符串
                // 假设result.data是一个包含domain属性的对象数组
                const domains: string[] = [];
                // 如果是数组，尝试提取每个项目中的域名
                result.data.forEach((item: BucketDomainV3) => {
                    if (item.domain.startsWith('.')) {
                        return
                    }
                    console.log(`======${bucket} 的域名信息:`, JSON.stringify(item));
                    domains.push(item.domain);
                });

                if (domains.length > 0) {
                    console.log(`成功获取到存储桶 ${bucket} 的域名:`, domains);
                    this.domainsCache[bucket] = domains;
                    return domains;
                } else {
                    console.log(`无法从API返回结果中提取域名`);
                }
            } else {
                console.log(`存储桶 ${bucket} 没有域名配置或返回为空`);
            }
        } catch (apiError) {
            console.warn(`通过API获取存储桶 ${bucket} 域名失败:`, apiError);
        }
        return []
    }

    // 获取存储桶的首选域名
    async getPreferredDomain(bucket: string): Promise<string> {
        try {
            // 获取域名列表
            const domains = await this.getBucketDomains(bucket);

            if (domains && domains.length > 0) {
                // 首选HTTPS域名，如果没有则使用第一个域名
                const preferredDomain = domains.find(domain => domain.startsWith('https://')) || domains[0];
                console.log(`使用首选域名: ${preferredDomain}`);
                return preferredDomain;
            }

            // 如果无法获取域名，抛出错误
            throw new Error(`无法获取存储桶 ${bucket} 的域名`);
        } catch (error) {
            console.error(`获取存储桶 ${bucket} 首选域名失败:`, error);
            throw error;
        }
    }

    getUploadToken(bucket: string, key?: string): string {
        const putPolicy = new qiniu.rs.PutPolicy({
            scope: key ? `${bucket}:${key}` : bucket,
        });
        return putPolicy.uploadToken(this.mac);
    }

    // 获取上传URL
    getUploadUrl(bucket: string): string {
        try {
            // 默认使用华东区域上传域名
            let uploadUrl = 'https://upload.qiniup.com';
            
            // 根据配置中的区域选择上传域名
            if (this.config.zone) {
                const zone = this.config.zone as any; // 使用any类型绕过类型检查
                
                // 尝试从配置中获取上传域名
                if (typeof zone.getUpHosts === 'function') {
                    const hosts = zone.getUpHosts(bucket);
                    if (hosts && hosts.length > 0) {
                        // 优先使用HTTPS
                        const preferredHost = hosts.find((host: string) => host.startsWith('https://')) || hosts[0];
                        uploadUrl = preferredHost;
                    }
                } else if (zone.srcUpHosts && zone.srcUpHosts.length > 0) {
                    // 旧版API
                    uploadUrl = zone.srcUpHosts[0];
                    if (!uploadUrl.startsWith('http')) {
                        uploadUrl = 'https://' + uploadUrl;
                    }
                }
            }
            
            console.log(`为存储桶 ${bucket} 获取上传域名: ${uploadUrl}`);
            return uploadUrl;
        } catch (error) {
            console.error(`获取上传域名失败:`, error);
            // 出错时返回默认上传域名
            return 'https://upload.qiniup.com';
        }
    }

    // 获取公共下载URL
    async getPublicDownloadUrl(bucket: string, key: string): Promise<string> {
        const domain = await this.getPreferredDomain(bucket);
        const baseUrl = domain.startsWith('http') ? domain : `http://${domain}`;
        return `${baseUrl}/${encodeURIComponent(key)}`;
    }

    // 获取私有下载URL（带签名）
    async getPrivateDownloadUrl(bucket: string, key: string, deadline: number = Math.floor(Date.now() / 1000) + 3600): Promise<string> {
        const domain = await this.getPreferredDomain(bucket);
        const baseUrl = domain.startsWith('http') ? domain : `http://${domain}`;
        const publicUrl = `${baseUrl}/${encodeURIComponent(key)}`;

        // 使用七牛云SDK生成私有资源下载链接
        try {
            // 根据七牛云文档手动构建私有访问链接
            // 使用 deadline 参数作为过期时间

            // 构建最终的URL并添加过期时间
            let finalUrl = `${publicUrl}?e=${deadline}`;

            // 计算HMAC-SHA1签名
            const signingStr = `${publicUrl}?e=${deadline}`;
            const hmac = qiniu.util.hmacSha1(signingStr, this.mac.secretKey);
            const encodedSign = qiniu.util.base64ToUrlSafe(hmac);

            // 添加签名到URL
            finalUrl = `${finalUrl}&token=${this.mac.accessKey}:${encodedSign}`;

            console.log(`生成带签名的私有下载链接: ${finalUrl}`);
            return finalUrl;
        } catch (error) {
            console.error('生成私有下载链接失败:', error);
            // 失败时记录错误，但仍返回未签名的URL作为备选（不安全，但提供回退方案）
            console.warn('使用未签名URL作为备选，请注意这可能无法访问私有资源');
            return publicUrl;
        }
    }

    // 修改下载URL生成方法
    async getDownloadUrlAsync(bucket: string, key: string): Promise<string> {
        try {
            // 判断存储桶是否为私有
            const isPrivate = await this.isBucketPrivate(bucket);

            if (isPrivate) {
                console.log(`存储桶 ${bucket} 为私有，生成带签名的下载链接`);
                return this.getPrivateDownloadUrl(bucket, key);
            } else {
                console.log(`存储桶 ${bucket} 为公开，生成普通下载链接`);
                return this.getPublicDownloadUrl(bucket, key);
            }
        } catch (error) {
            console.error('生成下载URL失败:', error);

            // 出错时尝试生成公共URL作为回退
            try {
                return this.getPublicDownloadUrl(bucket, key);
            } catch (fallbackError) {
                console.error('回退到公共URL也失败:', fallbackError);
                throw error; // 传播原始错误
            }
        }
    }

    // 保留原有方法（为了兼容性）
    getDownloadUrl(domain: string, key: string, deadline: number = Math.floor(Date.now() / 1000) + 3600): string {
        try {
            // 确保域名格式正确
            const baseUrl = domain.startsWith('http') ? domain : `http://${domain}`;
            // 创建公共URL
            const publicUrl = `${baseUrl}/${encodeURIComponent(key)}`;

            // 直接返回公共URL - 对于公共存储桶这是足够的
            return publicUrl;
        } catch (error) {
            console.error('生成下载URL失败:', error);
            throw error;
        }
    }
}

export const qiniuService = new QiniuService(); 