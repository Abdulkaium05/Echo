
import type {NextConfig} from 'next';

// Invalidate cache
const nextConfig: NextConfig = {
  /* config options here */
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
    allowedDevOrigins: [
        "6000-firebase-echobeta-1764480590173.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev",
        "9000-firebase-echobeta-1764480590173.cluster-w5vd22whf5gmav2vgkomwtc4go.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
