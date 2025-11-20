import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para Docker - genera build optimizado
  output: 'standalone',
  
  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
