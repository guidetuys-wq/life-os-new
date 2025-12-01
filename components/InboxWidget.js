'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db';
import { addXP, XP_VALUES } from '@/lib/gamification';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { refineTask } from '@/lib/ai';

export default function InboxWidget() {
    const { user } = useAuth();
    
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('normal'); 
    
    const [editingTask, setEditingTask] = useState(null);
    const [showProjectMenu, setShowProjectMenu] = useState(null);

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;

        // Fetch Tasks (Realtime)
        const qTask = query(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
        const unsubTasks = onSnapshot(qTask, (snap) => {
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => !t.completed));
        });

        // Fetch Projects
        const fetchProjects = async () => {
            const snap = await getDocs(query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects')));
            setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchProjects();

        return () => unsubTasks();
    }, [user]);

    // 2. Actions
    const handleAddTask = async (e) => {
        if (e.key === 'Enter' && newTask.trim()) {
            await addItem(user.uid, 'tasks', { 
                text: newTask, 
                completed: false, 
                priority: newPriority,
                projectId: '', 
                createdAt: serverTimestamp()
            });
            setNewTask('');
            setNewPriority('normal');
            await addXP(user.uid, 2, 'TASK_ADDED', 'Quick Task');
            toast.success("Masuk Inbox");
        }
    };

    const completeTask = async (id, text) => {
        // Hapus task (dianggap selesai) + Dapat XP
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id));
        await addXP(user.uid, XP_VALUES.TASK_COMPLETE, 'TASK_COMPLETED', `Selesai: ${text}`);
        toast.success("Task Selesai! +10 XP");
    };

    // --- FITUR BARU: DELETE (Tanpa XP) ---
    const deleteTask = async (id) => {
        if(confirm('Hapus task ini? (Tidak dapat dikembalikan)')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id));
            toast.success("Task dihapus");
        }
    };

    const updateTaskText = async (id, newText) => {
        if(!newText.trim()) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id), { text: newText });
        setEditingTask(null);
        toast.success("Diupdate");
    };

    const moveTaskToProject = async (taskId, projectId, projectName) => {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), { projectId: projectId });
        setShowProjectMenu(null);
        toast.success(`Dipindah ke ${projectName}`, { icon: '📂' });
    };

    const togglePriority = async (task) => {
        const nextMap = { 'normal': 'high', 'high': 'low', 'low': 'normal' };
        const next = nextMap[task.priority || 'normal'];
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id), { priority: next });
    };

    const handleRefine = async (task) => {
        // Optimistic UI (tampilkan loading)
        toast.loading(`Meningkatkan Task: "${task.text}"...`);

        const refinedText = await refineTask(task.text);

        // Update Firestore
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id), { text: refinedText });

        toast.dismiss();
        toast.success("Task ditingkatkan! ✨");
    };

    return (
        <div className="glass-card flex flex-col min-h-[350px] p-6 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-blue-400">inbox</span> Inbox
                </h3>
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-lg font-mono">{tasks.length}</span>
            </div>
            
            {/* Input Bar */}
            <div className="flex items-center gap-2 mb-4 bg-slate-950/50 p-1.5 rounded-xl border border-slate-700/50 focus-within:border-blue-500/50 transition-colors">
                <button 
                    onClick={() => setNewPriority(p => p === 'high' ? 'normal' : 'high')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newPriority === 'high' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-white'}`}
                    title="Set Prioritas Tinggi"
                >
                    <span className="material-symbols-rounded text-lg">priority_high</span>
                </button>
                
                <input 
                    type="text" 
                    value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={handleAddTask}
                    placeholder="Ada ide apa? (Enter)..." 
                    className="bg-transparent w-full text-sm text-white placeholder-slate-600 focus:outline-none"
                />
            </div>

            {/* List Tasks */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 max-h-[400px]">
                {tasks.map(t => (
                    <div key={t.id} className="group flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 relative">
                        
                        {/* Checkbox (Selesai) */}
                        <button onClick={() => completeTask(t.id, t.text)} className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-blue-500 flex items-center justify-center transition-all group/check flex-shrink-0">
                            <span className="material-symbols-rounded text-[10px] text-transparent group-hover/check:text-blue-400 scale-0 group-hover/check:scale-100 transition-transform">check</span>
                        </button>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {editingTask === t.id ? (
                                <input 
                                    autoFocus
                                    className="w-full bg-slate-900 text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none"
                                    defaultValue={t.text}
                                    onKeyDown={(e) => e.key === 'Enter' && updateTaskText(t.id, e.target.value)}
                                    onBlur={(e) => updateTaskText(t.id, e.target.value)}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    {t.priority !== 'normal' && (
                                        <button onClick={() => togglePriority(t)} className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-blue-400'}`}></button>
                                    )}
                                    
                                    <p onClick={() => setEditingTask(t.id)} className="text-sm text-slate-300 group-hover:text-white transition-colors truncate cursor-text">
                                        {t.text}
                                    </p>
                                    
                                    {t.isAiGenerated && <span className="text-[8px] text-purple-400 bg-purple-500/10 px-1 rounded border border-purple-500/20">AI</span>}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons (Hover Only) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            
                            {/* Move to Project */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowProjectMenu(showProjectMenu === t.id ? null : t.id)}
                                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Pindahkan ke Project"
                                >
                                    <span className="material-symbols-rounded text-sm">drive_file_move</span>
                                </button>

                                {showProjectMenu === t.id && (
                                    <div className="absolute right-0 top-8 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-enter">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800">Pindah ke...</div>
                                        <div className="max-h-40 overflow-y-auto custom-scroll">
                                            {projects.length > 0 ? projects.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => moveTaskToProject(t.id, p.id, p.name)}
                                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white truncate"
                                                >
                                                    {p.name}
                                                </button>
                                            )) : (
                                                <div className="px-3 py-2 text-xs text-slate-600 italic">Belum ada project</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Priority */}
                            <button 
                                onClick={() => togglePriority(t)}
                                className={`p-1.5 rounded-lg transition-all ${t.priority === 'high' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-orange-400 hover:bg-orange-500/10'}`}
                                title="Ubah Prioritas"
                            >
                                <span className="material-symbols-rounded text-sm">flag</span>
                            </button>

                            {/* --- TOMBOL DELETE (BARU) --- */}
                            <button 
                                onClick={() => deleteTask(t.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Hapus Task"
                            >
                                <span className="material-symbols-rounded text-sm">delete</span>
                            </button>

                            <button 
                                onClick={() => handleRefine(t)}
                                className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                title="Perbaiki Task dengan AI"
                            >
                                <span className="material-symbols-rounded text-sm">auto_fix</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                {tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-600 mt-4">
                        <span className="material-symbols-rounded text-4xl mb-2 opacity-20 block">inbox_customize</span>
                        <p className="text-xs">Inbox Kosong (Zen Mode)</p>
                    </div>
                )}
            </div>
            
            {showProjectMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(null)}></div>
            )}
        </div>
    );
}