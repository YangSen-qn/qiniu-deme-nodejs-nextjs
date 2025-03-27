'use client'

import {useState} from 'react'
import FileItem from '@/components/FileItem'
import FileUploader from '@/components/FileUploader'

interface BucketClientProps {
    bucketName: string
    initialFiles: any[]
}

export default function BucketClient({bucketName, initialFiles}: BucketClientProps) {
    const [files, setFiles] = useState(initialFiles)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const refreshFiles = async () => {
        setIsRefreshing(true)
        try {
            const response = await fetch(`/api/files?bucket=${bucketName}`)
            const data = await response.json()
            if (data.files) {
                setFiles(data.files)
            }
        } catch (error) {
            console.error('Failed to refresh files:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Files</h2>
                    <button
                        onClick={refreshFiles}
                        disabled={isRefreshing}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-sm flex items-center"
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh Files'}
                    </button>
                </div>
                <div className="space-y-4">
                    {files.map((file: any) => (
                        <FileItem
                            key={file.key}
                            file={file}
                            bucketName={bucketName}
                        />
                    ))}
                    {files.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No files found in this bucket</p>
                    )}
                </div>
            </div>

            <FileUploader
                bucketName={bucketName}
                onUploadComplete={refreshFiles}
            />
        </>
    )
} 