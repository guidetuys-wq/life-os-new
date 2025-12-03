'use client';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center" // [FIX] Pindah ke atas agar tidak bentrok dengan Mobile Nav
      reverseOrder={false}
      containerStyle={{
        zIndex: 99999, // [FIX] Pastikan selalu di atas Modal/Overlay apapun
        top: 20, // Sedikit jarak dari atas
      }}
      toastOptions={{
        // Durasi default yang nyaman dibaca
        duration: 4000, 
        
        // Default Style untuk semua toast (Glassmorphism)
        style: {
          background: 'rgba(15, 23, 42, 0.9)', // Slate-900 + High Opacity
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#e2e8f0', // Slate-200
          padding: '12px 16px',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
          maxWidth: '400px',
        },
        
        // Custom Icon Theme
        success: {
          iconTheme: {
            primary: '#10b981', // Emerald-500
            secondary: '#fff',
          },
          style: {
            border: '1px solid rgba(16, 185, 129, 0.2)', // Green Border Glow
          }
        },
        error: {
          iconTheme: {
            primary: '#f43f5e', // Rose-500
            secondary: '#fff',
          },
          style: {
            border: '1px solid rgba(244, 63, 94, 0.2)', // Red Border Glow
          }
        },
        loading: {
          style: {
            border: '1px solid rgba(59, 130, 246, 0.2)', // Blue Border Glow
          }
        }
      }}
    />
  );
}