'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { formatMoney } from '@/lib/utils';

// Import Komponen Widget
import Timer from '@/components/Timer';
import HabitTracker from '@/components/HabitTracker';
import Wellness from '@/components/Wellness';
import InboxWidget from '@/components/InboxWidget';

export default function Dashboard() {
    const { user } = useAuth();
    
    // States untuk Data
    const [stats, setStats] = useState({ xp: 0, level: 1 });
    const [finance, setFinance] = useState({ balance: 0 });

    // 1. Fetch Data Realtime (Stats & Finance)
    useEffect(() => {
        if (!user) return;
        
        // A. Profile Stats (XP & Level)
        const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'profile'), (d) => {
            if (d.exists()) setStats(d.data());
        });

        // B. Finance Stats (Saldo)
        const unsubFinance = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'finance'), (d) => {
            if (d.exists()) setFinance(d.data());
        });

        // Cleanup function (Hanya membersihkan listener yang aktif)
        return () => { unsubStats(); unsubFinance(); };
    }, [user]);

    // Kalkulasi Persentase Bar Level
    const xpBase = (stats.level - 1) * 100;
    const xpCurrent = stats.xp - xpBase;
    const progressPercent = Math.min(Math.max(xpCurrent, 0), 100);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            
            {/* GRID LAYOUT (12 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
    
                {/* --- LEFT COLUMN (HERO, TIMER, INBOX) --- */}
                <div className="md:col-span-7 flex flex-col gap-6 stagger-1">
                    
                    {/* 1. Hero Card (Level & Progress) */}
                    <div className="relative overflow-hidden rounded-3xl p-8 min-h-[180px] flex flex-col justify-between border border-white/10 shadow-2xl">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 z-0"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-1">Focus on what matters.</h2>
                            <p className="text-sm text-slate-400">Level {stats.level} • {stats.xp} XP to next level</p>
                        </div>
                        
                        <div className="relative z-10 mt-6">
                            <div className="flex justify-between text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                                <span>Progress</span>
                                <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-slate-950/50 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/5">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Timer (Smart Focus) */}
                    <div className="glass-card p-1">
                        <Timer />
                    </div>

                    {/* 3. Inbox Widget (Updated) */}
                    <InboxWidget />
                </div>

                {/* --- RIGHT COLUMN (WIDGETS) --- */}
                <div className="md:col-span-5 flex flex-col gap-6 stagger-2">
                    
                    {/* 4. Finance Mini Widget */}
                    <Link href="/finance" className="group glass-card p-6 flex items-center justify-between cursor-pointer hover:border-emerald-500/30">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cashflow</p>
                            <h3 className="text-2xl font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">{formatMoney(finance.balance || 0)}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-rounded">wallet</span>
                        </div>
                    </Link>

                    {/* 5. Wellness Widget */}
                    <Wellness />

                    {/* 6. Habit Tracker Widget */}
                    <HabitTracker />

                    {/* 7. Link ke Log */}
                    <Link href="/log" className="glass-card p-4 flex flex-col justify-center items-center text-center hover:bg-slate-800/50 transition-colors cursor-pointer group">
                        <span className="material-symbols-rounded text-3xl text-slate-600 mb-2 group-hover:text-blue-400 transition-colors">history_edu</span>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-white">View Activity Log</h3>
                    </Link>

                </div>
            </div>
        </div>
    );
}