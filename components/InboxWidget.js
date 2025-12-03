'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { query, collection, orderBy, onSnapshot, where } from 'firebase/firestore'; // Hanya untuk listener
import { db, appId } from '@/lib/firebase';
import { TaskService } from '@/services/taskService'; // Import Service
import toast from 'react-hot-toast';

export default function InboxWidget() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    
    // --- 1. DATA LISTENER (Tetap di sini agar reaktif) ---
    useEffect(() => {
        if (!user) return;
        // Query yang lebih efisien: Langsung filter di Firestore, bukan di JS
        const q = query(
            collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'),
            where('completed', '==', false),
            where('projectId', '==', ''), // Index composite mungkin diperlukan
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Firestore Error:", error); // Handle error permission/index
        });
        return () => unsub();
    }, [user]);

    // --- 2. USER ACTIONS (Delegasi ke Service) ---
    const handleAddTask = async (e) => {
        if (e.key === 'Enter' && newTask.trim()) {
            try {
                await TaskService.addTask(user.uid, newTask); // Panggil Service
                setNewTask('');
                toast.success("Masuk Inbox");
            } catch (err) {
                toast.error("Gagal menyimpan task");
            }
        }
    };

    const handleComplete = async (task) => {
        // Optimistic UI update bisa ditambahkan di sini jika perlu instant feedback
        try {
            await TaskService.completeTask(user.uid, task.id, task.text);
            toast.success("Task Selesai! +10 XP");
        } catch (err) {
            toast.error("Error update task");
        }
    };

    // ... Render UI (JSX) tetap sama, tapi gunakan handler baru ...
    return (
        <div className="glass-card flex flex-col min-h-[350px] p-6 relative">
             {/* ... Header UI ... */}
             
             {/* Input Bar */}
             <input 
                type="text" 
                value={newTask} 
                onChange={e => setNewTask(e.target.value)} 
                onKeyDown={handleAddTask}
                placeholder="Ada ide apa? (Enter)..." 
                className="bg-transparent w-full text-sm text-white placeholder-slate-600 focus:outline-none"
            />

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 mt-4">
                {tasks.map(t => (
                    <div key={t.id} className="group flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-all">
                        <button onClick={() => handleComplete(t)} className="...">
                            <span className="material-symbols-rounded text-[10px] text-transparent group-hover:text-blue-400">check</span>
                        </button>
                        <p className="text-sm text-slate-300">{t.text}</p>
                        {/* ... Action Buttons ... */}
                    </div>
                ))}
            </div>
        </div>
    );
}