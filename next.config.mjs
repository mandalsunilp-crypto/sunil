/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Faster page routing
  skipTrailingSlashRedirect: true,

  // Package import optimization for faster compilation & smaller client bundles
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'clsx',
      'tailwind-merge',
      'zod',
    ],
    // Partial pre-rendering for instant shell renders
    ppr: false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cfyxvulzateipcpldemw.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Performance & Security Headers
  async headers() {
    return [
      {
        // Cache static assets for 1 year
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache API routes briefly
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Preconnect to key external services
          {
            key: 'Link',
            value: [
              '<https://cfyxvulzateipcpldemw.supabase.co>; rel=preconnect',
              '<https://fonts.googleapis.com>; rel=preconnect',
            ].join(', '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
