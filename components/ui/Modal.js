'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ children, onClose, isOpen }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        // [FIX] p-4 di mobile (biar ada jarak), tapi diatur agar modalnya bisa lebar
        // items-end (bottom sheet style) di mobile bisa jadi opsi, tapi center lebih aman untuk konsistensi
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div 
                className="
                    bg-slate-900 border border-slate-700 rounded-3xl 
                    w-full max-w-lg shadow-2xl z-10 relative
                    flex flex-col
                    max-h-[90vh] /* Sedikit lebih tinggi di mobile */
                    /* [FIX] Width penuh di mobile dengan sedikit margin */
                    w-[calc(100%-2rem)] md:w-full
                "
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}