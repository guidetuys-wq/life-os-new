'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WellnessService } from '@/services/wellnessService';
import { AiService } from '@/services/aiService'; // [NEW]
import toast from 'react-hot-toast';

export default function Wellness() {
    const { user } = useAuth();
    const [data, setData] = useState({ water: 0, mood: null });
    const [isAnalyzing, setIsAnalyzing] = useState(false); // [NEW]

    // 1. Fetch Data Realtime via Service
    useEffect(() => {
        if (!user) return;
        const unsub = WellnessService.subscribeWellness(user.uid, setData);
        return () => unsub();
    }, [user]);

    // 2. Actions
    const handleAddWater = () => WellnessService.addWater(user.uid, data.water || 0);
    const handleSetMood = (mood) => WellnessService.setMood(user.uid, mood);

    // [NEW] Handler Insight
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const toastId = toast.loading("Menganalisis pola...");
        try {
            const insight = await AiService.generateWellnessInsight(user.uid);
            toast.success(insight, { 
                id: toastId, 
                duration: 8000, // Tampil lama biar sempat baca
                icon: '🧠',
                style: { minWidth: '300px', textAlign: 'left' }
            });
        } catch (e) {
            toast.error("Gagal analisis", { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="card-enhanced flex flex-col justify-between bg-slate-800/40 border-slate-700/50 p-4 relative group">
            
            {/* [NEW] Analyze Button (Hidden until hover) */}
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="absolute top-2 right-2 text-slate-600 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Analisa Pola Saya"
            >
                <span className={`material-symbols-rounded text-lg ${isAnalyzing ? 'animate-spin' : ''}`}>
                    {isAnalyzing ? 'sync' : 'insights'}
                </span>
            </button>

            {/* Water Tracker (Tetap sama) */}
            <div className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                    Hidrasi <span className="text-blue-400">{data.water || 0}/8</span>
                </h3>
                <div 
                    className="flex gap-1 h-8 cursor-pointer group/water" 
                    onClick={handleAddWater}
                >
                    {[...Array(8)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`flex-1 rounded-sm transition-all duration-300 ${
                                i < (data.water || 0) 
                                ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                                : 'bg-slate-800 group-hover/water:bg-blue-500/20'
                            }`}
                        ></div>
                    ))}
                </div>
            </div>

            {/* Mood Tracker (Tetap sama) */}
            <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                {['bad', 'neutral', 'good', 'excellent'].map((m) => {
                    const emojis = { bad: '🙁', neutral: '😐', good: '🙂', excellent: '🔥' };
                    const isSelected = data.mood === m;
                    return (
                        <button 
                            key={m} 
                            onClick={() => handleSetMood(m)}
                            className={`text-xl transition-all duration-300 hover:scale-125 ${
                                isSelected 
                                ? 'scale-125 opacity-100 grayscale-0 filter-none' 
                                : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                            }`}
                        >
                            {emojis[m]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}