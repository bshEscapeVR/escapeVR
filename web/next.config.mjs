/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force env var into client bundle (with fallback for safety)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://escapevr-server.onrender.com',
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dh1lickcoh/**',
      },
    ],
  },
};

export default nextConfig;
