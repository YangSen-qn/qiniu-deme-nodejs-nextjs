import React, {useEffect, useState} from 'react';
import Loading from './Loading';
import FileItem from './FileItem';

interface BucketClientProps {
    bucket: string;
}

interface FileItem {
    key: string;
    type?: string;
    fsize?: number;
    putTime?: number;
    hash?: string;
    mimeType?: string;
}

interface Breadcrumb {
    label: string;
    prefix: string;
}

interface UploadFile {
    name: string;
    progress: number;
    error: string | null;
}

interface UploadStatus {
    isUploading: boolean;
    progress: number;
    files: UploadFile[];
}

export default function BucketClient({bucket}: BucketClientProps): React.ReactElement {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPrefix, setCurrentPrefix] = useState<string>('');
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>({isUploading: false, progress: 0, files: []});

    // 获取文件列表（初始化时和切换前缀时）
    useEffect(() => {
        fetchFiles();
    }, [bucket, currentPrefix]);

    const fetchFiles = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            // 构建 API URL，包括当前前缀参数
            let url = `/api/list?bucket=${encodeURIComponent(bucket)}`;
            if (currentPrefix) {
                url += `&prefix=${encodeURIComponent(currentPrefix)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取文件列表失败');
            }

            const data = await response.json();

            // 确保files始终是一个数组
            if (data.items && Array.isArray(data.items)) {
                setFiles(data.items);
            } else if (Array.isArray(data)) {
                setFiles(data);
            } else {
                console.error('API返回的数据格式不正确:', data);
                setFiles([]);
            }

            // 更新面包屑导航
            updateBreadcrumbs();
        } catch (err) {
            console.error('获取文件列表出错:', err);
            setError(err instanceof Error ? err.message : '获取文件列表出错');
            // 出错时设置为空数组，防止程序崩溃
            setFiles([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 更新面包屑导航
    const updateBreadcrumbs = (): void => {
        // 首先添加一个"根"级别
        const crumbs: Breadcrumb[] = [{label: 'Root', prefix: ''}];

        if (currentPrefix) {
            const parts = currentPrefix.split('/');
            let accumulatedPath = '';

            // 移除空部分（如果前缀以斜杠结尾）
            const validParts = parts.filter(part => part !== '');

            // 为每个部分创建面包屑
            validParts.forEach((part, index) => {
                accumulatedPath += part + '/';
                crumbs.push({
                    label: part,
                    prefix: accumulatedPath
                });
            });
        }

        setBreadcrumbs(crumbs);
    };

    // 切换到文件夹（前缀）
    const navigateToFolder = (prefix: string): void => {
        setCurrentPrefix(prefix);
    };

    // 返回上一级文件夹
    const navigateUp = (): void => {
        if (!currentPrefix) return; // 已经在根目录

        const parts = currentPrefix.split('/').filter(part => part !== '');

        if (parts.length <= 1) {
            // 如果只有一级，返回到根目录
            setCurrentPrefix('');
        } else {
            // 否则，返回上一级
            parts.pop();
            setCurrentPrefix(parts.join('/') + '/');
        }
    };

    // 面包屑导航点击处理
    const handleBreadcrumbClick = (prefix: string): void => {
        setCurrentPrefix(prefix);
    };

    // 拖放文件处理
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (): void => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        await uploadFiles(files);
    };

    // 选择文件处理
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        if (!e.target.files) return;

        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        await uploadFiles(files);
    };

    // 修改上传文件函数，使用我们的API而不是直接操作SDK
    const uploadFile = async (file: File): Promise<void> => {
        try {
            // 1. 获取上传令牌
            const tokenUrl = `/api/upload-token?bucket=${encodeURIComponent(bucket)}&prefix=${encodeURIComponent(currentPrefix)}&filename=${encodeURIComponent(file.name)}`;
            const tokenResponse = await fetch(tokenUrl);
            
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                throw new Error(errorData.error || '获取上传令牌失败');
            }
            
            const { token, uploadUrl, key } = await tokenResponse.json();

            // 2. 创建FormData用于上传
            const formData = new FormData();
            formData.append('token', token);
            formData.append('key', key);
            formData.append('file', file);

            // 3. 直接上传到七牛云服务器
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            const result = await uploadResponse.json();
            
            if (!result.key) {
                throw new Error('上传失败：未收到有效响应');
            }
            
            return;
        } catch (error) {
            console.error('上传文件失败:', error);
            throw error;
        }
    };

    // 上传文件到七牛云
    const uploadFiles = async (files: File[]): Promise<void> => {
        try {
            setUploadStatus({
                isUploading: true,
                progress: 0,
                files: files.map(file => ({name: file.name, progress: 0, error: null}))
            });

            // 创建进度跟踪状态的副本
            let uploadProgress = [...uploadStatus.files];

            // 逐个上传文件
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                try {
                    // 上传文件
                    await uploadFile(file)
                    // 更新进度
                    uploadProgress[i] = {...uploadProgress[i], progress: 100};
                } catch (err) {
                    console.error(`上传文件失败: ${file.name}`, err);
                    uploadProgress[i] = {
                        ...uploadProgress[i],
                        error: err instanceof Error ? err.message : '上传失败',
                        progress: 0
                    };
                }

                // 更新上传状态
                setUploadStatus(prev => ({
                    ...prev,
                    files: uploadProgress,
                    progress: ((i + 1) / files.length) * 100
                }));
            }

            // 刷新文件列表
            await fetchFiles();

        } catch (err) {
            console.error('文件上传过程出错:', err);
            setError(err instanceof Error ? err.message : '文件上传失败');
        } finally {
            // 5秒后关闭上传状态显示
            setTimeout(() => {
                setUploadStatus({isUploading: false, progress: 0, files: []});
            }, 5000);
        }
    };

    // 渲染上传状态
    const renderUploadStatus = (): React.ReactNode => {
        if (!uploadStatus.isUploading && uploadStatus.files.length === 0) return null;

        return (
            <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-80 z-10">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">文件上传</h3>
                    <button
                        onClick={() => setUploadStatus({isUploading: false, progress: 0, files: []})}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-2">
                    <div className="h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{width: `${uploadStatus.progress}%`}}
                        ></div>
                    </div>
                </div>

                <ul className="max-h-40 overflow-y-auto">
                    {uploadStatus.files.map((file, index) => (
                        <li key={index} className="text-sm py-1">
                            <div className="flex justify-between">
                                <span className="truncate">{file.name}</span>
                                <span>
                  {file.error ? (
                      <span className="text-red-500">失败</span>
                  ) : file.progress === 100 ? (
                      <span className="text-green-500">完成</span>
                  ) : (
                      <span>{file.progress}%</span>
                  )}
                </span>
                            </div>
                            {file.error && (
                                <div className="text-xs text-red-500 truncate">{file.error}</div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">存储桶: {bucket}</h1>

            {/* 面包屑导航 */}
            <div className="flex items-center mb-4 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                        {index > 0 && <span className="mx-1 text-gray-500">/</span>}
                        <button
                            onClick={() => handleBreadcrumbClick(crumb.prefix)}
                            className={`px-2 py-1 rounded hover:bg-gray-100 
                ${currentPrefix === crumb.prefix ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
                        >
                            {crumb.label}
                        </button>
                    </div>
                ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex mb-4 space-x-2">
                <button
                    onClick={navigateUp}
                    disabled={!currentPrefix}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    返回上级
                </button>

                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                    上传文件
                </button>
            </div>

            {/* 错误消息 */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                    <p>{error}</p>
                </div>
            )}

            {/* 加载指示器 */}
            {isLoading ? (
                <Loading message="加载文件列表中..."/>
            ) : (
                <div
                    className={`border rounded ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* 文件拖放区 */}
                    {isDragging && (
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
                            <div className="text-xl font-semibold text-blue-700">释放文件以上传</div>
                        </div>
                    )}

                    {/* 文件列表 */}
                    {files.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            此文件夹为空
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {files.map((file, index) => (
                                <FileItem
                                    key={index}
                                    file={file}
                                    bucket={bucket}
                                    currentPrefix={currentPrefix}
                                    onFolderClick={navigateToFolder}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 上传模态框 */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">上传文件</h3>
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">选择要上传的文件:</label>
                            <input
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded mb-4">
                            <p className="text-gray-500">或者将文件拖到此处</p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded mr-2"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 上传状态指示器 */}
            {renderUploadStatus()}
        </div>
    );
} 