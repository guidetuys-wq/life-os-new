'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HabitService } from '@/services/habitService';
import { getLocalDate } from '@/lib/utils'; // Pastikan utils ini ada

export default function HabitTracker() {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        const unsub = HabitService.subscribeHabits(user.uid, setHabits);
        return () => unsub();
    }, [user]);

    // 2. Actions
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        await HabitService.addHabit(user.uid, newHabit.trim());
        setNewHabit('');
        setIsAdding(false);
    };

    const handleToggle = (habit, dateIso) => {
        HabitService.toggleHabit(user.uid, habit, dateIso);
    };

    const handleDelete = (id) => {
        if(confirm("Hapus kebiasaan ini selamanya?")) {
            const { deleteDoc, doc } = require('firebase/firestore'); // Import dynamic atau via Service (rekomendasi via service)
            const { db, appId } = require('@/lib/firebase');
            // Agar konsisten, panggil service. 
            // Note: Di snippet service saya lupa export deleteHabit via Firestore deleteDoc import.
            // Mari kita asumsikan Service sudah benar (lihat revisi Service di atas).
            HabitService.deleteHabit(user.uid, id); 
        }
    };

    // 3. Helper: Generate 7 Hari Terakhir (Memoized)
    const last7Days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            // Format manual YYYY-MM-DD sesuai local time
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const isoDate = `${year}-${month}-${day}`;

            return {
                iso: isoDate,
                dayName: d.toLocaleDateString('id-ID', { weekday: 'narrow' }), // S, S, R, K...
                fullDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            };
        }).reverse(); // Urutkan dari 7 hari lalu ke hari ini
    }, []); // Empty dependency = hitung sekali saat mount

    return (
        <div className="glass-card flex flex-col h-full p-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-green-400">grid_view</span> Habit Heatmap
                </h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isAdding ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                    <span className="material-symbols-rounded text-sm">{isAdding ? 'close' : 'add'}</span>
                </button>
            </div>

            {/* Form Tambah */}
            {isAdding && (
                <form onSubmit={handleAdd} className="mb-4 flex gap-2 animate-enter">
                    <input 
                        autoFocus
                        value={newHabit} onChange={e => setNewHabit(e.target.value)}
                        className="bg-slate-950/50 text-xs text-white px-3 py-2 rounded-lg border border-slate-700 w-full focus:border-blue-500 outline-none"
                        placeholder="Nama Habit (cth: Baca Buku)..."
                    />
                    <button type="submit" className="text-blue-400 text-xs font-bold px-2 hover:text-white">OK</button>
                </form>
            )}

            {/* List Habits */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-1">
                {habits.map(h => (
                    <div key={h.id} className="group">
                        {/* Nama Habit & Delete */}
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]" title={h.name}>{h.name}</span>
                            <button 
                                onClick={() => handleDelete(h.id)} 
                                className="text-[10px] text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Hapus
                            </button>
                        </div>
                        
                        {/* HEATMAP GRID (7 Hari) */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {last7Days.map((day, index) => {
                                const isDone = h.history && h.history[day.iso];
                                const isToday = index === 6; // Index terakhir adalah hari ini
                                
                                return (
                                    <div 
                                        key={day.iso}
                                        onClick={() => handleToggle(h, day.iso)}
                                        title={`${day.fullDate} : ${isDone ? 'Selesai' : 'Belum'}`}
                                        className={`
                                            h-8 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all border
                                            ${isDone 
                                                ? 'bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)] hover:bg-green-400' 
                                                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'
                                            }
                                            ${isToday ? 'ring-1 ring-white/50 scale-105' : ''}
                                        `}
                                    >
                                        <span className={`text-[8px] font-bold ${isDone ? 'text-green-900' : 'text-slate-600'}`}>
                                            {day.dayName}
                                        </span>
                                        {isDone && (
                                            <span className="material-symbols-rounded text-[10px] text-white -mt-0.5">check</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {habits.length === 0 && !isAdding && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-600">Mulai bangun kebiasaan baru!</p>
                    </div>
                )}
            </div>
        </div>
    );
}