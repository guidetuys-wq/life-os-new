// app/layout.js
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ToastProvider from '@/components/ToastProvider';

export const metadata = {
  title: 'Singgih Life OS',
  description: 'Personal Control & Clarity',
  manifest: '/manifest.webmanifest', // Next.js generate ini otomatis dari file manifest.js
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom di HP
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Load Google Fonts & Icons */}
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
            <ToastProvider />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}