/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
//   images: {
//   remotePatterns: [
//     {
//       protocol: 'https',
//       hostname: 'escapevr-server.onrender.com',
//       pathname: '/uploads/**',
//     },
//   ],
// },
};

export default nextConfig;
