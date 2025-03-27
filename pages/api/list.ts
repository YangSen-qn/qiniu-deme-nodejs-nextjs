import type {NextApiRequest, NextApiResponse} from 'next';
import {qiniuService} from '@/lib/qiniuService';

interface FileItem {
    key: string;
    type?: string;
    fsize?: number;
    putTime?: number;
    hash?: string;
    mimeType?: string;
}

interface ListResponse {
    items: FileItem[];
}

interface ErrorResponse {
    error: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ListResponse | ErrorResponse>
) {
    try {
        // 只允许 GET 请求
        if (req.method !== 'GET') {
            return res.status(405).json({error: '不支持的请求方法'});
        }

        // 从查询参数中获取存储桶名称和前缀
        const {bucket, prefix = ''} = req.query;

        // 检查是否提供了存储桶名称
        if (!bucket) {
            return res.status(400).json({error: '缺少存储桶名称参数'});
        }

        // 确保 bucket 和 prefix 是字符串
        const bucketStr = Array.isArray(bucket) ? bucket[0] : bucket;
        const prefixStr = Array.isArray(prefix) ? prefix[0] : prefix;

        // 获取存储桶中的文件列表
        const result = await qiniuService.listFiles(bucketStr, prefixStr);
        
        // 确保我们返回一个一致的数据格式
        let items: FileItem[] = [];
        
        if (Array.isArray(result)) {
            // 如果result已经是一个数组，直接使用
            items = result;
        } else if (result && result.items && Array.isArray(result.items)) {
            // 如果result.items是一个数组，使用它
            items = result.items;
        } else if (result && typeof result === 'object') {
            // 尝试从结果对象中提取数据
            console.log('七牛云返回的文件列表数据格式:', JSON.stringify(result));
            
            // 如果是七牛云特定的格式，尝试转换
            if (result.commonPrefixes || result.items) {
                const fileList = [];
                
                // 添加目录（公共前缀）
                if (result.commonPrefixes && Array.isArray(result.commonPrefixes)) {
                    result.commonPrefixes.forEach((prefix: string) => {
                        fileList.push({
                            key: prefix,
                            type: 'dir'
                        });
                    });
                }
                
                // 添加文件
                if (result.items && Array.isArray(result.items)) {
                    fileList.push(...result.items);
                }
                
                items = fileList;
            }
        }
        
        // 返回文件列表
        return res.status(200).json({items});
    } catch (error) {
        console.error('获取文件列表出错:', error);
        return res.status(500).json({error: error instanceof Error ? error.message : '获取文件列表失败'});
    }
} 