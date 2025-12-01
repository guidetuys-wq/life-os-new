'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { addXP, XP_VALUES } from '@/lib/gamification'; // Import Engine kita

export default function Timer() {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    
    // State baru untuk integrasi Task
    const [activeTasks, setActiveTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState('');

    // Fetch Task saat komponen dimuat
    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            // Ambil task yang belum selesai
            const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), where('completed', '==', false));
            const snap = await getDocs(q);
            setActiveTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchTasks();
    }, [user]);

    // Timer Logic (Sama seperti sebelumnya, dengan tambahan finish logic)
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
        } else if (timeLeft === 0 && isRunning) {
            handleFinish();
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleFinish = async () => {
        setIsRunning(false);
        setTimeLeft(25 * 60);
        
        // INTERKONEKSI: Beri XP & Log
        const taskName = activeTasks.find(t => t.id === selectedTaskId)?.text || "Fokus Bebas";
        await addXP(user.uid, XP_VALUES.TIMER_SESSION, 'FOCUS_DONE', `Selesai Fokus: ${taskName}`);
        
        // INTERKONEKSI: Tanya user apakah task selesai?
        if (selectedTaskId && confirm(`Sesi selesai! Apakah task "${taskName}" juga sudah tuntas?`)) {
             await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', selectedTaskId), { completed: true });
             await addXP(user.uid, XP_VALUES.TASK_COMPLETE, 'TASK_COMPLETED', `Task Tuntas: ${taskName}`);
             // Hapus dari dropdown
             setActiveTasks(prev => prev.filter(t => t.id !== selectedTaskId));
             setSelectedTaskId('');
        }
    };

    const toggleTimer = () => {
        if(!isRunning && !selectedTaskId) {
            // Paksa user pilih task (Produktivitas naik!)
            if(!confirm("Anda belum memilih Task. Mulai timer tanpa target spesifik?")) return;
        }
        setIsRunning(!isRunning);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="card-enhanced !p-4 flex flex-col gap-4 bg-slate-900/50 border-blue-500/30 w-full max-w-md mx-auto mb-6">
            <div className="flex justify-between items-center">
                {/* Dropdown Integrasi Task */}
                <select 
                    className="bg-slate-800 text-white text-xs rounded-lg p-2 border border-slate-700 max-w-[200px]"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={isRunning}
                >
                    <option value="">-- Pilih Target Fokus --</option>
                    {activeTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.text}</option>
                    ))}
                </select>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider animate-pulse">
                    {isRunning ? 'Focus Mode ON' : 'Ready'}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-4xl font-mono font-bold text-white tracking-tighter">
                    {formatTime(timeLeft)}
                </div>
                <button 
                    onClick={toggleTimer} 
                    className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isRunning ? 'bg-amber-500' : 'bg-blue-600'}`}
                >
                    <span className="material-symbols-rounded text-2xl text-white">
                        {isRunning ? 'pause' : 'play_arrow'}
                    </span>
                </button>
            </div>
        </div>
    );
}