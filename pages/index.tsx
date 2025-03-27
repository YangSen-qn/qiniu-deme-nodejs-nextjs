import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Loading from '../components/Loading';

interface Bucket {
    name: string;
    region?: string;
    private?: boolean;
}

export default function HomePage(): React.ReactElement {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBuckets();
    }, []);

    const fetchBuckets = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/buckets');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取存储桶列表失败');
            }

            const data = await response.json();
            setBuckets(data.buckets || []);
        } catch (err) {
            console.error('获取存储桶列表出错:', err);
            setError(err instanceof Error ? err.message : '获取存储桶列表出错');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Head>
                <title>七牛云存储管理器</title>
                <meta name="description" content="管理您的七牛云存储桶和文件"/>
            </Head>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">七牛云存储管理</h1>
                <Link
                    href="/debug"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                    调试面板
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                    <p className="font-bold">错误</p>
                    <p>{error}</p>
                </div>
            )}

            {isLoading ? (
                <Loading message="获取存储桶列表中..."/>
            ) : buckets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buckets.map((bucket, index) => (
                        <div key={index} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-100 p-2 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500"
                                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{bucket.name}</h2>
                                    <p className="text-gray-500 text-sm">
                                        {bucket.region || '默认区域'} · {bucket.private ? '私有' : '公开'}
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/bucket/${bucket.name}`}
                                className="block text-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                                打开存储桶
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                    <h3 className="text-xl font-medium mb-2">没有可用的存储桶</h3>
                    <p className="text-gray-500 mb-6">您当前没有可用的七牛云存储桶，或者无法访问它们。</p>
                    <div className="flex justify-center">
                        <Link href="/debug" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
                            前往调试面板
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
} 