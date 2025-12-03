'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ children, onClose, isOpen }) {
    const [mounted, setMounted] = useState(false);

    // Pastikan hanya render di Client (karena butuh document.body)
    useEffect(() => {
        setMounted(true);
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Jangan render apapun jika belum mounted atau tidak open
    if (!isOpen || !mounted) return null;

    // Render Modal langsung ke document.body (Portal)
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            
            {/* Overlay Klik Luar */}
            <div className="absolute inset-0" onClick={onClose}></div>
            
            {/* Konten Modal */}
            <div 
                className="
                    bg-slate-900 border border-slate-700 rounded-3xl 
                    w-full max-w-lg shadow-2xl z-10 relative
                    flex flex-col
                    max-h-[85vh] /* Batas tinggi agar aman di layar kecil */
                "
                onClick={(e) => e.stopPropagation()} // Cegah klik tembus
            >
                {children}
            </div>
        </div>,
        document.body
    );
}