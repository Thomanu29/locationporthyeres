import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['node-ical', 'rrule-temporal', 'temporal-polyfill'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wfhvxzyyjcrgcchlmrpn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
