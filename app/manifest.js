export default function manifest() {
  return {
    name: 'Singgih Life OS',
    short_name: 'Life OS',
    description: 'Personal Control & Clarity',
    start_url: '/dashboard', // Masuk langsung ke dashboard
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: 'https://ui-avatars.com/api/?name=Life+OS&background=3b82f6&color=fff&size=192&rounded=true',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://ui-avatars.com/api/?name=Life+OS&background=3b82f6&color=fff&size=512&rounded=true',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}