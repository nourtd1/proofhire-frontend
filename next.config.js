/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  compress: true,
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
