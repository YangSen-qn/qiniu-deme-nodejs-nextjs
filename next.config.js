/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    QINIU_ACCESS_KEY: process.env.QINIU_ACCESS_KEY,
    QINIU_SECRET_KEY: process.env.QINIU_SECRET_KEY,
  },
  // 添加webpack配置处理Node.js模块
  webpack: (config, { isServer }) => {
    // 如果是客户端打包
    if (!isServer) {
      // 将node模块标记为空模块
      config.resolve.fallback = {
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        os: false,
        util: false,
        assert: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 