/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA saat coding biar ga cache agresif
});

const nextConfig = {
  reactStrictMode: true,
  // Konfigurasi tambahan jika perlu
};

export default withPWA(nextConfig);