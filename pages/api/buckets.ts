import type {NextApiRequest, NextApiResponse} from 'next';
import {qiniuService} from '@/lib/qiniuService';

interface BucketResponse {
    buckets: Array<{
        name: string;
        region: string | null;
        private: boolean;
    }>;
}

interface ErrorResponse {
    error: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BucketResponse | ErrorResponse>
) {
    try {
        // 只允许 GET 请求
        if (req.method !== 'GET') {
            return res.status(405).json({error: '不支持的请求方法'});
        }

        // 获取存储桶列表（字符串数组）
        const bucketNames = await qiniuService.listBuckets();

        // 将字符串数组转换为所需的对象数组
        const buckets = bucketNames.map(name => ({
            name,
            region: null, // 如果需要获取区域信息，可以增加额外的API调用
            private: false // 默认设置为公开，如果需要可以调用isBucketPrivate方法检查
        }));

        // 返回存储桶列表
        return res.status(200).json({buckets});
    } catch (error) {
        console.error('获取存储桶列表出错:', error);
        return res.status(500).json({error: error instanceof Error ? error.message : '获取存储桶列表失败'});
    }
} 