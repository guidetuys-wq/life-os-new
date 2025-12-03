'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GoalService } from '@/services/goalService';
import toast from 'react-hot-toast';

// Import Modals Baru
import GoalModal from '@/components/modals/GoalModal';
import MagicPlanModal from '@/components/modals/MagicPlanModal';

export default function GoalsPage() {
    const { user } = useAuth();
    
    // Data States
    const [goals, setGoals] = useState([]);
    const [localProgress, setLocalProgress] = useState({});
    
    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isMagicOpen, setIsMagicOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        const unsub = GoalService.subscribeGoals(user.uid, setGoals);
        return () => unsub();
    }, [user]);

    // 2. Actions
    const handleDelete = (id) => {
        if(confirm('Pindahkan target ini ke sampah?')) GoalService.deleteGoal(user.uid, id);
    };

    const handleOpenMagic = (goal) => {
        setSelectedGoal(goal);
        setIsMagicOpen(true);
    };

    // 3. Slider Logic
    const handleSliderChange = (id, val) => setLocalProgress(prev => ({ ...prev, [id]: val }));
    
    const handleSliderCommit = async (id, val) => {
        try {
            await GoalService.updateGoal(user.uid, id, { progress: parseInt(val) });
            setLocalProgress(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        } catch (e) { toast.error("Gagal update progress"); }
    };

    // Helper: Styles & Date
    const getDaysLeft = (dateString) => {
        if (!dateString) return { text: 'No Deadline', color: 'text-slate-500' };
        const today = new Date();
        const target = new Date(dateString);
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { text: `${Math.abs(diff)} Hari Lewat`, color: 'text-rose-400 font-bold' };
        if (diff === 0) return { text: 'Hari Ini!', color: 'text-amber-400 font-bold animate-pulse' };
        if (diff <= 7) return { text: `${diff} Hari Lagi 🔥`, color: 'text-amber-400 font-bold' };
        return { text: `${diff} Hari Lagi`, color: 'text-blue-300' };
    };

    const getAreaStyle = (area) => {
        switch(area) {
            case 'Finance': return 'from-emerald-900/40 to-slate-900 border-emerald-500/30';
            case 'Health': return 'from-rose-900/40 to-slate-900 border-rose-500/30';
            case 'Career': return 'from-blue-900/40 to-slate-900 border-blue-500/30';
            case 'Spiritual': return 'from-purple-900/40 to-slate-900 border-purple-500/30';
            default: return 'from-slate-800 to-slate-900 border-slate-700';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Life Goals</h1>
                    <p className="text-sm text-slate-400">Visi jangka panjang & Impianmu.</p>
                </div>
                <button 
                    onClick={() => setIsAddOpen(true)} 
                    className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                    <span className="material-symbols-rounded text-lg">add_flag</span> Set Goal
                </button>
            </div>

            {/* Grid Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(g => {
                    const timeLeft = getDaysLeft(g.deadline);
                    const gradientClass = getAreaStyle(g.area);
                    const currentProgress = localProgress[g.id] !== undefined ? localProgress[g.id] : g.progress;
                    
                    return (
                        <div key={g.id} className={`group relative p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 flex flex-col justify-between min-h-[220px] ${gradientClass} hover:border-white/20`}>
                            
                            {/* Top: Area & Actions */}
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-slate-950/50 border border-white/5 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg backdrop-blur-sm tracking-wider">
                                    {g.area}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenMagic(g)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white transition-all shadow-lg shadow-purple-500/10"
                                        title="Breakdown dengan AI"
                                    >
                                        <span className="material-symbols-rounded text-base">auto_awesome</span>
                                    </button>
                                    <button onClick={() => handleDelete(g.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all">
                                        <span className="material-symbols-rounded text-sm">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Middle: Title */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white leading-tight mb-2">{g.title}</h3>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="material-symbols-rounded text-base text-slate-500">event</span>
                                    <span className={`font-mono ${timeLeft.color}`}>{timeLeft.text}</span>
                                </div>
                            </div>

                            {/* Bottom: Progress */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Progress</span>
                                    <span className={g.progress >= 100 ? 'text-emerald-400' : 'text-white'}>{currentProgress}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5 group-hover:h-4 transition-all">
                                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${currentProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${currentProgress}%` }}></div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={currentProgress || 0} 
                                        onChange={(e) => handleSliderChange(g.id, e.target.value)}
                                        onMouseUp={(e) => handleSliderCommit(g.id, e.target.value)}
                                        onTouchEnd={(e) => handleSliderCommit(g.id, e.target.value)}
                                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODALS (Terpisah & Bersih) */}
            <GoalModal 
                isOpen={isAddOpen} 
                onClose={() => setIsAddOpen(false)} 
                uid={user?.uid} 
            />
            
            <MagicPlanModal 
                isOpen={isMagicOpen} 
                onClose={() => setIsMagicOpen(false)} 
                goal={selectedGoal} 
                uid={user?.uid} 
            />
        </div>
    );
}