/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  images: {
    remotePatterns: [],
  },
  // Ensure Three.js addons can be imported via dynamic import
  transpilePackages: [],
};

module.exports = nextConfig;
