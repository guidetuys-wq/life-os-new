'use client';
import { useState } from 'react'; // Hapus useEffect yang tidak perlu
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/services/taskService';
import { addXP, XP_VALUES } from '@/lib/gamification'; 
import { useFocusTimer } from '@/hooks/useFocusTimer';
import toast from 'react-hot-toast';

// [PERUBAHAN 1] Terima props 'tasks' dari Dashboard
export default function Timer({ tasks = [] }) {
    const { user } = useAuth();
    // const [tasks, setTasks] = useState([]); <--- HAPUS STATE LOKAL INI
    const [selectedTaskId, setSelectedTaskId] = useState('');

    // [PERUBAHAN 2] HAPUS USEEFFECT INI
    // Karena data tasks sudah datang dari props "tasks"
    /* useEffect(() => {
        if (!user) return;
        const unsubscribe = TaskService.subscribeToActiveTasks(...)
        return () => unsubscribe && unsubscribe();
    }, [user]); 
    */

    const onTimerFinish = async () => {
        // [FIX] Ambil nama task dari props 'tasks'
        const taskName = tasks.find(t => t.id === selectedTaskId)?.text || "Fokus Bebas";
        
        await addXP(user.uid, XP_VALUES.TIMER_SESSION, 'FOCUS_DONE', `Sesi Fokus: ${taskName}`);
        
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold">Sesi Selesai! 🎉</span>
                <p className="text-xs">Apakah task "{taskName}" sudah tuntas?</p>
                <div className="flex gap-2 mt-2">
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            if (selectedTaskId) {
                                await TaskService.completeTask(user.uid, selectedTaskId, taskName);
                                setSelectedTaskId('');
                            }
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                    >
                        Ya, Tuntas!
                    </button>
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-slate-700 text-white px-3 py-1 rounded text-xs"
                    >
                        Belum, Lanjut
                    </button>
                </div>
            </div>
        ), { duration: 8000, icon: '⏰' });
        
        resetTimer();
    };

    const { isRunning, toggleTimer, formattedTime, resetTimer } = useFocusTimer(onTimerFinish);

    const handleStart = () => {
        if (!isRunning && !selectedTaskId) {
            toast("💡 Tips: Pilih task agar XP lebih besar!", { icon: '🎯' });
        }
        toggleTimer();
    };

    return (
        <div className={`card-enhanced !p-4 flex flex-col gap-4 transition-all duration-500 w-full max-w-md mx-auto mb-6 border ${isRunning ? 'border-amber-500/50 bg-slate-900/80 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-blue-500/30 bg-slate-900/50'}`}>
            <div className="flex justify-between items-center">
                {/* Dropdown menggunakan props 'tasks' */}
                <select 
                    className="bg-slate-800 text-white text-xs rounded-lg p-2 border border-slate-700 max-w-[200px] outline-none focus:border-blue-500"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={isRunning}
                >
                    <option value="">-- Fokus Bebas --</option>
                    {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.text}</option>
                    ))}
                </select>
                
                {isRunning && (
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Focus Mode</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className={`text-5xl font-mono font-bold tracking-tighter transition-colors ${isRunning ? 'text-amber-400' : 'text-white'}`}>
                    {formattedTime()}
                </div>
                <button 
                    onClick={handleStart} 
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                    <span className="material-symbols-rounded text-3xl text-white filled-icon">
                        {isRunning ? 'pause' : 'play_arrow'}
                    </span>
                </button>
            </div>
        </div>
    );
}