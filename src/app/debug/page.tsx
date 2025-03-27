'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {useRouter, useSearchParams} from 'next/navigation'

export default function DebugPage() {
    const [envInfo, setEnvInfo] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [testBucket, setTestBucket] = useState('')
    const [testKey, setTestKey] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        // 从URL参数中获取测试参数
        const bucket = searchParams.get('bucket')
        const key = searchParams.get('key')

        if (bucket) setTestBucket(bucket)
        if (key) setTestKey(key)

        async function fetchEnvironmentInfo() {
            try {
                // 包含测试参数，如果有
                let url = '/api/debug'
                if (bucket && key) {
                    url += `?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`
                }

                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error(`HTTP错误 ${response.status}`)
                }
                const data = await response.json()
                setEnvInfo(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : '获取环境信息失败')
            } finally {
                setIsLoading(false)
            }
        }

        fetchEnvironmentInfo()
    }, [searchParams])

    // 处理表单提交
    const handleTestSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (testBucket && testKey) {
            // 使用路由来更新URL并重新加载
            router.push(`/debug?bucket=${encodeURIComponent(testBucket)}&key=${encodeURIComponent(testKey)}`)
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">七牛云调试页面</h1>
                <Link
                    href="/"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                >
                    返回首页
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">环境信息</h2>

                {isLoading && (
                    <p className="text-gray-500">加载中...</p>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                        <p className="font-medium">错误</p>
                        <p>{error}</p>
                    </div>
                )}

                {envInfo && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem
                                label="QINIU_ACCESS_KEY"
                                value={envInfo.accessKey ? '已设置' : '未设置'}
                                isValid={!!envInfo.accessKey}
                            />
                            <InfoItem
                                label="QINIU_SECRET_KEY"
                                value={envInfo.secretKey ? '已设置' : '未设置'}
                                isValid={!!envInfo.secretKey}
                            />
                            <InfoItem
                                label="QINIU_BUCKET_DOMAIN (环境变量)"
                                value={envInfo.configuredDomain || '未设置'}
                                isValid={true}
                                note="可选配置，如果不设置将自动获取域名"
                            />
                            <InfoItem
                                label="节点环境"
                                value={envInfo.nodeEnv || '未知'}
                                isValid={true}
                            />
                        </div>

                        <h3 className="text-lg font-medium mt-6 mb-2">连接测试</h3>
                        <div className="space-y-2">
                            <InfoItem
                                label="七牛云SDK连接"
                                value={envInfo.sdkConnection ? '成功' : '失败'}
                                isValid={envInfo.sdkConnection}
                            />
                            <InfoItem
                                label="存储桶列表"
                                value={
                                    envInfo.buckets
                                        ? Array.isArray(envInfo.buckets)
                                            ? envInfo.buckets.join(', ')
                                            : JSON.stringify(envInfo.buckets)
                                        : '无法获取'
                                }
                                isValid={Array.isArray(envInfo.buckets) && envInfo.buckets.length > 0}
                            />
                        </div>

                        {envInfo.bucketDomains && Object.keys(envInfo.bucketDomains).length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-medium mb-2">存储桶信息</h3>
                                <div className="space-y-3">
                                    {envInfo.buckets && Array.isArray(envInfo.buckets) ? (
                                        envInfo.buckets.map((bucket: string) => (
                                            <div key={bucket} className="p-3 border rounded-md">
                                                <h4 className="font-medium">{bucket}</h4>

                                                {/* 访问类型 */}
                                                {envInfo.bucketAccessTypes && envInfo.bucketAccessTypes[bucket] && (
                                                    <div className="flex items-center mt-2">
                                                        <span className="text-sm mr-2">访问类型:</span>
                                                        <span className={
                                                            envInfo.bucketAccessTypes[bucket].isPrivate
                                                                ? "text-orange-600 text-sm font-medium"
                                                                : "text-green-600 text-sm font-medium"
                                                        }>
                              {envInfo.bucketAccessTypes[bucket].isPrivate ? '私有' : '公开'}
                            </span>
                                                    </div>
                                                )}

                                                {/* 域名列表 */}
                                                {envInfo.bucketDomains[bucket] && (
                                                    <div className="mt-2">
                                                        <p className="text-sm font-medium">域名:</p>
                                                        {Array.isArray(envInfo.bucketDomains[bucket]) && envInfo.bucketDomains[bucket].length > 0 ? (
                                                            <ul className="mt-1 text-sm space-y-1">
                                                                {envInfo.bucketDomains[bucket].map((domain: string, index: number) => (
                                                                    <li key={index} className="text-gray-600">
                                                                        {domain}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-gray-500">无可用域名</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">无可用存储桶信息</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800">
                                <strong>提示：</strong> 七牛云存储桶域名现在会自动获取，不需要在环境变量中配置
                                QINIU_BUCKET_DOMAIN。
                                如果自动获取的域名不正确，您仍可以通过环境变量手动设置。
                            </p>
                        </div>

                        {/* 测试表单 */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">下载链接测试</h3>
                            <form onSubmit={handleTestSubmit} className="p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">存储桶名称</label>
                                        <input
                                            type="text"
                                            value={testBucket}
                                            onChange={(e) => setTestBucket(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                            placeholder="输入存储桶名称"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">文件Key</label>
                                        <input
                                            type="text"
                                            value={testKey}
                                            onChange={(e) => setTestKey(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                            placeholder="输入文件的Key"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    disabled={!testBucket || !testKey}
                                >
                                    测试下载链接
                                </button>
                            </form>
                        </div>

                        {/* 测试结果 */}
                        {envInfo.testResults && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-lg font-medium mb-2">测试结果</h3>

                                {envInfo.testResults.error ? (
                                    <div className="text-red-600">
                                        <p><strong>错误:</strong> {envInfo.testResults.error}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm">
                                            <strong>存储桶:</strong> {envInfo.testResults.bucket}
                                        </p>
                                        <p className="text-sm">
                                            <strong>文件Key:</strong> {envInfo.testResults.key}
                                        </p>
                                        <p className="text-sm">
                                            <strong>存储桶类型:</strong>
                                            <span
                                                className={envInfo.testResults.isPrivate ? "text-orange-600 ml-1" : "text-green-600 ml-1"}>
                        {envInfo.testResults.isPrivate ? '私有' : '公开'}
                      </span>
                                        </p>

                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm font-medium">推荐下载链接:</p>
                                                <a
                                                    href={envInfo.testResults.recommendedUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 text-sm break-all hover:underline"
                                                >
                                                    {envInfo.testResults.recommendedUrl}
                                                </a>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium">公开链接:</p>
                                                <a
                                                    href={envInfo.testResults.publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 text-sm break-all hover:underline"
                                                >
                                                    {envInfo.testResults.publicUrl}
                                                </a>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium">私有链接 (带签名):</p>
                                                <a
                                                    href={envInfo.testResults.privateUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 text-sm break-all hover:underline"
                                                >
                                                    {envInfo.testResults.privateUrl}
                                                </a>
                                            </div>
                                        </div>

                                        {envInfo.testResults.note && (
                                            <p className="text-sm bg-yellow-50 p-2 border border-yellow-100 rounded">
                                                <strong>注意:</strong> {envInfo.testResults.note}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

interface InfoItemProps {
    label: string
    value: string
    isValid: boolean
    note?: string
}

function InfoItem({label, value, isValid, note}: InfoItemProps) {
    return (
        <div className="flex flex-col p-3 border rounded-md">
            <div className="flex items-center justify-between">
                <span className="font-medium">{label}:</span>
                <div className="flex items-center">
          <span className={isValid ? 'text-green-600' : 'text-red-600'}>
            {value}
          </span>
                    <span className="ml-2">
            {isValid
                ? <span className="text-green-500">✓</span>
                : <span className="text-red-500">✗</span>}
          </span>
                </div>
            </div>
            {note && (
                <span className="text-xs text-gray-500 mt-1">{note}</span>
            )}
        </div>
    )
} 