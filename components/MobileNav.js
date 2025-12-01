'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function MobileNav() {
    const pathname = usePathname();
    const [showMenu, setShowMenu] = useState(false);

    const NavItem = ({ href, icon, label }) => {
        const isActive = pathname === href;
        return (
            <Link href={href} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
                <span className="material-symbols-rounded text-2xl">{icon}</span>
                <span className="text-[9px] font-bold">{label}</span>
            </Link>
        );
    };

    return (
        <>
            <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around items-center px-2 py-3 z-50 shadow-2xl safe-pb">
                <NavItem href="/dashboard" icon="dashboard" label="Home" />
                <NavItem href="/projects" icon="splitscreen" label="Project" />
                
                {/* FAB (Floating Action Button) Tengah */}
                <div className="relative -mt-8 group z-50">
                    <button className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 border-4 border-slate-950 flex items-center justify-center active:scale-90 transition-transform">
                         <Link href="/notes"><span className="material-symbols-rounded text-3xl">add</span></Link>
                    </button>
                </div>

                <NavItem href="/finance" icon="wallet" label="Dompet" />
                
                {/* Menu Toggle */}
                <button onClick={() => setShowMenu(true)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 text-slate-500 hover:text-slate-300`}>
                    <span className="material-symbols-rounded text-2xl">menu</span>
                    <span className="text-[9px] font-bold">Menu</span>
                </button>
            </nav>

            {/* Mobile Menu Modal (Pengganti Sidebar di HP) */}
            {showMenu && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm md:hidden flex items-end animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-slate-900 w-full rounded-t-[2rem] p-6 border-t border-slate-700 pb-24">
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-slate-700/50 rounded-full"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/goals" onClick={() => setShowMenu(false)} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 border border-slate-700">
                                <span className="material-symbols-rounded text-orange-400 text-3xl">flag</span>
                                <span className="text-white font-bold text-sm">Goals</span>
                            </Link>
                            <Link href="/library" onClick={() => setShowMenu(false)} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 border border-slate-700">
                                <span className="material-symbols-rounded text-emerald-400 text-3xl">local_library</span>
                                <span className="text-white font-bold text-sm">Library</span>
                            </Link>
                            <Link href="/notes" onClick={() => setShowMenu(false)} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 border border-slate-700">
                                <span className="material-symbols-rounded text-purple-400 text-3xl">psychology</span>
                                <span className="text-white font-bold text-sm">Notes</span>
                            </Link>
                             <Link href="/dashboard" onClick={() => setShowMenu(false)} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 border border-slate-700">
                                <span className="material-symbols-rounded text-blue-400 text-3xl">settings</span>
                                <span className="text-white font-bold text-sm">Settings</span>
                            </Link>
                        </div>

                        <button onClick={() => setShowMenu(false)} className="w-full mt-6 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold border border-slate-700">
                            Tutup Menu
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}