import {qiniuService} from '@/lib/qiniuService';
import {NextResponse} from 'next/server';

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const key = searchParams.get('key');

    console.log(`接收到下载请求: bucket=${bucket}, key=${key}`);

    if (!bucket || !key) {
        console.error('请求参数不完整');
        return NextResponse.json(
            {error: '需要提供存储桶名称和文件键'},
            {status: 400}
        );
    }

    try {
        console.log(`开始处理存储桶 ${bucket} 中文件 ${key} 的下载`);

        // 检查七牛云密钥
        const accessKey = process.env.QINIU_ACCESS_KEY;
        const secretKey = process.env.QINIU_SECRET_KEY;
        console.log(`密钥状态: AK=${accessKey ? '已设置' : '未设置'}, SK=${secretKey ? '已设置' : '未设置'}`);

        if (!accessKey || !secretKey) {
            console.error('未配置七牛云密钥');
            return NextResponse.json(
                {error: '未配置七牛云访问密钥，请检查 .env.local 文件'},
                {status: 500}
            );
        }

        // 获取存储桶域名列表
        const domains = await qiniuService.getBucketDomains(bucket);
        console.log(`获取到存储桶 ${bucket} 的域名列表:`, domains);

        if (!domains || domains.length === 0) {
            console.error(`无法获取存储桶 ${bucket} 的域名`);
            return NextResponse.json(
                {error: `无法获取存储桶 ${bucket} 的域名，请确认存储桶名称正确且已设置域名`},
                {status: 500}
            );
        }

        // 使用新方法直接获取下载URL
        const fileUrl = await qiniuService.getDownloadUrlAsync(bucket, key);
        console.log(`生成主下载链接: ${fileUrl}`);

        // 构建备用链接（使用其他可用域名）
        let alternativeUrls: string[] = [];
        if (domains.length > 1) {
            for (const domain of domains.slice(0, 3)) { // 最多使用3个备用域名
                if (!fileUrl.includes(domain)) { // 避免重复
                    const baseUrl = domain.startsWith('http') ? domain : `http://${domain}`;
                    const altUrl = `${baseUrl}/${encodeURIComponent(key)}`;
                    alternativeUrls.push(altUrl);
                }
            }
        }

        console.log(`生成备用下载链接: ${alternativeUrls.join(', ')}`);

        // 返回主链接和备用链接
        return NextResponse.json({
            url: fileUrl,
            alternativeUrls: alternativeUrls,
            domains: domains
        });
    } catch (error: any) {
        console.error('生成下载URL时出错:', error);
        return NextResponse.json(
            {
                error: error?.message || '生成下载URL失败',
                stack: error?.stack,
                detail: '请检查七牛云配置和网络连接'
            },
            {status: 500}
        );
    }
} 