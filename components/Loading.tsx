import React from 'react';

interface LoadingProps {
    message?: string;
}

export default function Loading({message = '加载中...'}: LoadingProps): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <div className="mt-4 text-gray-600">{message}</div>
        </div>
    );
} 