'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WellnessService } from '@/services/wellnessService';

export default function Wellness() {
    const { user } = useAuth();
    const [data, setData] = useState({ water: 0, mood: null });

    // 1. Fetch Data Realtime via Service
    useEffect(() => {
        if (!user) return;
        const unsub = WellnessService.subscribeWellness(user.uid, setData);
        return () => unsub();
    }, [user]);

    // 2. Actions (Delegasi ke Service)
    const handleAddWater = () => {
        WellnessService.addWater(user.uid, data.water || 0);
    };

    const handleSetMood = (mood) => {
        WellnessService.setMood(user.uid, mood);
    };

    return (
        <div className="card-enhanced flex flex-col justify-between bg-slate-800/40 border-slate-700/50 p-4">
            {/* Water Tracker */}
            <div className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                    Hidrasi <span className="text-blue-400">{data.water || 0}/8</span>
                </h3>
                <div 
                    className="flex gap-1 h-8 cursor-pointer group" 
                    onClick={handleAddWater} 
                    title="Tap untuk minum"
                >
                    {[...Array(8)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`flex-1 rounded-sm transition-all duration-300 ${
                                i < (data.water || 0) 
                                ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                                : 'bg-slate-800 group-hover:bg-blue-500/20'
                            }`}
                        ></div>
                    ))}
                </div>
            </div>

            {/* Mood Tracker */}
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
                            title={m}
                        >
                            {emojis[m]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}