'use client'

import {useState} from 'react'
// 移除七牛SDK导入
// import * as qiniu from 'qiniu';

interface FileUploaderProps {
    bucketName: string
    onUploadComplete: () => void
}

export default function FileUploader({bucketName, onUploadComplete}: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setProgress(0)

        try {
            // 1. 获取上传令牌
            const tokenUrl = `/api/upload-token?bucket=${encodeURIComponent(bucketName)}&filename=${encodeURIComponent(file.name)}`;
            const tokenResponse = await fetch(tokenUrl);
            
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                throw new Error(errorData.error || '获取上传令牌失败');
            }
            
            const { token, uploadUrl, key } = await tokenResponse.json();

            // 2. 创建FormData用于上传
            const formData = new FormData();
            formData.append('token', token);
            if (key) formData.append('key', key);
            formData.append('file', file);

            // 3. 直接上传到七牛云服务器
            setProgress(10); // 开始上传

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            setProgress(90); // 快完成了

            if (!uploadResponse.ok) {
                throw new Error(`上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            const result = await uploadResponse.json();
            
            if (!result.key) {
                throw new Error('上传失败：未收到有效响应');
            }

            setProgress(100);
            alert('File uploaded successfully!')
            onUploadComplete()
        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to upload file. Please try again.')
        } finally {
            setUploading(false)
            setFile(null)
        }
    }

    return (
        <div className="border rounded-lg p-4 mt-4 bg-white">
            <h3 className="font-medium mb-3">Upload File</h3>

            <div className="space-y-4">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-100 file:text-gray-700
            hover:file:bg-gray-200"
                    disabled={uploading}
                />

                {file && (
                    <div className="text-sm text-gray-600">
                        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </div>
                )}

                {uploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{width: `${progress}%`}}
                        ></div>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={`px-4 py-2 rounded-md text-white ${
                        !file || uploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                    {uploading ? 'Uploading...' : 'Upload File'}
                </button>
            </div>
        </div>
    )
} 