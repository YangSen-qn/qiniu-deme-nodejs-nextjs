import type {NextApiRequest, NextApiResponse} from 'next';
import {qiniuService} from '@/lib/qiniuService';

interface EnvironmentVariable {
    value: string | null;
    mask: boolean;
    status: string;
}

interface EnvInfo {
    status: string;
    variables: {
        QINIU_ACCESS_KEY: EnvironmentVariable;
        QINIU_SECRET_KEY: EnvironmentVariable;
        NODE_ENV: EnvironmentVariable;
    };
}

interface SdkInfo {
    status: string;
    connected: boolean;
    error: string | null;
}

interface BucketInfo {
    status: string;
    list: string[] | null;
    error: string | null;
}

interface DomainInfo {
    status: string;
    bucketDomains: Record<string, string[] | { error: string }>;
    error: string | null;
}

interface SystemInfo {
    nodeVersion: string;
    qiniuSdkVersion: string;
    serverTime: string;
    nextjsVersion: string;
}

interface DebugResponse {
    env: EnvInfo;
    sdk: SdkInfo;
    buckets: BucketInfo;
    domains: DomainInfo;
    system: SystemInfo;
}

interface ErrorResponse {
    error: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DebugResponse | ErrorResponse>
) {
    try {
        // 只允许 GET 请求
        if (req.method !== 'GET') {
            return res.status(405).json({error: '不支持的请求方法'});
        }

        // 收集环境变量信息，但不泄露敏感信息
        const envInfo: EnvInfo = {
            status: 'success',
            variables: {
                QINIU_ACCESS_KEY: {
                    value: process.env.QINIU_ACCESS_KEY ? '已设置' : null,
                    mask: true,
                    status: process.env.QINIU_ACCESS_KEY ? 'success' : 'error'
                },
                QINIU_SECRET_KEY: {
                    value: process.env.QINIU_SECRET_KEY ? '已设置' : null,
                    mask: true,
                    status: process.env.QINIU_SECRET_KEY ? 'success' : 'error'
                },
                NODE_ENV: {
                    value: process.env.NODE_ENV || null,
                    mask: false,
                    status: 'success'
                }
            }
        };

        // 确定整体环境变量状态
        if (!process.env.QINIU_ACCESS_KEY || !process.env.QINIU_SECRET_KEY) {
            envInfo.status = 'error';
        }

        // 测试七牛云SDK连接
        const sdkInfo: SdkInfo = {
            status: 'pending',
            connected: false,
            error: null
        };

        try {
            // 尝试获取存储桶列表，验证SDK连接
            await qiniuService.listBuckets();
            sdkInfo.connected = true;
            sdkInfo.status = 'success';
        } catch (sdkError) {
            sdkInfo.error = sdkError instanceof Error ? sdkError.message : '未知错误';
            sdkInfo.status = 'error';
        }

        // 获取存储桶列表
        let bucketInfo: BucketInfo = {
            status: 'pending',
            list: null,
            error: null
        };

        try {
            bucketInfo.list = await qiniuService.listBuckets();
            bucketInfo.status = bucketInfo.list && bucketInfo.list.length > 0 ? 'success' : 'warning';
        } catch (bucketError) {
            bucketInfo.error = bucketError instanceof Error ? bucketError.message : '未知错误';
            bucketInfo.status = 'error';
        }

        // 获取存储桶域名信息
        let domainsInfo: DomainInfo = {
            status: 'pending',
            bucketDomains: {},
            error: null
        };

        if (bucketInfo.list && bucketInfo.list.length > 0) {
            try {
                // 创建一个存储桶名称到域名的映射
                for (const bucket of bucketInfo.list) {
                    try {
                        const domains = await qiniuService.getBucketDomains(bucket);
                        domainsInfo.bucketDomains[bucket] = domains;
                    } catch (domainError) {
                        domainsInfo.bucketDomains[bucket] = {error: domainError instanceof Error ? domainError.message : '未知错误'};
                    }
                }
                domainsInfo.status = 'success';
            } catch (domainsError) {
                domainsInfo.error = domainsError instanceof Error ? domainsError.message : '未知错误';
                domainsInfo.status = 'error';
            }
        } else {
            domainsInfo.status = 'warning';
            domainsInfo.error = '无法获取域名信息，因为未找到存储桶';
        }

        // 收集系统信息
        const systemInfo: SystemInfo = {
            nodeVersion: process.version,
            qiniuSdkVersion: '尝试获取SDK版本',
            serverTime: new Date().toISOString(),
            nextjsVersion: process.env.NEXT_PUBLIC_VERSION || '未知'
        };

        // 构建完整的调试响应
        const debugResponse: DebugResponse = {
            env: envInfo,
            sdk: sdkInfo,
            buckets: bucketInfo,
            domains: domainsInfo,
            system: systemInfo
        };

        return res.status(200).json(debugResponse);
    } catch (error) {
        console.error('生成调试信息时出错:', error);
        return res.status(500).json({error: error instanceof Error ? error.message : '生成调试信息失败'});
    }
} 