'use client'

import React, {useState} from 'react';

interface FileItemProps {
    file: {
        key: string;
        type?: string;
        fsize?: number;
        putTime?: number;
        hash?: string;
        mimeType?: string;
    };
    bucket: string;
    currentPrefix: string;
    onFolderClick: (prefix: string) => void;
}

interface DownloadLinks {
    primary: string;
    alternatives: string[];
}

export default function FileItem({file, bucket, currentPrefix, onFolderClick}: FileItemProps): React.ReactElement {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadLinks, setDownloadLinks] = useState<DownloadLinks | null>(null);

    // 检查是否为文件夹（七牛云中的公共前缀）
    const isFolder = file.key.endsWith('/') || (file.type === 'dir');

    // 处理点击事件
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();

        // 如果是文件夹，调用导航函数
        if (isFolder) {
            onFolderClick(file.key);
        } else {
            // 如果是文件，触发下载
            handleDownload();
        }
    };

    // 处理下载
    const handleDownload = async (): Promise<void> => {
        try {
            setIsDownloading(true);
            setError(null);

            // 调用下载API
            const response = await fetch(`/api/download?bucket=${bucket}&key=${encodeURIComponent(file.key)}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '下载链接生成失败');
            }

            const data = await response.json();

            // 保存下载链接以便显示
            setDownloadLinks({
                primary: data.url,
                alternatives: data.alternativeUrls || []
            });

            // 自动打开主链接进行下载
            window.open(data.url, '_blank');
        } catch (err) {
            console.error('下载出错:', err);
            setError(err instanceof Error ? err.message : '下载出错');
        } finally {
            setIsDownloading(false);
        }
    };

    // 格式化文件大小
    const formatFileSize = (size: number | undefined): string => {
        if (size === undefined || size === null) return 'Unknown';

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let formattedSize = size;
        let unitIndex = 0;

        while (formattedSize >= 1024 && unitIndex < units.length - 1) {
            formattedSize /= 1024;
            unitIndex++;
        }

        return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
    };

    // 获取文件名（从路径中提取）
    const getFileName = (): string => {
        // 如果有当前前缀，从完整路径中移除它
        let displayKey = file.key;
        if (currentPrefix && displayKey.startsWith(currentPrefix)) {
            displayKey = displayKey.substring(currentPrefix.length);
        }

        // 移除任何开头的斜杠
        displayKey = displayKey.replace(/^\/+/, '');

        // 如果是文件夹，确保它以斜杠结尾
        if (isFolder && !displayKey.endsWith('/')) {
            displayKey += '/';
        }

        return displayKey;
    };

    return (
        <div className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {/* 图标（文件夹/文件） */}
                    <div className="mr-4 text-gray-400">
                        {isFolder ? (
                            <FolderIcon/>
                        ) : (
                            <FileIcon/>
                        )}
                    </div>

                    {/* 文件名/文件夹名 */}
                    <div>
                        <a
                            href="#"
                            onClick={handleClick}
                            className={`font-medium ${isFolder ? 'text-blue-600 hover:text-blue-800' : 'hover:text-gray-600'}`}
                        >
                            {getFileName()}
                        </a>
                        {!isFolder && (
                            <div className="text-xs text-gray-500">
                                {formatFileSize(file.fsize || 0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 下载按钮（只对文件显示） */}
                {!isFolder && (
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? '下载中...' : '下载'}
                    </button>
                )}
            </div>

            {/* 下载链接 */}
            {downloadLinks && (
                <div className="mt-2 ml-10 text-sm">
                    <div className="text-gray-700 font-medium">下载链接:</div>
                    <a href={downloadLinks.primary} target="_blank" rel="noopener noreferrer"
                       className="text-blue-500 hover:underline break-all block">
                        {downloadLinks.primary}
                    </a>

                    {downloadLinks.alternatives && downloadLinks.alternatives.length > 0 && (
                        <div className="mt-1">
                            <div className="text-gray-700 font-medium">备用链接:</div>
                            {downloadLinks.alternatives.map((link, index) => (
                                <a key={index} href={link} target="_blank" rel="noopener noreferrer"
                                   className="text-blue-500 hover:underline break-all block">
                                    {link}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 错误消息 */}
            {error && (
                <div className="mt-2 ml-10 text-sm text-red-500">
                    {error}
                </div>
            )}
        </div>
    );
}

// 文件图标
function FileIcon(): React.ReactElement {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
             stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
    );
}

// 文件夹图标
function FolderIcon(): React.ReactElement {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
             stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
    );
} 