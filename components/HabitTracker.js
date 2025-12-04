'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HabitService } from '@/services/habitService';
import { getLocalDate } from '@/lib/utils'; 

export default function HabitTracker() {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    // [NEW] View State: 'week' | 'month'
    const [viewMode, setViewMode] = useState('week');

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
            HabitService.deleteHabit(user.uid, id); 
        }
    };

    // 3. Date Generation Logic (Memoized)
    const dates = useMemo(() => {
        const today = new Date();
        const results = [];

        if (viewMode === 'week') {
            // Generate 7 hari terakhir (termasuk hari ini)
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                results.push(d);
            }
        } else {
            // Generate Bulan Ini (Tanggal 1 s/d Hari Terakhir Bulan Ini)
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate(); // Hitung total hari

            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(year, month, i);
                results.push(d);
            }
        }

        // Format object untuk render
        return results.map(d => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const iso = `${year}-${month}-${day}`;
            
            return {
                iso,
                dateObj: d,
                dayName: d.toLocaleDateString('id-ID', { weekday: 'narrow' }), // S, S, R...
                dayNum: d.getDate(),
                isToday: iso === getLocalDate()
            };
        });
    }, [viewMode]);

    return (
        <div className="glass-card flex flex-col h-full p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-rounded text-emerald-400">grid_view</span> Habit Heatmap
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Konsistensi adalah kunci.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-slate-900/50 p-0.5 rounded-lg border border-slate-700/50">
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'week' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            7D
                        </button>
                        <button 
                            onClick={() => setViewMode('month')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'month' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            30D
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsAdding(!isAdding)} 
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors border ${isAdding ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
                    >
                        <span className="material-symbols-rounded text-lg">{isAdding ? 'close' : 'add'}</span>
                    </button>
                </div>
            </div>

            {/* Form Tambah */}
            {isAdding && (
                <form onSubmit={handleAdd} className="mb-6 flex gap-2 animate-enter">
                    <input 
                        autoFocus
                        value={newHabit} onChange={e => setNewHabit(e.target.value)}
                        className="bg-slate-950/50 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 w-full focus:border-emerald-500 outline-none placeholder-slate-600"
                        placeholder="Nama Habit (cth: Baca Buku, Gym)..."
                    />
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                        <span className="material-symbols-rounded text-lg">check</span>
                    </button>
                </form>
            )}

            {/* List Habits */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-6 pr-1">
                {habits.map(h => (
                    <div key={h.id} className="group">
                        {/* Nama Habit & Delete */}
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-bold text-slate-200 truncate max-w-[180px] group-hover:text-white transition-colors" title={h.name}>
                                {h.name}
                            </span>
                            <button 
                                onClick={() => handleDelete(h.id)} 
                                className="text-[10px] text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                            >
                                <span className="material-symbols-rounded text-sm">delete</span> Hapus
                            </button>
                        </div>
                        
                        {/* HEATMAP GRID */}
                        <div className={`
                            ${viewMode === 'week' ? 'grid grid-cols-7 gap-2' : 'flex gap-1.5 overflow-x-auto pb-2 mask-linear-fade'}
                        `}>
                            {dates.map((day) => {
                                const isDone = h.history && h.history[day.iso];
                                
                                return (
                                    <div 
                                        key={day.iso}
                                        onClick={() => handleToggle(h, day.iso)}
                                        title={`${day.iso} : ${isDone ? 'Selesai' : 'Belum'}`}
                                        className={`
                                            flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all border
                                            ${viewMode === 'week' ? 'h-9 w-full rounded-lg' : 'h-8 w-8 rounded-md'}
                                            ${isDone 
                                                ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-105' 
                                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700 hover:border-slate-500'
                                            }
                                            ${day.isToday ? 'ring-1 ring-white/70 scale-105 z-10' : ''}
                                        `}
                                    >
                                        <span className={`text-[8px] font-bold ${isDone ? 'text-emerald-950' : 'text-slate-500'}`}>
                                            {viewMode === 'week' ? day.dayName : day.dayNum}
                                        </span>
                                        {isDone && viewMode === 'week' && (
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
                    <div className="text-center py-10 border-2 border-dashed border-slate-800/50 rounded-2xl opacity-60">
                        <span className="material-symbols-rounded text-4xl text-slate-700 mb-2">hotel_class</span>
                        <p className="text-xs text-slate-500 font-medium">Mulai bangun kebiasaan baru!</p>
                        <button onClick={() => setIsAdding(true)} className="text-[10px] text-emerald-400 font-bold mt-2 hover:underline">
                            + Tambah Habit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}