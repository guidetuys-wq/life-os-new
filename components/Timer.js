'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addXP, XP_VALUES } from '@/lib/gamification'; 
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { playSound } from '@/lib/sounds';
import toast from 'react-hot-toast';

export default function Timer({ projects = [] }) {
    const { user } = useAuth();
    
    // [FIX] Gunakan useCallback agar fungsi ini stabil dan tidak bikin loop
    const onTimerFinish = useCallback(async () => {
        playSound('timer');
        
        // Ambil ID dari localStorage untuk menghindari masalah closure state
        const savedProjId = localStorage.getItem('focusProjectId');
        const project = projects.find(p => p.id === savedProjId);
        const projectName = project?.name || "Fokus Bebas";
        
        await addXP(user.uid, XP_VALUES.TIMER_SESSION, 'FOCUS_DONE', `Sesi Project: ${projectName}`);
        
        toast((t) => (
            <div className="flex flex-col gap-2 min-w-[200px]">
                <span className="font-bold text-sm">Sesi Selesai! ⏰</span>
                <p className="text-xs text-slate-300">Istirahat sejenak.</p>
                <button onClick={() => toast.dismiss(t.id)} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs transition-colors">
                    Oke
                </button>
            </div>
        ), { duration: 8000, icon: '🎉', style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' } });
    }, [projects, user.uid]); // Dependencies

    const { 
        timeLeft, isRunning, toggleTimer, resetTimer, setDuration, formattedTime,
        activeProjectId, setProject 
    } = useFocusTimer(onTimerFinish);

    const [totalTime, setTotalTime] = useState(25 * 60); 
    
    useEffect(() => {
        if (isRunning && timeLeft > totalTime) {
            setTotalTime(Math.max(timeLeft, 50 * 60)); 
        }
    }, [isRunning, timeLeft, totalTime]);

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = totalTime > 0 ? timeLeft / totalTime : 0;
    const dashoffset = circumference - progress * circumference;

    const handleStart = () => {
        if (!isRunning && !activeProjectId) {
            toast("💡 Tips: Pilih project agar log aktivitas lebih rapi!", { icon: '📝', duration: 3000 });
        }
        toggleTimer();
    };

    const handlePreset = (minutes) => {
        const seconds = minutes * 60;
        setTotalTime(seconds);
        setDuration(seconds);
        toast.success(`Timer di-set ${minutes} menit`);
    };

    return (
        <div className="h-full flex flex-col p-5 relative overflow-hidden group bg-slate-900/40 rounded-3xl border border-white/5 shadow-inner">
            
            {/* Background Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] transition-all duration-1000 ${isRunning ? 'opacity-100 bg-amber-500/10 scale-125' : 'opacity-50 scale-100'}`}></div>

            {/* Header: Project Selector */}
            <div className="relative z-10 mb-4">
                <div className="relative group/select">
                    <select 
                        className={`
                            w-full bg-slate-950/50 text-xs text-slate-200 rounded-xl px-3 py-2.5 
                            border transition-all outline-none appearance-none cursor-pointer
                            ${isRunning 
                                ? 'border-amber-500/30 text-amber-100 bg-amber-900/10' 
                                : 'border-slate-800 hover:border-slate-600 focus:border-blue-500/50'
                            }
                        `}
                        value={activeProjectId} 
                        onChange={(e) => setProject(e.target.value)} 
                        disabled={isRunning}
                    >
                        <option value="">-- Fokus Bebas --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <span className="material-symbols-rounded text-sm">unfold_more</span>
                    </div>
                </div>
            </div>

            {/* Circular Timer Visualization */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* SVG Circle - [FIX] Tambahkan pointer-events-none agar tidak menutupi tombol */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                        <circle 
                            cx="60" cy="60" r={radius} 
                            stroke="currentColor" strokeWidth="4" 
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashoffset}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ease-linear ${isRunning ? 'text-amber-500' : 'text-blue-500'}`}
                        />
                    </svg>
                    
                    {/* Digital Time & Controls */}
                    <div className="flex flex-col items-center z-20"> {/* Tambah z-20 */}
                        <div className={`text-4xl font-mono font-bold tracking-tighter ${isRunning ? 'text-amber-400' : 'text-white'}`}>
                            {formattedTime()}
                        </div>
                        
                        <button 
                            onClick={handleStart}
                            className={`mt-3 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer ${isRunning ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 ring-1 ring-amber-500/50' : 'bg-blue-600 text-white hover:bg-blue-500 ring-4 ring-blue-900/30'}`}
                        >
                            <span className="material-symbols-rounded text-2xl filled-icon">{isRunning ? 'pause' : 'play_arrow'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer: Presets */}
            {!isRunning && (
                <div className="flex justify-center gap-2 mt-4 relative z-10 animate-in fade-in slide-in-from-bottom-2">
                    {[15, 25, 50].map(min => (
                        <button 
                            key={min}
                            onClick={() => handlePreset(min)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${totalTime === min * 60 ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700 hover:text-white'}`}
                        >
                            {min}m
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}