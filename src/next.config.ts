
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
      }
    ],
  },
  experimental: {
    allowedDevOrigins: ["https://6000-firebase-echob-1764679135376.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev"]
  }
};

export default nextConfig;
