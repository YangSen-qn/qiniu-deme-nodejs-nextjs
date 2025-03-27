import {qiniuService} from '@/lib/qiniuService';
import {NextResponse} from 'next/server';

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const prefix = searchParams.get('prefix') || '';
    const marker = searchParams.get('marker') || '';

    if (!bucket) {
        return NextResponse.json(
            {error: 'Bucket name is required'},
            {status: 400}
        );
    }

    try {
        const result = await qiniuService.listFiles(bucket, prefix, marker);
        return NextResponse.json({files: result.items || []});
    } catch (error: any) {
        console.error('Failed to list files:', error);
        return NextResponse.json(
            {error: error?.message || 'Failed to list files'},
            {status: 500}
        );
    }
} 