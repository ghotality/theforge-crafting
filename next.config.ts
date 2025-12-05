import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 80, 96, 128, 256, 384],
    minimumCacheTTL: 0, // Cache desativado para evitar imagens antigas
    qualities: [75, 85],
    unoptimized: false,
    dangerouslyAllowSVG: false,
    // Permite query strings para cache busting em imagens locais
    localPatterns: [
      {
        pathname: '/weapons/**',
        search: '?v=*',
      },
      {
        pathname: '/items/**',
        search: '?v=*',
      },
      {
        pathname: '/ores/**',
        search: '?v=*',
      },
      {
        // Permite outras imagens na raiz (como forge.png, logo, etc)
        pathname: '/**',
      },
    ],
  },
  // Headers para controlar cache do navegador
  async headers() {
    return [
      {
        // Aplica headers para imagens de weapons e items (armors)
        source: '/:path(weapons|items)/:image*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
