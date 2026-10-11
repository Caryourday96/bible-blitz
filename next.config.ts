import type { NextConfig } from 'next';
const staticExport = process.env.STATIC_EXPORT === 'true';
const config: NextConfig = {
  poweredByHeader: false,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  ...(staticExport ? { output: 'export' as const, images: { unoptimized: true } } : {}),
  headers: staticExport
    ? undefined
    : async () => {
        return [
          {
            source: '/:path*',
            headers: [
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            ],
          },
          {
            source: '/tv',
            headers: [
              { key: 'X-Frame-Options', value: '' },
              {
                key: 'Content-Security-Policy',
                value: "frame-ancestors 'self' https://ff.adeticket.com",
              },
            ],
          },
        ];
      },
};
export default config;
