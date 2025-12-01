'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ user, logout }) {
    const pathname = usePathname();

    const NavItem = ({ href, icon, label }) => {
        const isActive = pathname.startsWith(href);
        return (
            <Link href={href} className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
                
                {/* Active Indicator (Glow) */}
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 opacity-100"></div>
                )}

                <span className={`material-symbols-rounded text-xl relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`}>{icon}</span>
                <span className="text-sm font-medium hidden md:block relative z-10">{label}</span>
            </Link>
        );
    };

    return (
        <nav className="hidden md:flex w-64 bg-slate-950 border-r border-white/5 flex-col justify-between h-screen sticky top-0 z-40">
            <div className="p-6">
                {/* User Profile Card */}
                <div className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-slate-900/50 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-bold text-lg">{user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="text-sm font-bold text-white truncate">{user?.displayName?.split(' ')[0] || 'User'}</h2>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-400 font-mono">Online</p>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</p>
                    <NavItem href="/dashboard" icon="dashboard" label="Dashboard" />
                    <NavItem href="/projects" icon="splitscreen" label="Projects" />
                    <NavItem href="/goals" icon="flag" label="Goals" />
                    <NavItem href="/notes" icon="psychology" label="Second Brain" />
                    <NavItem href="/second-brain-chat" icon="chat" label="Second Brain Chat" />
                    <NavItem href="/library" icon="local_library" label="Library" />
                    <NavItem href="/finance" icon="account_balance_wallet" label="Finance" />
                    /second-brain-chat
                </div>
            </div>
            
            <div className="p-4 border-t border-white/5">
                <NavItem href="/settings" icon="settings" label="Settings" />
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all group">
                     <span className="material-symbols-rounded text-xl group-hover:rotate-90 transition-transform">power_settings_new</span>
                     <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>
                </button>
            </div>
        </nav>
    );
}