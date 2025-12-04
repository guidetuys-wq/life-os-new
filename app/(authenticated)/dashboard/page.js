'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatMoney } from '@/lib/utils';

// Import Widgets
import Skeleton from '@/components/ui/Skeleton';
import IdentityCard from '@/components/IdentityCard';
import Timer from '@/components/Timer';
import HabitTracker from '@/components/HabitTracker';
import Wellness from '@/components/Wellness';
import InboxWidget from '@/components/InboxWidget';
import IdentityDashboard from '@/components/IdentityDashboard'; // [NEW] Widget Refleksi

export default function Dashboard() {
    const { user } = useAuth();
    
    const { 
        isLoading, stats, finance, activeTasks, 
        projectCandidates, 
        identityData, setIdentityData, activeProjects
    } = useDashboardData(user);

    // Calculate XP Progress
    const xpBase = (stats.level - 1) * 100;
    const xpCurrent = stats.xp - xpBase;
    const xpTarget = 100;
    const progressPercent = Math.min(Math.max((xpCurrent / xpTarget) * 100, 0), 100);
    
    // [VISUAL] Dynamic Status: Hampir Level Up (> 80%)
    const isNearLevelUp = progressPercent >= 80;

    // 1. LOADING STATE
    if (isLoading) {
        return (
            <div className="px-4 pt-6 md:px-8 md:pt-10 pb-32 max-w-7xl mx-auto flex flex-col gap-8 animate-enter">
                <Skeleton className="h-64 w-full rounded-[2rem] shadow-sm" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* XP Bar Skeleton */}
                        <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-slate-900/50">
                            <Skeleton className="w-12 h-12 rounded-2xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        </div>
                        <Skeleton className="h-[400px] w-full rounded-[2rem]" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pt-6 md:px-8 md:pt-10 pb-32 max-w-7xl mx-auto animate-enter font-sans">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
    
                {/* --- KOLOM KIRI (UTAMA) --- */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    {/* 1. Identity & Focus (HERO SECTION) */}
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
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-5 backdrop-blur-md shadow-lg relative overflow-hidden group">
                        {isNearLevelUp && <div className="absolute inset-0 bg-amber-500/5 animate-pulse-slow z-0"></div>}
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-500 ${isNearLevelUp ? 'bg-gradient-to-tr from-amber-500 to-orange-600 scale-110 shadow-amber-500/20' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20'}`}>
                                {stats.level}
                            </div>
                            <div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isNearLevelUp ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`}>
                                    {isNearLevelUp ? 'Level Up Soon!' : 'Current Rank'}
                                </p>
                                <p className="text-sm text-slate-200 font-bold">Explorer</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 max-w-sm relative z-10">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-2 font-mono font-bold">
                                <span className={isNearLevelUp ? 'text-amber-300' : 'text-slate-400'}>{Math.round(xpCurrent)} XP</span>
                                <span>{xpTarget} XP</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                                <div 
                                    className={`h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out relative ${isNearLevelUp ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-500/50' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Inbox Widget */}
                    <div className="h-full relative z-0">
                        <InboxWidget tasks={activeTasks} />
                    </div>

                    {/* [NEW] 4. Snapshot Reflection Widget */}
                    <div className="relative z-0">
                        <IdentityDashboard />
                    </div>

                </div>

                {/* --- KOLOM KANAN (SIDEBAR) --- */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    <div className="glass-card bg-slate-900/40 p-1 relative z-0">
                        <Timer projects={projectCandidates} />
                    </div>

                    <Link href="/finance" className="glass-card p-6 relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all z-0">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">Total Balance</p>
                                <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
                                    {formatMoney(finance.balance || 0)}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-rounded filled-icon">account_balance_wallet</span>
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