/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  allowedDevOrigins: ['127.0.0.1'],
  serverExternalPackages: ['@lancedb/lancedb'],
  /* config options here */
};

export default nextConfig;
