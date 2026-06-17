import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // build static → out/ (Vercel Hobby)
  reactCompiler: true,
  images: { unoptimized: true }, // bắt buộc khi static export
};

export default nextConfig;
