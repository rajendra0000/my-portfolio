/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/my-portfolio', 
  assetPrefix: '/my-portfolio/', 
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
