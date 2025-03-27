import './globals.css'
import type {Metadata} from 'next'

export const metadata: Metadata = {
    title: 'Qiniu Storage Manager',
    description: 'A Next.js application for managing Qiniu storage',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-8">
            {children}
        </main>
        </body>
        </html>
    )
} 