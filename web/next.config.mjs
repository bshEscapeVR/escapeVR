// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'res.cloudinary.com',
//         pathname: '/dh1lickcoh/**',
//       },
//     ],
//   },
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 התיקון: אנחנו כותבים את הכתובת במפורש. זה מחייב את האתר להכיר אותה.
  env: {
    NEXT_PUBLIC_API_URL: 'https://escapevr-server.onrender.com',
  },
   async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'https://escapevr-server.onrender.com/v1/:path*',
      },
      {
        source: '/he/v1/:path*',
        destination: 'https://escapevr-server.onrender.com/v1/:path*',
      },
      {
        source: '/en/v1/:path*',
        destination: 'https://escapevr-server.onrender.com/v1/:path*',
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dh1lickcoh/**',
      },
      {
        protocol: 'https',
        hostname: 'escapevr-server.onrender.com', 
      }
    ],
  },
};

export default nextConfig;
