'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function MobileNav() {
    const pathname = usePathname();
    const [showMenu, setShowMenu] = useState(false);

    // 3. OPTIMIZED MOBILE NAV ITEM
    const NavItem = ({ href, icon, label }) => {
        const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard');
        
        return (
            <Link 
                href={href} 
                className={`
                    relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300
                    ${isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-2' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }
                `}
                aria-label={label} // Tetap aksesibel untuk screen reader
            >
                <span className={`material-symbols-rounded text-2xl ${isActive ? 'scale-110' : ''}`}>
                    {icon}
                </span>
                
                {/* Indikator aktif titik kecil di bawah (Opsional, pengganti teks) */}
                {isActive && (
                    <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-blue-500"></span>
                )}
            </Link>
        );
    };

    return (
        <>
            {/* --- MAIN FLOATING BAR --- */}
            <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center px-2 py-3 z-50 shadow-2xl safe-pb">
                <NavItem href="/dashboard" icon="dashboard" label="Home" />
                <NavItem href="/projects" icon="splitscreen" label="Project" />
                
                {/* FAB (Floating Action Button) - Shortcut Note */}
                <div className="relative -mt-8 group z-50">
                    <Link href="/notes" className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 border-4 border-slate-950 flex items-center justify-center active:scale-90 transition-transform">
                         <span className="material-symbols-rounded text-3xl">add</span>
                    </Link>
                </div>

                <NavItem href="/finance" icon="wallet" label="Dompet" />
                
                {/* Menu Toggle */}
                <button 
                    onClick={() => setShowMenu(true)} 
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${showMenu ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <span className="material-symbols-rounded text-2xl">menu</span>
                    <span className="text-[9px] font-bold">Menu</span>
                </button>
            </nav>

            {/* --- EXPANDED MENU MODAL --- */}
            {showMenu && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm md:hidden flex items-end animate-in slide-in-from-bottom-10 fade-in duration-200" 
                    onClick={() => setShowMenu(false)}
                >
                    <div className="bg-slate-900 w-full rounded-t-[2rem] p-6 border-t border-slate-700 pb-24" onClick={e => e.stopPropagation()}>
                        {/* Drag Handle Indicator */}
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-slate-700/50 rounded-full"></div>
                        </div>
                        
                        {/* Grid Menu */}
                        <div className="grid grid-cols-2 gap-4">
                            <MenuCard href="/goals" icon="flag" label="Life Goals" color="text-orange-400" close={() => setShowMenu(false)} />
                            <MenuCard href="/library" icon="local_library" label="Library" color="text-emerald-400" close={() => setShowMenu(false)} />
                            <MenuCard href="/notes" icon="psychology" label="Second Brain" color="text-purple-400" close={() => setShowMenu(false)} />
                            {/* [FIX] Link Settings sekarang benar mengarah ke /settings */}
                            <MenuCard href="/settings" icon="settings" label="Settings" color="text-blue-400" close={() => setShowMenu(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Sub-component untuk Kartu Menu (Agar kode lebih bersih)
function MenuCard({ href, icon, label, color, close }) {
    return (
        <Link 
            href={href} 
            onClick={close} 
            className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl flex flex-col items-center gap-3 border border-slate-700/50 transition-all active:scale-95"
        >
            <span className={`material-symbols-rounded text-3xl ${color}`}>{icon}</span>
            <span className="text-white font-bold text-sm">{label}</span>
        </Link>
    );
}