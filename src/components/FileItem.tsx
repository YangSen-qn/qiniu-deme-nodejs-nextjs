'use client'

import {useState} from 'react';

interface FileItemProps {
    file: {
        key: string
        fsize: number
    }
    bucketName: string
}

export default function FileItem({file, bucketName}: FileItemProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [alternatives, setAlternatives] = useState<string[]>([]);

    const handleDownload = async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        setShowAlternatives(false);

        try {
            console.log(`开始下载文件: ${file.key}`);

            // 构建API请求
            const url = `/api/download?bucket=${bucketName}&key=${encodeURIComponent(file.key)}`;
            console.log(`下载API请求: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('下载API响应:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // 保存备用链接
            if (data.alternativeUrls && Array.isArray(data.alternativeUrls) && data.alternativeUrls.length > 0) {
                setAlternatives(data.alternativeUrls);
            }

            // 先尝试主URL
            console.log(`尝试打开主URL: ${data.url}`);
            window.open(data.url, '_blank');

            // 延迟显示备用链接选项
            if (data.alternativeUrls && data.alternativeUrls.length > 0) {
                setTimeout(() => {
                    setShowAlternatives(true);
                }, 3000); // 给主链接3秒时间启动下载
            }
        } catch (error) {
            console.error('下载过程中出错:', error);
            alert(`文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleAlternativeDownload = (url: string) => {
        console.log(`尝试备用下载链接: ${url}`);
        window.open(url, '_blank');
        setShowAlternatives(false);
    };

    return (
        <div className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">{file.key}</h3>
                    <p className="text-sm text-gray-500">
                        大小: {(file.fsize / 1024).toFixed(2)} KB
                    </p>
                </div>
                <div className="space-x-2">
                    <button
                        className={`px-3 py-1 text-white rounded ${
                            isDownloading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? '下载中...' : '下载'}
                    </button>
                </div>
            </div>

            {/* 备用下载链接选项 */}
            {showAlternatives && alternatives.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">如果主链接没有下载，请尝试以下备用链接:</p>
                    <div className="flex flex-wrap gap-2">
                        {alternatives.map((alt, index) => (
                            <button
                                key={index}
                                onClick={() => handleAlternativeDownload(alt)}
                                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                备用链接 {index + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowAlternatives(false)}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded ml-auto"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 