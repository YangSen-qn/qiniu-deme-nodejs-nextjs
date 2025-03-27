import React from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';
import BucketClient from '../../components/BucketClient';

export default function BucketPage(): React.ReactElement {
    const router = useRouter();
    const {bucketName} = router.query;

    // 如果路由还没有准备好，显示加载状态
    if (!bucketName) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">存储桶加载中...</h1>
                    <Link href="/" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-gray-100 border-b">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-blue-600 hover:text-blue-800">
                                首页
                            </Link>
                            <span className="text-gray-500">/</span>
                            <span className="font-medium">{bucketName}</span>
                        </div>
                        <Link href="/debug" className="text-blue-600 hover:text-blue-800">
                            调试面板
                        </Link>
                    </div>
                </div>
            </div>

            <BucketClient bucket={typeof bucketName === 'string' ? bucketName : ''}/>
        </div>
    );
} 