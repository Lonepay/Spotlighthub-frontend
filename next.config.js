/** @type {import('next').NextConfig} */
const allowedImageDomains = (process.env.NEXT_PUBLIC_IMAGE_DOMAIN || '')
  .split(',')
  .map((d) => d.trim().replace(/^https?:\/\//, ''))
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '127.0.0.1', 'images.unsplash.com', ...allowedImageDomains],
    unoptimized: true,
  },
}

module.exports = nextConfig

