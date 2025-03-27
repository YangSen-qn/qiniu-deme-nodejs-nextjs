import type {NextApiRequest, NextApiResponse} from 'next';
import {qiniuService} from '@/lib/qiniuService';

interface DownloadResponse {
    url: string;
    alternativeUrls: string[];
    bucket: string;
    key: string;
    expiresIn: string;
}

interface ErrorResponse {
    error: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DownloadResponse | ErrorResponse>
) {
    try {
        // 只允许 GET 请求
        if (req.method !== 'GET') {
            return res.status(405).json({error: '不支持的请求方法'});
        }

        // 从查询参数中获取存储桶名称和文件路径
        const {bucket, key} = req.query;

        // 检查是否提供了必要参数
        if (!bucket) {
            return res.status(400).json({error: '缺少存储桶名称参数'});
        }
        if (!key) {
            return res.status(400).json({error: '缺少文件路径参数'});
        }

        // 确保 bucket 和 key 是字符串
        const bucketStr = Array.isArray(bucket) ? bucket[0] : bucket;
        const keyStr = Array.isArray(key) ? key[0] : key;

        // 获取存储桶的域名列表
        const domains = await qiniuService.getBucketDomains(bucketStr);

        if (!domains || domains.length === 0) {
            return res.status(404).json({error: `无法获取存储桶 ${bucketStr} 的域名`});
        }

        // 生成私有下载链接（使用正确的方法参数）
        const url = await qiniuService.getPrivateDownloadUrl(bucketStr, keyStr);

        // 生成备用下载链接（目前我们直接使用同一个URL作为备用）
        const alternativeUrls: string[] = [];

        // 返回下载链接
        return res.status(200).json({
            url,
            alternativeUrls,
            bucket: bucketStr,
            key: keyStr,
            expiresIn: '3600秒'
        });
    } catch (error) {
        console.error('生成下载链接出错:', error);
        return res.status(500).json({error: error instanceof Error ? error.message : '生成下载链接失败'});
    }
} 