/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 הוספת משתני סביבה קשיחים לבנייה
  env: {
    NEXT_PUBLIC_API_URL: 'https://escapevr-server.onrender.com',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dh1lickcoh/**', // וודאי שזה ה-Cloud Name שלך
      },
    ],
  },
};

export default nextConfig;