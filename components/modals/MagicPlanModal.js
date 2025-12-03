'use client';
import { useState, useEffect } from 'react';
import { ProjectService } from '@/services/projectService';
import { generateActionPlanAction } from '@/app/actions/planner';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function MagicPlanModal({ isOpen, onClose, goal, uid }) {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);

    // Auto-generate saat modal dibuka
    useEffect(() => {
        if (isOpen && goal) {
            setLoading(true);
            setTasks([]);
            generatePlan();
        }
    }, [isOpen, goal]);

    const generatePlan = async () => {
        try {
            const context = `Area: ${goal.area}, Deadline: ${goal.deadline || 'Flexible'}`;
            const steps = await generateActionPlanAction(goal.title, context);
            setTasks(steps.map(t => ({ text: t, selected: true })));
        } catch (e) {
            toast.error("Gagal menghubungi AI");
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        const selected = tasks.filter(t => t.selected);
        
        if (selected.length === 0) {
             toast.error("Pilih minimal 1 langkah");
             return;
        }

        const toastId = toast.loading(`Membuat ${selected.length} Project...`);
        
        try {
            // [FIX LOGIC] Buat Project dengan status 'progress'
            const promises = selected.map(item => 
                ProjectService.addProject(uid, { 
                    name: item.text, 
                    goalId: goal.id, 
                    status: 'progress' // [FIX] Masuk ke kolom Progress
                })
            );

            await Promise.all(promises);

            toast.success(`${selected.length} Project Masuk Progress!`, { id: toastId, icon: '🚀' });
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Gagal eksekusi plan", { id: toastId });
        }
    };

    const toggleTask = (idx) => {
        const newTasks = [...tasks];
        newTasks[idx].selected = !newTasks[idx].selected;
        setTasks(newTasks);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* UI FIX: Gunakan Flex Column penuh agar Header & Footer sticky */}
            <div className="flex flex-col h-full max-h-[85vh]">
                
                {/* 1. HEADER (Padding Konsisten) */}
                <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-rounded text-purple-400">auto_awesome</span> 
                            Magic Plan
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Strategi untuk: <span className="text-white font-medium">{goal?.title}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1 -mr-2">
                        <span className="material-symbols-rounded text-2xl">close</span>
                    </button>
                </div>

                {/* 2. SCROLLABLE CONTENT (Padding Konsisten) */}
                <div className="flex-1 overflow-y-auto custom-scroll p-6 min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 animate-pulse h-full">
                            <span className="material-symbols-rounded text-4xl mb-3 text-purple-500">psychology</span>
                            <p>Merancang strategi...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">
                                Langkah yang disarankan:
                            </p>
                            
                            {tasks.length > 0 ? tasks.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => toggleTask(idx)} 
                                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                                        item.selected 
                                        ? 'bg-purple-500/10 border-purple-500/30' 
                                        : 'bg-slate-950/30 border-slate-800 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                                        item.selected ? 'bg-purple-500 border-purple-500' : 'border-slate-600 group-hover:border-slate-500'
                                    }`}>
                                        {item.selected && <span className="material-symbols-rounded text-xs text-white">check</span>}
                                    </div>
                                    <p className={`text-sm leading-relaxed ${item.selected ? 'text-white' : 'text-slate-500 line-through'}`}>
                                        {item.text}
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
                                    <p className="text-slate-500 text-sm">AI tidak memberikan saran spesifik.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. FOOTER ACTIONS (Padding Konsisten) */}
                <div className="p-6 pt-4 border-t border-white/5 bg-slate-900/50 shrink-0 flex gap-3 rounded-b-3xl">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors text-sm"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleExecute} 
                        disabled={loading} 
                        className="flex-[2] py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-symbols-rounded text-lg">rocket_launch</span>
                        Eksekusi ke Progress
                    </button>
                </div>
            </div>
        </Modal>
    );
}