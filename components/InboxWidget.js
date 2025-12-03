'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { TaskService } from '@/services/taskService';
import { addXP, XP_VALUES } from '@/lib/gamification';
import toast from 'react-hot-toast';
import { refineTaskAction } from '@/app/actions/second-brain';

export default function InboxWidget() {
    const { user } = useAuth();
    
    // States
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]); // [NEW] Untuk integrasi move-to-project
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('normal'); // [NEW] Input Prioritas
    
    // UI States
    const [editingTask, setEditingTask] = useState(null); // ID task yang sedang diedit
    const [showProjectMenu, setShowProjectMenu] = useState(null); // ID task yang menu project-nya terbuka

    // 1. DATA LISTENER
    useEffect(() => {
        if (!user) return;

        // A. Tasks Listener (Inbox Only: Not Completed & No Project)
        const qTask = query(
            collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), 
            orderBy('createdAt', 'desc')
        );
        
        const unsubTasks = onSnapshot(qTask, (snap) => {
            const rawTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Filter client-side untuk Inbox: Belum selesai AND (ProjectId kosong/null)
            const inboxTasks = rawTasks.filter(t => !t.completed && (!t.projectId || t.projectId === ''));
            setTasks(inboxTasks);
        });

        // B. Fetch Projects (Sekali saja untuk dropdown)
        const fetchProjects = async () => {
            const snap = await getDocs(query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects')));
            setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchProjects();

        return () => unsubTasks();
    }, [user]);

    // 2. ACTIONS
    const handleAddTask = async (e) => {
        if (e.key === 'Enter' && newTask.trim()) {
            await TaskService.addTask(user.uid, newTask, newPriority); // Kirim prioritas
            setNewTask('');
            setNewPriority('normal');
            toast.success("Masuk Inbox");
        }
    };

    const completeTask = async (id, text) => {
        await TaskService.completeTask(user.uid, id, text);
        toast.success("Task Selesai! +10 XP");
    };

    const deleteTask = async (id) => {
        if(confirm("Hapus task ini?")) {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id));
            toast.success("Dihapus");
        }
    };

    // [INTEGRASI] Pindah ke Project
    const moveToProject = async (taskId, projectId, projectName) => {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), {
            projectId: projectId // Ini akan membuang task dari Inbox (karena filter di atas)
        });
        setShowProjectMenu(null);
        toast.success(`Dipindah ke ${projectName}`, { icon: '📂' });
    };

    const togglePriority = async (task) => {
        const nextMap = { 'normal': 'high', 'high': 'low', 'low': 'normal' };
        const next = nextMap[task.priority || 'normal'];
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id), { priority: next });
    };

    const handleEditSave = async (id, newText) => {
        if(!newText.trim()) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id), { text: newText });
        setEditingTask(null);
    };

    return (
        <div className="glass-card flex flex-col h-full min-h-[400px] p-6 relative group border border-white/5">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-blue-400">inbox</span> Inbox
                </h3>
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-lg font-mono">
                    {tasks.length}
                </span>
            </div>
            
            {/* Input Bar (UI Diperjelas) */}
            <div className="flex items-center gap-2 mb-4 bg-slate-950/80 p-2 rounded-xl border border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
                {/* Priority Toggle di Input */}
                <button 
                    onClick={() => setNewPriority(p => p === 'high' ? 'normal' : 'high')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newPriority === 'high' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-white'}`}
                    title="Set Prioritas Tinggi"
                >
                    <span className="material-symbols-rounded text-lg">
                        {newPriority === 'high' ? 'priority_high' : 'radio_button_unchecked'}
                    </span>
                </button>
                
                <input 
                    type="text" 
                    value={newTask} 
                    onChange={e => setNewTask(e.target.value)} 
                    onKeyDown={handleAddTask}
                    placeholder="Ada ide apa? (Enter)..." 
                    className="bg-transparent w-full text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-600 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded mr-1">↵</span>
            </div>

            {/* List Tasks */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 -mr-2">
                {tasks.map(t => (
                    <div key={t.id} className="group flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700/50 relative">
                        
                        {/* Checkbox */}
                        <button onClick={() => completeTask(t.id, t.text)} className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-blue-500 flex items-center justify-center transition-all group/check flex-shrink-0">
                            <span className="material-symbols-rounded text-[10px] text-transparent group-hover/check:text-blue-400 scale-0 group-hover/check:scale-100 transition-transform">check</span>
                        </button>
                        
                        {/* Content (Editable) */}
                        <div className="flex-1 min-w-0">
                            {editingTask === t.id ? (
                                <input 
                                    autoFocus
                                    className="w-full bg-slate-950 text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none"
                                    defaultValue={t.text}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(t.id, e.target.value)}
                                    onBlur={(e) => handleEditSave(t.id, e.target.value)}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    {/* Priority Indicator */}
                                    {t.priority === 'high' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                                    )}
                                    <p 
                                        onClick={() => setEditingTask(t.id)} 
                                        className={`text-sm transition-colors truncate cursor-text ${t.priority === 'high' ? 'text-white font-medium' : 'text-slate-300 group-hover:text-white'}`}
                                    >
                                        {t.text}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons (Hover Only) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            
                            {/* Priority Toggle */}
                            <button onClick={() => togglePriority(t)} className={`p-1.5 rounded-lg ${t.priority === 'high' ? 'text-rose-400' : 'text-slate-500 hover:text-orange-400'}`}>
                                <span className="material-symbols-rounded text-sm">flag</span>
                            </button>

                            {/* Move to Project (Integration) */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowProjectMenu(showProjectMenu === t.id ? null : t.id)}
                                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Pindahkan ke Project"
                                >
                                    <span className="material-symbols-rounded text-sm">drive_file_move</span>
                                </button>

                                {/* Dropdown Menu Project */}
                                {showProjectMenu === t.id && (
                                    <div className="absolute right-0 top-8 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-enter">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800">Pindah ke...</div>
                                        <div className="max-h-40 overflow-y-auto custom-scroll">
                                            {projects.length > 0 ? projects.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => moveToProject(t.id, p.id, p.name)}
                                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white truncate transition-colors"
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

                            {/* Delete */}
                            <button onClick={() => deleteTask(t.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                                <span className="material-symbols-rounded text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Empty State */}
                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-600 opacity-60">
                        <span className="material-symbols-rounded text-4xl mb-2">inbox_customize</span>
                        <p className="text-xs">Inbox Kosong (Zen Mode)</p>
                    </div>
                )}
            </div>

            {/* Click Outside Handler untuk Dropdown */}
            {showProjectMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(null)}></div>
            )}
        </div>
    );
}