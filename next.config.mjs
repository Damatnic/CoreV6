/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for Vercel
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.astralcore.app',
      },
    ],
    minimumCacheTTL: 60,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://r2cdn.perplexity.ai https://*.vercel.app; connect-src 'self' wss: ws: https:; media-src 'self' blob:",
          },
        ],
      },
    ];
  },

  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      ...nextConfig.experimental,
    },
  }),

  // Output configuration for Vercel
  // output: 'standalone', // Enable for self-hosting, disable for Vercel

  // Error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration  
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack (keep minimal to avoid platform issues)
  webpack: (config, { dev }) => {
    // Disable filesystem cache to avoid readlink/snapshot issues on Windows
    config.cache = false;
    if (!dev) {
      config.devtool = 'source-map';
    }
    return config;
  },

  // Production optimizations
  poweredByHeader: false,
  
  // Generate optimized builds
  generateBuildId: async () => {
    const timestamp = Date.now();
    const shortHash = timestamp.toString(36);
    return `build_${shortHash}`;
  },
};

export default nextConfig;
