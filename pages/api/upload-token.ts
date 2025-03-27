import type { NextApiRequest, NextApiResponse } from 'next';
import { qiniuService } from '../../lib/qiniuService';

interface TokenResponse {
  token: string;
  uploadUrl: string;
  key?: string;
  bucket: string;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse | ErrorResponse>
) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允许GET请求' });
  }

  try {
    const { bucket, prefix = '', filename = '' } = req.query;
    
    if (!bucket || typeof bucket !== 'string') {
      return res.status(400).json({ error: '需要提供存储桶名称(bucket)' });
    }

    // 处理前缀和文件名，确保类型是字符串
    const prefixStr = typeof prefix === 'string' ? prefix : prefix[0] || '';
    const filenameStr = typeof filename === 'string' ? filename : filename[0] || '';

    // 生成文件路径
    let key = '';
    if (filenameStr) {
      key = prefixStr ? `${prefixStr}${prefixStr.endsWith('/') ? '' : '/'}${filenameStr}` : filenameStr;
    }

    // 获取上传令牌
    const token = qiniuService.getUploadToken(bucket.toString(), key);
    
    // 获取上传区域对应的上传域名
    const uploadUrl = qiniuService.getUploadUrl(bucket.toString());

    return res.status(200).json({
      token,
      uploadUrl,
      key,
      bucket: bucket.toString()
    });
  } catch (error) {
    console.error('获取上传令牌出错:', error);
    return res.status(500).json({ error: '获取上传令牌时发生错误' });
  }
} 