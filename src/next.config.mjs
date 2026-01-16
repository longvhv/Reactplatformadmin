/** @type {import('next').NextConfig} */

// ✅ BUNDLE ANALYZER - Enable with ANALYZE=true npm run build
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  
  // Internationalization
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en', 'es', 'zh', 'ja', 'ko'],
    localeDetection: true,
  },

  // Image optimization
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Performance optimizations
  swcMinify: true,
  poweredByHeader: false,

  // Environment variables
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api/v1',
  },

  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add custom webpack config here if needed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // ✅ OPTIMIZE BUNDLE SPLITTING
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Separate chunk for Radix UI components
          radixui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radixui',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Separate chunk for React Query
          query: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
            name: 'react-query',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Separate chunk for charts
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
            name: 'charts',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common chunk for shared code
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            name: 'common',
          },
        },
      },
    };
    
    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
  
  // ✅ PRODUCTION OPTIMIZATIONS
  productionBrowserSourceMaps: false, // Disable source maps in production
  compress: true, // Enable gzip compression
};

export default withBundleAnalyzer(nextConfig);