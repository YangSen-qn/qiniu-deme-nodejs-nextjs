import {qiniuService} from '@/lib/qiniuService';
import {NextResponse} from 'next/server';

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const testBucket = searchParams.get('bucket');
    const testKey = searchParams.get('key');

    try {
        const accessKey = process.env.QINIU_ACCESS_KEY;
        const secretKey = process.env.QINIU_SECRET_KEY;
        const configuredDomain = process.env.QINIU_BUCKET_DOMAIN;
        const nodeEnv = process.env.NODE_ENV;

        let sdkConnection = false;
        let buckets: string[] = [];
        let bucketDomains: Record<string, string[]> = {};
        let bucketAccessTypes: Record<string, { isPrivate: boolean }> = {};
        let testResults: any = null;

        // 测试SDK连接
        try {
            buckets = await qiniuService.listBuckets();
            sdkConnection = true;

            // 如果成功获取了存储桶，尝试获取每个存储桶的域名和访问类型
            if (buckets && buckets.length > 0) {
                for (const bucket of buckets) {
                    try {
                        // 获取域名
                        const domains = await qiniuService.getBucketDomains(bucket);
                        bucketDomains[bucket] = domains;

                        // 检查是否为私有存储桶
                        const isPrivate = await qiniuService.isBucketPrivate(bucket);
                        bucketAccessTypes[bucket] = {isPrivate};
                    } catch (error) {
                        console.error(`获取存储桶 ${bucket} 信息失败:`, error);
                        bucketDomains[bucket] = [];
                        bucketAccessTypes[bucket] = {isPrivate: true}; // 默认为私有（安全考虑）
                    }
                }
            }

            // 如果提供了测试参数，尝试生成下载链接
            if (testBucket && testKey) {
                try {
                    const isPrivate = await qiniuService.isBucketPrivate(testBucket);
                    const publicUrl = await qiniuService.getPublicDownloadUrl(testBucket, testKey);
                    const privateUrl = await qiniuService.getPrivateDownloadUrl(testBucket, testKey);
                    const recommendedUrl = await qiniuService.getDownloadUrlAsync(testBucket, testKey);

                    testResults = {
                        bucket: testBucket,
                        key: testKey,
                        isPrivate,
                        publicUrl,
                        privateUrl,
                        recommendedUrl,
                        note: isPrivate
                            ? '该存储桶被检测为私有，推荐使用带签名的链接'
                            : '该存储桶被检测为公开，可以使用不带签名的链接'
                    };
                } catch (testError: any) {
                    console.error('测试生成下载链接失败:', testError);
                    testResults = {
                        error: testError?.message || '测试生成下载链接失败',
                        bucket: testBucket,
                        key: testKey
                    };
                }
            }
        } catch (sdkError) {
            console.error('七牛云SDK连接测试失败:', sdkError);
        }

        return NextResponse.json({
            accessKey: !!accessKey,
            secretKey: !!secretKey,
            configuredDomain,
            nodeEnv,
            sdkConnection,
            buckets,
            bucketDomains,
            bucketAccessTypes,
            testResults,
            documentation: {
                usage: "要测试特定文件的下载链接，请使用 ?bucket=yourBucket&key=yourFileKey 参数",
                builtWithQiniu: "本项目基于七牛云存储服务构建",
                version: "1.0.1"
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('调试API出错:', error);
        return NextResponse.json(
            {
                error: error?.message || '调试API出错',
                stack: error?.stack,
            },
            {status: 500}
        );
    }
} 