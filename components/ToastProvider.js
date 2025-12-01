'use client';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      toastOptions={{
        // Default Style untuk semua toast
        style: {
          background: 'rgba(30, 41, 59, 0.8)', // Slate-800 + Opacity
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        },
        // Custom Icon Theme
        success: {
          iconTheme: {
            primary: '#10b981', // Emerald-500
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#f43f5e', // Rose-500
            secondary: '#fff',
          },
        },
      }}
    />
  );
}