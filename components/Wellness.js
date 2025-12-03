'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { addXP } from '@/lib/gamification';
import { getLocalDate } from '@/lib/utils';

export default function Wellness() {
    const { user } = useAuth();
    const [data, setData] = useState({ water: 0, mood: null });

    useEffect(() => {
        if (!user) return;
        const today = getLocalDate(); // [FIX] Gunakan local date
        const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'wellness', today);
        
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) setData(snap.data());
            else setData({ water: 0, mood: null });
        });
        return () => unsub();
    }, [user]);

    const updateWellness = async (newData) => {
        const today = getLocalDate();
        const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'wellness', today);
        await setDoc(ref, newData, { merge: true });
    };

    const addWater = async () => {
        const current = data.water || 0;
        if (current >= 8) return; // [FIX] Stop jika sudah penuh

        const newCount = current + 1;
        await updateWellness({ water: newCount });
        
        // [FIX] Cek kondisi spesifik agar XP hanya cair sekali
        if(newCount === 8) {
            await addXP(user.uid, 5, 'WELLNESS_GOAL', 'Target Minum Tercapai');
            // Opsional: Tambah efek suara/confetti di sini
        }
    };

    const setMood = async (m) => {
        await updateWellness({ mood: m });
    };

    return (
        <div className="card-enhanced flex flex-col justify-between bg-slate-800/40 border-slate-700/50 p-4">
            {/* Water Tracker */}
            <div className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                    Hidrasi <span className="text-blue-400">{data.water || 0}/8</span>
                </h3>
                <div className="flex gap-1 h-8 cursor-pointer" onClick={addWater} title="Tap untuk minum">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className={`flex-1 rounded-sm transition-all ${i < (data.water || 0) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-800 hover:bg-blue-500/30'}`}></div>
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
                            key={m} onClick={() => setMood(m)}
                            className={`text-xl transition-all hover:scale-125 ${isSelected ? 'scale-125 opacity-100 grayscale-0' : 'opacity-40 grayscale'}`}
                        >
                            {emojis[m]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}