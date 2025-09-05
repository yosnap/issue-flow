/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Required for Docker deployment
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  images: {
    // Optimize images for production
    domains: [],
    unoptimized: false,
  },
  // Enable compression in production
  compress: true,
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Enable strict mode
  reactStrictMode: true,
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig