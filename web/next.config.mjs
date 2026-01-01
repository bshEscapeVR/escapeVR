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
  // 1. הוספת המיפוי הזה מכריחה את המשתנה להיכנס לתוך ה-Build
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dh1lickcoh/**',
      },
      // הוספנו גם את השרת שלך ליתר ביטחון (למקרה שיש תמונות משם)
      {
        protocol: 'https',
        hostname: 'escapevr-server.onrender.com', 
      }
    ],
  },
};

export default nextConfig;
