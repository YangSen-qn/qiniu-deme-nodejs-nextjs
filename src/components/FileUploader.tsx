'use client'

import {useState} from 'react'

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
            // Get upload token
            const tokenResponse = await fetch(`/api/upload?bucket=${bucketName}`)
            const {token} = await tokenResponse.json()

            // Create form data
            const formData = new FormData()
            formData.append('token', token)
            formData.append('file', file)
            formData.append('key', file.name)

            // Upload to Qiniu
            const uploadResponse = await fetch('http://upload.qiniup.com', {
                method: 'POST',
                body: formData,
            })

            if (!uploadResponse.ok) {
                throw new Error('Upload failed')
            }

            setProgress(100)
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