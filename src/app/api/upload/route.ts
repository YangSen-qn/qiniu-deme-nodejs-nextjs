import {qiniuService} from '@/lib/qiniuService';
import {NextResponse} from 'next/server';

export async function GET(request: Request) {
    const {searchParams} = new URL(request.url);
    const bucket = searchParams.get('bucket');

    if (!bucket) {
        return NextResponse.json(
            {error: 'Bucket name is required'},
            {status: 400}
        );
    }

    try {
        const token = qiniuService.getUploadToken(bucket);
        return NextResponse.json({token});
    } catch (error: any) {
        console.error('Failed to generate upload token:', error);
        return NextResponse.json(
            {error: error?.message || 'Failed to generate upload token'},
            {status: 500}
        );
    }
} 