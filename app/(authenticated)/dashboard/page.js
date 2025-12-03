'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { formatMoney } from '@/lib/utils';

// Import Komponen Widget Dashboard
import Timer from '@/components/Timer';
import HabitTracker from '@/components/HabitTracker';
import Wellness from '@/components/Wellness';
import InboxWidget from '@/components/InboxWidget';

export default function Dashboard() {
    const { user } = useAuth();
    
    // States Data
    const [stats, setStats] = useState({ xp: 0, level: 1 });
    const [finance, setFinance] = useState({ balance: 0 });

    // 1. Fetch Data Realtime
    useEffect(() => {
        if (!user) return;
        
        // A. Profile Stats (XP & Level)
        const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'profile'), (d) => {
            if (d.exists()) setStats(d.data());
        });

        // B. Finance Stats (Hanya ambil saldo untuk display)
        const unsubFinance = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'finance'), (d) => {
            if (d.exists()) setFinance(d.data());
        });

        return () => { unsubStats(); unsubFinance(); };
    }, [user]);

    // Kalkulasi XP Logic
    const xpBase = (stats.level - 1) * 100;
    const xpCurrent = stats.xp - xpBase;
    const xpTarget = 100;
    const progressPercent = Math.min(Math.max((xpCurrent / xpTarget) * 100, 0), 100);
    const xpLeft = Math.max(xpTarget - xpCurrent, 0);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
    
                {/* --- KOLOM KIRI: FOKUS (8/12) --- */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* 1. Hero Card: Level & XP */}
                    <div className="relative overflow-hidden rounded-[2rem] p-8 border border-white/10 shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-950 z-0"></div>
                        <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] group-hover:bg-blue-500/30 transition-all duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest">
                                        Level {stats.level}
                                    </span>
                                    <span className="text-slate-400 text-xs font-mono">Rank: Explorer</span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-1 leading-tight">
                                    Keep Building, <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                        {user?.displayName?.split(' ')[0] || 'User'}
                                    </span>
                                </h2>
                            </div>

                            {/* XP Progress */}
                            <div className="w-full md:w-auto min-w-[200px]">
                                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2 font-mono">
                                    <span>{xpCurrent} / {xpTarget} XP</span>
                                    <span className="text-blue-400">{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/5 relative">
                                    <div className="absolute inset-0 w-full h-full bg-slate-800"></div>
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000 relative z-10" 
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-right">
                                    Butuh <span className="text-slate-300 font-bold">{xpLeft} XP</span> lagi untuk naik level
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Inbox Widget */}
                    <div className="h-full">
                        <InboxWidget />
                    </div>

                </div>

                {/* --- KOLOM KANAN: LIFE BALANCE (4/12) --- */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* 3. Timer */}
                    <div className="glass-card bg-slate-900/40 p-1">
                        <Timer />
                    </div>

                    {/* 4. Total Balance (Hanya Tampilan Angka, Tidak Ada Input/History) */}
                    <div className="glass-card p-5 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Balance</p>
                                <h3 className="text-2xl font-mono font-bold text-white">
                                    {formatMoney(finance.balance || 0)}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/20">
                                <span className="material-symbols-rounded">account_balance_wallet</span>
                            </div>
                        </div>
                        {/* Dekorasi Ikon */}
                        <div className="absolute -bottom-6 -right-6 text-emerald-900/10">
                            <span className="material-symbols-rounded text-9xl">payments</span>
                        </div>
                    </div>

                    {/* 5. Habit & Wellness */}
                    <div className="grid grid-cols-1 gap-6">
                        <Wellness />
                        <HabitTracker />
                    </div>

                    {/* 6. Log Link */}
                    <Link href="/log" className="group glass-card p-4 flex items-center justify-center gap-3 hover:bg-slate-800 border-dashed border-2 border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer">
                        <span className="material-symbols-rounded text-slate-500 group-hover:text-blue-400 transition-colors">history</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300">
                            Lihat Log Aktivitas
                        </span>
                    </Link>

                </div>
            </div>
        </div>
    );
}