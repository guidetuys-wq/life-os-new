'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatMoney } from '@/lib/utils';

// Import Widgets
import IdentityCard from '@/components/IdentityCard';
import Timer from '@/components/Timer';
import HabitTracker from '@/components/HabitTracker';
import Wellness from '@/components/Wellness';
import InboxWidget from '@/components/InboxWidget';

export default function Dashboard() {
    const { user } = useAuth();
    
    const { 
        isLoading, stats, finance, activeTasks, 
        activeProjects, identityData, setIdentityData, 
        projectCandidates 
    } = useDashboardData(user);

    const xpBase = (stats.level - 1) * 100;
    const xpCurrent = stats.xp - xpBase;
    const xpTarget = 100;
    const progressPercent = Math.min(Math.max((xpCurrent / xpTarget) * 100, 0), 100);

    // Skeleton Loading
    if (isLoading) {
        return (
            <div className="px-4 py-8 md:px-8 md:py-10 max-w-7xl mx-auto flex flex-col gap-8 animate-pulse">
                <div className="h-64 bg-slate-900/50 rounded-3xl w-full border border-white/5"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-40 bg-slate-900/50 rounded-2xl col-span-2"></div>
                    <div className="h-40 bg-slate-900/50 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        // [FIX] Penyesuaian Padding:
        // - px-4 md:px-8 (Kiri Kanan standar)
        // - pt-6 md:pt-10 (Atas lebih lega, biar Identity Card jadi Hero sejati)
        // - pb-32 (Bawah aman dari Mobile Nav)
        <div className="px-4 pt-6 md:px-8 md:pt-10 pb-32 max-w-7xl mx-auto animate-enter font-sans">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
    
                {/* --- KOLOM KIRI (UTAMA) --- */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    {/* 1. Identity & Focus (HERO SECTION) */}
                    {/* Memberikan margin-bottom extra agar tidak "dempet" dengan XP Bar */}
                    <div className="mb-2"> 
                        <IdentityCard 
                            user={user}
                            identityData={identityData}
                            setIdentityData={setIdentityData}
                            activeProjects={activeProjects}
                            projectCandidates={projectCandidates}
                        />
                    </div>

                    {/* 2. XP Bar & Level */}
                    <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-sm relative z-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                {stats.level}
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Level {stats.level}</p>
                                <p className="text-[10px] text-slate-500 font-mono">Rank: Explorer</p>
                            </div>
                        </div>
                        <div className="flex-1 max-w-sm">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                                <span>{Math.round(xpCurrent)} XP</span>
                                <span>{xpTarget} XP</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Inbox Widget */}
                    <div className="h-full relative z-0">
                        <InboxWidget tasks={activeTasks} />
                    </div>

                </div>

                {/* --- KOLOM KANAN (SIDEBAR) --- */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    <div className="glass-card bg-slate-900/40 p-1 relative z-0">
                        <Timer tasks={activeTasks} />
                    </div>

                    <Link href="/finance" className="glass-card p-5 relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all z-0">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">Total Balance</p>
                                <h3 className="text-2xl font-mono font-bold text-white">
                                    {formatMoney(finance.balance || 0)}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-rounded">account_balance_wallet</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 text-emerald-900/10 group-hover:text-emerald-900/20 transition-colors">
                            <span className="material-symbols-rounded text-9xl">payments</span>
                        </div>
                    </Link>

                    <div className="grid grid-cols-1 gap-6 relative z-0">
                        <Wellness />
                        <HabitTracker />
                    </div>

                    <Link href="/log" className="group glass-card p-4 flex items-center justify-center gap-3 hover:bg-slate-800 border-dashed border-2 border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer relative z-0">
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