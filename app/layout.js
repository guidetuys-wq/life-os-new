// app/layout.js
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ToastProvider from '@/components/ToastProvider';

export const metadata = {
  title: 'Life OS',
  description: 'Personal Control & Clarity System',
  manifest: '/manifest.webmanifest',
  // [NEW] Apple Web App Meta
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Life OS',
  },
  // [NEW] Open Graph untuk sharing link yang cantik
  openGraph: {
    title: 'Life OS',
    description: 'My personal productivity system.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // UX Mobile App feel
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* [MODERN TYPOGRAPHY] Load Plus Jakarta Sans & JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />
      </head>
      {/* Font Feature Settings diaktifkan via globals.css */}
      <body className="antialiased selection:bg-blue-500/30 selection:text-white">
        <AuthProvider>
            <ToastProvider />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}