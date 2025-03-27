import {qiniuService} from '@/lib/qiniuService'
import Link from 'next/link'
import BucketClient from './BucketClient'

export default async function BucketPage({
                                             params
                                         }: {
    params: { name: string }
}) {
    const files = await qiniuService.listFiles(params.name)

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Bucket: {params.name}</h1>
                <Link
                    href="/"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                >
                    Back to Buckets
                </Link>
            </div>

            <BucketClient bucketName={params.name} initialFiles={files.items || []}/>
        </div>
    )
} 