export default function Loading() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                                </div>
                                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
} 