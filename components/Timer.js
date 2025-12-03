'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProjectService } from '@/services/projectService'; // [FIX] Ganti TaskService ke ProjectService
import { addXP, XP_VALUES } from '@/lib/gamification'; 
import { useFocusTimer } from '@/hooks/useFocusTimer';
import toast from 'react-hot-toast';

// [FIX] Terima props 'projects'
export default function Timer({ projects = [] }) {
    const { user } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState('');

    const onTimerFinish = async () => {
        // Cari nama project
        const project = projects.find(p => p.id === selectedProjectId);
        const projectName = project?.name || "Fokus Bebas";
        
        // Log XP
        await addXP(user.uid, XP_VALUES.TIMER_SESSION, 'FOCUS_DONE', `Sesi Project: ${projectName}`);
        
        toast((t) => (
            <div className="flex flex-col gap-2 min-w-[200px]">
                <span className="font-bold text-sm">Sesi Selesai! 🎉</span>
                <p className="text-xs text-slate-300">Status project ini?</p>
                <div className="flex gap-2 mt-1">
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            if (selectedProjectId && project) {
                                // [FIX] Tandai Project Selesai (Done)
                                await ProjectService.moveProject(user.uid, selectedProjectId, 'done', project);
                                setSelectedProjectId('');
                            }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex-1"
                    >
                        Project Selesai
                    </button>
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs transition-colors"
                    >
                        Masih Lanjut
                    </button>
                </div>
            </div>
        ), { duration: 8000, icon: '⏰', style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' } });
        
        resetTimer();
    };

    const { isRunning, toggleTimer, formattedTime, resetTimer } = useFocusTimer(onTimerFinish);

    const handleStart = () => {
        if (!isRunning && !selectedProjectId) {
            toast("💡 Tips: Pilih project untuk log aktivitas yang rapi!", { icon: '🎯', duration: 3000 });
        }
        toggleTimer();
    };

    return (
        <div className="h-full flex flex-col justify-between p-4 relative overflow-hidden group">
            
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] transition-all duration-700 ${isRunning ? 'opacity-100 scale-150 bg-amber-500/10' : 'opacity-0 scale-50'}`}></div>

            {/* Header: Dropdown Project (DINAMIS) */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        {isRunning ? <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"/> : <span className="material-symbols-rounded text-sm">rocket_launch</span>}
                        {isRunning ? 'Focus Mode' : 'Fokus Project'}
                    </label>
                </div>
                
                <div className="relative group/select">
                    <select 
                        className={`
                            w-full bg-slate-950/50 text-xs text-slate-200 rounded-xl px-3 py-2.5 
                            border transition-all outline-none appearance-none cursor-pointer
                            ${isRunning 
                                ? 'border-amber-500/30 text-amber-100' 
                                : 'border-slate-800 hover:border-slate-600 focus:border-blue-500/50'
                            }
                        `}
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        disabled={isRunning}
                    >
                        <option value="">-- Fokus Bebas --</option>
                        {/* [FIX] Mapping Data Projects */}
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/select:text-slate-300 transition-colors">
                        <span className="material-symbols-rounded text-sm">unfold_more</span>
                    </div>
                </div>
            </div>

            {/* Timer Display */}
            <div className="flex items-center justify-between mt-4 relative z-10">
                <div className={`text-5xl font-mono font-bold tracking-tighter transition-all duration-500 ${isRunning ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'text-white'}`}>
                    {formattedTime()}
                </div>
                
                <button 
                    onClick={handleStart} 
                    className={`
                        h-12 w-12 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300
                        ${isRunning 
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-900/20' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                        }
                    `}
                >
                    <span className="material-symbols-rounded text-2xl filled-icon">
                        {isRunning ? 'pause' : 'play_arrow'}
                    </span>
                </button>
            </div>
        </div>
    );
}