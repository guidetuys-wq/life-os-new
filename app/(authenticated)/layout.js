// app/(authenticated)/layout.js
'use client';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';

export default function AuthenticatedLayout({ children }) {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
            {/* Global Shortcut Listener */}
            <CommandPalette />
            
            <Sidebar user={user} logout={logout} />
            <main className="flex-1 relative overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scroll-smooth">
                <Header />
                {children}
            </main>
            <MobileNav />
        </div>
    );
}