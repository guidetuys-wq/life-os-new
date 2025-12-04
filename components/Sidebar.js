'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link'; // Button bisa handle link, tapi sidebar butuh custom class active

// Import Modular Components
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function Sidebar({ user, logout }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeZone, setActiveZone] = useState('focus');

    // Custom NavItem (Karena butuh logika active state yang spesifik)
    const NavItem = ({ href, icon, label, exact = false }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        
        return (
            <Link 
                href={href} 
                className={`
                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden
                    ${isActive ? 'text-white shadow-lg shadow-blue-900/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                    ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? label : ''}
            >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-600/5 border border-blue-500/30 rounded-xl"></div>}
                <span className={`material-symbols-rounded text-[22px] relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`}>{icon}</span>
                {!isCollapsed && <span className={`text-sm font-semibold tracking-wide relative z-10 whitespace-nowrap opacity-100 transition-opacity duration-300 ${isActive ? 'text-white' : ''}`}>{label}</span>}
            </Link>
        );
    };

    const menuItems = {
        focus: [
            { href: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
            { href: '/projects', icon: 'splitscreen', label: 'Projects' },
            { href: '/goals', icon: 'flag', label: 'Life Goals' },
            { href: '/log', icon: 'history', label: 'Activity Log' },
        ],
        life: [
            { href: '/notes', icon: 'psychology', label: 'Second Brain' },
            { href: '/second-brain-chat', icon: 'smart_toy', label: 'AI Assistant' },
            { href: '/finance', icon: 'account_balance_wallet', label: 'Finance' },
            { href: '/library', icon: 'local_library', label: 'Library' },
        ]
    };

    return (
        <nav className={`hidden md:flex bg-slate-950/50 backdrop-blur-xl border-r border-white/5 flex-col justify-between h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
            <div className="p-4 flex flex-col h-full">
                
                {/* 1. Header User */}
                <div className={`flex items-center mb-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar src={user?.photoURL} name={user?.displayName} size="md" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white truncate">{user?.displayName?.split(' ')[0]}</span>
                                <Badge variant="info" size="sm">Lvl {user?.level || 1}</Badge>
                            </div>
                        </div>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        icon={isCollapsed ? 'dock_to_right' : 'dock_to_left'} 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                    />
                </div>

                {/* 2. Zone Tabs */}
                {!isCollapsed ? (
                    <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5 mb-6">
                        <button onClick={() => setActiveZone('focus')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeZone === 'focus' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <span className="material-symbols-rounded text-base">rocket_launch</span> Focus
                        </button>
                        <button onClick={() => setActiveZone('life')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeZone === 'life' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                            <span className="material-symbols-rounded text-base">spa</span> Life
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mb-6 border-b border-white/5 pb-4">
                        <Button variant={activeZone === 'focus' ? 'primary' : 'ghost'} size="icon" icon="rocket_launch" onClick={() => setActiveZone('focus')} />
                        <Button variant={activeZone === 'life' ? 'success' : 'ghost'} size="icon" icon="spa" onClick={() => setActiveZone('life')} />
                    </div>
                )}
                
                {/* 3. Menu List */}
                <div className="flex-1 space-y-1 overflow-y-auto custom-scroll px-1">
                    {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{activeZone === 'focus' ? 'Work & Strategy' : 'Balance & Growth'}</p>}
                    {menuItems[activeZone].map((item) => <NavItem key={item.href} {...item} />)}
                </div>

                {/* 4. Footer */}
                <div className={`mt-4 pt-4 border-t border-white/5 ${isCollapsed ? 'items-center' : ''} flex flex-col gap-1`}>
                    <NavItem href="/settings" icon="tune" label="Settings" />
                    <NavItem href="/trash" icon="delete" label="Trash" />
                    <Button 
                        variant="ghost" 
                        className={`mt-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 ${isCollapsed ? 'px-0 justify-center' : 'justify-start px-3'}`}
                        onClick={logout}
                    >
                        <span className="material-symbols-rounded text-[22px]">logout</span>
                        {!isCollapsed && <span className="text-sm font-semibold ml-3">Log Out</span>}
                    </Button>
                </div>
            </div>
        </nav>
    );
}