import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Head from 'next/head';

interface InfoItemProps {
    label: string;
    value: string | boolean;
    isValid: boolean;
    note?: string;
}

interface EnvironmentVariable {
    value: string | null;
    mask: boolean;
    status: string;
}

interface EnvInfo {
    status: string;
    variables: {
        QINIU_ACCESS_KEY: EnvironmentVariable;
        QINIU_SECRET_KEY: EnvironmentVariable;
        NODE_ENV: EnvironmentVariable;
    };
}

interface SdkInfo {
    status: string;
    connected: boolean;
    error: string | null;
}

interface BucketInfo {
    status: string;
    list: Array<{ name: string; region: string | null; private: boolean; }> | null;
    error: string | null;
}

interface DomainInfo {
    status: string;
    bucketDomains: Record<string, string[] | { error: string }>;
    error: string | null;
}

interface SystemInfo {
    nodeVersion: string;
    qiniuSdkVersion: string;
    serverTime: string;
    nextjsVersion: string;
}

interface DebugResponse {
    env: EnvInfo;
    sdk: SdkInfo;
    buckets: BucketInfo;
    domains: DomainInfo;
    system: SystemInfo;
}

export default function DebugPage(): React.ReactElement {
    const [debugInfo, setDebugInfo] = useState<DebugResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [testBucket, setTestBucket] = useState<string>('');
    const [testKey, setTestKey] = useState<string>('');
    const router = useRouter();
    const {bucket, key} = router.query;

    useEffect(() => {
        // 从URL参数中获取测试参数
        if (bucket) setTestBucket(typeof bucket === 'string' ? bucket : '');
        if (key) setTestKey(typeof key === 'string' ? key : '');

        async function fetchEnvironmentInfo() {
            try {
                // 包含测试参数，如果有
                let url = '/api/debug';
                if (bucket && key) {
                    url += `?bucket=${encodeURIComponent(typeof bucket === 'string' ? bucket : '')}&key=${encodeURIComponent(typeof key === 'string' ? key : '')}`;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP错误 ${response.status}`);
                }
                const data = await response.json();
                setDebugInfo(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : '获取环境信息失败');
            } finally {
                setIsLoading(false);
            }
        }

        fetchEnvironmentInfo();
    }, [bucket, key]);

    // 处理表单提交
    const handleTestSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (testBucket && testKey) {
            // 使用路由来更新URL并重新加载
            router.push(`/debug?bucket=${encodeURIComponent(testBucket)}&key=${encodeURIComponent(testKey)}`);
        }
    };

    // 渲染状态标记
    const renderStatusBadge = (status: string): React.ReactNode => {
        if (status === 'success') {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded">正常</span>;
        } else if (status === 'warning') {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">警告</span>;
        } else {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded">错误</span>;
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
            <Head>
                <title>七牛云调试页面</title>
                <meta name="description" content="七牛云存储系统诊断工具"/>
            </Head>

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

                {debugInfo && (
                    <div className="space-y-4">
                        {/* 环境变量检查 */}
                        <div className="bg-white rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">环境变量状态 {renderStatusBadge(debugInfo.env.status)}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(debugInfo.env.variables).map(([key, value]) => (
                                    <div key={key} className="border rounded p-3">
                                        <div className="text-sm text-gray-500">{key}</div>
                                        <div className="flex items-center justify-between">
                                            <div className="font-mono text-sm truncate max-w-xs">
                                                {value.value ? (value.mask ? '********' : value.value) :
                                                    <span className="text-red-500">未设置</span>}
                                            </div>
                                            {renderStatusBadge(value.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SDK连接检查 */}
                        <div className="bg-white rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">七牛云SDK状态 {renderStatusBadge(debugInfo.sdk.status)}</h2>
                            <div className="mb-4">
                                <div className="text-gray-700">
                                    <strong>连接状态:</strong> {debugInfo.sdk.connected ? '成功' : '失败'}
                                </div>
                                {debugInfo.sdk.error && (
                                    <div className="mt-2 text-red-500">
                                        <strong>错误信息:</strong> {debugInfo.sdk.error}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 存储桶信息 */}
                        {debugInfo.buckets && (
                            <div className="bg-white rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">存储桶信息</h2>
                                {debugInfo.buckets.error ? (
                                    <div className="text-red-500">{debugInfo.buckets.error}</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    存储桶名称
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    区域
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    公开访问
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    操作
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {debugInfo.buckets.list && debugInfo.buckets.list.map((bucket, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{bucket.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                        {bucket.region || '默认'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {bucket.private === false ? (
                                                            <span
                                                                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  公开
                                </span>
                                                        ) : (
                                                            <span
                                                                className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                  私有
                                </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <Link
                                                            href={`/bucket/${bucket.name}`}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            打开存储桶
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 域名信息 */}
                        {debugInfo.domains && (
                            <div className="bg-white rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4">存储桶域名</h2>
                                {debugInfo.domains.error ? (
                                    <div className="text-red-500">{debugInfo.domains.error}</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    存储桶名称
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    域名列表
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {Object.entries(debugInfo.domains.bucketDomains || {}).map(([bucketName, domains]) => (
                                                <tr key={bucketName}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{bucketName}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {Array.isArray(domains) && domains.length > 0 ? (
                                                            <ul className="list-disc pl-5">
                                                                {domains.map((domain, index) => (
                                                                    <li key={index} className="text-gray-600">
                                                                        {domain.startsWith('http') ? (
                                                                            <a
                                                                                href={domain}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-600 hover:underline"
                                                                            >
                                                                                {domain}
                                                                            </a>
                                                                        ) : (
                                                                            domain
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-gray-500">无可用域名</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 系统信息 */}
                        <div className="bg-white rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">系统信息</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded p-3">
                                    <div className="text-sm text-gray-500">Node.js 版本</div>
                                    <div className="font-mono">{debugInfo.system.nodeVersion}</div>
                                </div>
                                <div className="border rounded p-3">
                                    <div className="text-sm text-gray-500">七牛云 SDK 版本</div>
                                    <div className="font-mono">{debugInfo.system.qiniuSdkVersion}</div>
                                </div>
                                <div className="border rounded p-3">
                                    <div className="text-sm text-gray-500">Next.js 版本</div>
                                    <div className="font-mono">{debugInfo.system.nextjsVersion || '未知'}</div>
                                </div>
                                <div className="border rounded p-3">
                                    <div className="text-sm text-gray-500">服务器时间</div>
                                    <div className="font-mono">{debugInfo.system.serverTime}</div>
                                </div>
                            </div>
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
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({label, value, isValid, note}: InfoItemProps): React.ReactElement {
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
    );
} 