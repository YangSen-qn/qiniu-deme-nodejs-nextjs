import {qiniuService} from '@/lib/qiniuService'
import Link from 'next/link'

export default async function Home() {
    const buckets = await qiniuService.listBuckets()

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">七牛云存储管理器</h1>
                <Link
                    href="/debug"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                >
                    系统诊断
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">您的存储桶</h2>
                {buckets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {buckets.map((bucket) => (
                            <Link
                                key={bucket}
                                href={`/bucket/${bucket}`}
                                className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="font-medium">{bucket}</h3>
                                <p className="text-sm text-gray-500 mt-2">点击查看文件</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>未找到存储桶。请确保您的七牛云密钥配置正确。</p>
                        <p className="mt-2">
                            <Link
                                href="/debug"
                                className="text-blue-500 hover:underline"
                            >
                                点击此处进行系统诊断
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
} 