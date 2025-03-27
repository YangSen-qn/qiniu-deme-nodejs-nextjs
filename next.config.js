/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    QINIU_ACCESS_KEY: process.env.QINIU_ACCESS_KEY,
    QINIU_SECRET_KEY: process.env.QINIU_SECRET_KEY,
  },
}

module.exports = nextConfig 