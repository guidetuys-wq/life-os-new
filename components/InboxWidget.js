'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { TaskService } from '@/services/taskService';
import toast from 'react-hot-toast';
import { playSound } from '@/lib/sounds';
import SwipeableItem from '@/components/ui/SwipeableItem'; // [NEW] Import

export default function InboxWidget() {
    const { user } = useAuth();
    
    // States
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]); 
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('normal'); 
    
    // UI States
    const [editingTask, setEditingTask] = useState(null); 
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        const qTask = query(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
        const unsubTasks = onSnapshot(qTask, (snap) => {
            const rawTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTasks(rawTasks.filter(t => !t.completed && (!t.projectId || t.projectId === '')));
        });
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
            playSound('pop');
            await TaskService.addTask(user.uid, newTask, newPriority);
            setNewTask('');
            setNewPriority('normal');
            toast.success("Masuk Inbox");
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedTasks);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTasks(newSet);
        if (newSet.size > 0) setIsSelectionMode(true);
        else setIsSelectionMode(false);
    };

    const clearSelection = () => {
        setSelectedTasks(new Set());
        setIsSelectionMode(false);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedTasks.size} task?`)) return;
        const batch = writeBatch(db);
        selectedTasks.forEach(id => {
            const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
            batch.delete(ref);
        });
        await batch.commit();
        playSound('trash');
        toast.success(`${selectedTasks.size} task dihapus`);
        clearSelection();
    };

    const handleBulkMove = async (projectId) => {
        const batch = writeBatch(db);
        selectedTasks.forEach(id => {
            const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
            batch.update(ref, { projectId });
        });
        await batch.commit();
        playSound('pop');
        toast.success(`${selectedTasks.size} task dipindahkan`);
        clearSelection();
    };

    const completeTask = async (id, text) => {
        if (isSelectionMode) return toggleSelection(id);
        playSound('complete');
        await TaskService.completeTask(user.uid, id, text);
        toast.success("Selesai! +10 XP");
    };

    const deleteTask = async (id) => {
        if(confirm("Hapus task ini?")) {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id));
            toast.success("Dihapus");
        }
    };

    const handleEditSave = async (id, newText) => {
        if(!newText.trim()) return;
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id), { text: newText });
        setEditingTask(null);
    };

    return (
        // [FIX] p-4 di mobile (sebelumnya p-6), min-h dikurangi agar tidak terlalu panjang kosongnya
        <div className="glass-card flex flex-col h-full min-h-[350px] p-4 md:p-6 relative group border border-white/5">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-blue-400">inbox</span> Inbox
                </h3>
                {isSelectionMode ? (
                    <button onClick={clearSelection} className="text-xs text-rose-400 font-bold hover:underline">
                        Batal ({selectedTasks.size})
                    </button>
                ) : (
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-lg font-mono">
                        {tasks.length}
                    </span>
                )}
            </div>
            
            {/* ... Input Bar & List Tasks (Kode lainnya tetap sama) ... */}
             {/* Input Bar */}
            <div className="flex items-center gap-2 mb-4 bg-slate-950/80 p-2 rounded-xl border border-slate-700/50 focus-within:border-blue-500/50 transition-all shadow-inner">
                <button 
                    onClick={() => setNewPriority(p => p === 'high' ? 'normal' : 'high')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newPriority === 'high' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-white'}`}
                >
                    <span className="material-symbols-rounded text-lg">{newPriority === 'high' ? 'priority_high' : 'radio_button_unchecked'}</span>
                </button>
                <input 
                    value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={handleAddTask}
                    placeholder="Ada ide apa? (Enter)..." className="bg-transparent w-full text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded mr-1">↵</span>
            </div>

            {/* List Tasks (Swipeable) */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 -mr-2 pb-16">
                {tasks.map(t => {
                    const isSelected = selectedTasks.has(t.id);
                    
                    // Konten Task (Reusable)
                    const TaskContent = (
                        <div 
                            onClick={() => isSelectionMode && toggleSelection(t.id)}
                            className={`group flex items-center gap-3 w-full p-3 transition-all border cursor-pointer h-full
                                ${isSelected ? 'bg-blue-900/20 border-blue-500/50' : 'hover:bg-slate-800/50 border-transparent hover:border-slate-700/50'}
                            `}
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); isSelectionMode ? toggleSelection(t.id) : completeTask(t.id, t.text); }} 
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
                                    ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 hover:border-blue-500'}
                                `}
                            >
                                {isSelected ? (
                                    <span className="material-symbols-rounded text-xs text-white">check</span>
                                ) : (
                                    <span className="material-symbols-rounded text-[10px] text-transparent group-hover:text-blue-400">check</span>
                                )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                                {editingTask === t.id ? (
                                    <input 
                                        autoFocus
                                        className="w-full bg-slate-950 text-white text-sm px-2 py-1 rounded border border-blue-500 outline-none"
                                        defaultValue={t.text}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(t.id, e.target.value)}
                                        onBlur={(e) => handleEditSave(t.id, e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {t.priority === 'high' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                                        )}
                                        <p 
                                            onDoubleClick={() => !isSelectionMode && setEditingTask(t.id)} 
                                            className={`text-sm truncate ${t.priority === 'high' ? 'text-rose-300 font-medium' : 'text-slate-300'}`}
                                        >
                                            {t.text}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                    if (isSelectionMode) {
                        return <div key={t.id} className="rounded-xl overflow-hidden border border-slate-800">{TaskContent}</div>;
                    }

                    return (
                        <SwipeableItem 
                            key={t.id}
                            onSwipeRight={() => completeTask(t.id, t.text)}
                            onSwipeLeft={() => deleteTask(t.id)}
                            leftColor="bg-emerald-500" 
                            rightColor="bg-rose-500"
                            leftIcon="check" 
                            rightIcon="delete"
                        >
                            {TaskContent}
                        </SwipeableItem>
                    );
                })}
            </div>
            
            {/* Floating Action Bar (Sama) */}
             {isSelectionMode && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 flex items-center justify-between animate-in slide-in-from-bottom-4 z-20">
                    <span className="text-xs font-bold text-white ml-3">{selectedTasks.size} Terpilih</span>
                    <div className="flex gap-1">
                        <div className="relative group/proj">
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors" title="Pindah ke Project">
                                <span className="material-symbols-rounded text-lg">drive_file_move</span>
                            </button>
                            {/* Simple Dropdown for Bulk Move */}
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl hidden group-hover/proj:block">
                                <div className="max-h-40 overflow-y-auto custom-scroll p-1">
                                    {projects.map(p => (
                                        <button key={p.id} onClick={() => handleBulkMove(p.id)} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg truncate">
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleBulkDelete} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors" title="Hapus Semua">
                            <span className="material-symbols-rounded text-lg">delete</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}