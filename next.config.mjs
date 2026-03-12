/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloud Run will provide PORT; Next.js uses this internally in production.
  output: 'standalone'
};

export default nextConfig;
