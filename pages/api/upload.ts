import type {NextApiRequest, NextApiResponse} from 'next';
import {qiniuService} from '@/lib/qiniuService';

interface UploadResponse {
    token: string;
    bucket: string;
    prefix: string | null;
    uploadUrl: string;
    expiresIn: number;
}

interface ErrorResponse {
    error: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<UploadResponse | ErrorResponse>
) {
    // 同时接受GET和POST请求
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({error: '不支持的请求方法'});
    }

    try {
        // 从查询参数获取存储桶和前缀
        const {bucket, prefix} = req.query;

        // 验证存储桶
        if (!bucket || typeof bucket !== 'string') {
            return res.status(400).json({error: '缺少存储桶名称'});
        }

        // 生成上传token
        const uploadToken = qiniuService.getUploadToken(bucket);

        // 返回需要的上传参数
        const response: UploadResponse = {
            token: uploadToken,
            bucket,
            prefix: typeof prefix === 'string' ? prefix : null,
            uploadUrl: qiniuService.getUploadUrl(bucket),
            expiresIn: 3600 // 默认1小时过期
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('生成上传参数时出错:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : '生成上传参数失败'
        });
    }
} 