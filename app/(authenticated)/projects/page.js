'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProjectService } from '@/services/projectService';
import { TaskService } from '@/services/taskService';
import { db, appId } from '@/lib/firebase'; 
import { collection, query, getDocs } from 'firebase/firestore'; 
import { generateSubtasksAction } from '@/app/actions/ai';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, closestCorners } from '@dnd-kit/core';
import toast from 'react-hot-toast';

// Components
import { ProjectCard } from '@/components/ProjectCard'; // Named import (sesuai export function)
import DroppableColumn from '@/components/DroppableColumn'; // [FIX] Default import (tanpa kurung kurawal)

export default function ProjectsPage() {
    const { user } = useAuth();
    
    // States
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]); 
    const [goals, setGoals] = useState([]);
    const [activeDragId, setActiveDragId] = useState(null);
    
    // Form States
    const [newProjName, setNewProjName] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState('');
    const [isMagicLoading, setIsMagicLoading] = useState(false);

    // 1. Fetch Data (Centralized)
    useEffect(() => {
        if (!user) return;
        
        const unsubProjects = ProjectService.subscribeProjects(user.uid, setProjects);
        
        // Kita butuh SEMUA tasks untuk hitung progress project
        let unsubTasks = () => {};
        if (TaskService && typeof TaskService.subscribeAllTasks === 'function') {
             unsubTasks = TaskService.subscribeAllTasks(user.uid, setTasks);
        }

        // Goals (Sekali fetch cukup)
        getDocs(query(collection(db, 'artifacts', appId, 'users', user.uid, 'goals')))
            .then(s => setGoals(s.docs.map(d => ({ id: d.id, ...d.data() }))));

        return () => { unsubProjects(); if(unsubTasks) unsubTasks(); };
    }, [user]);

    // 2. Drag Handlers
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            const project = active.data.current;
            // Panggil Service untuk logika bisnis
            await ProjectService.moveProject(user.uid, active.id, over.id, project);
        }
    };

    // 3. Actions
    const handleAdd = async () => {
        if (!newProjName.trim()) return;
        await ProjectService.addProject(user.uid, { name: newProjName, goalId: selectedGoalId });
        setNewProjName(''); setSelectedGoalId('');
        toast.success("Project dibuat");
    };

    const handleMagicPlan = async () => {
        if (!newProjName.trim()) return toast.error("Isi nama project dulu");
        setIsMagicLoading(true);
        const toastId = toast.loading("Meracik rencana...");

        try {
            const steps = await generateSubtasksAction(newProjName);
            
            // 1. Buat Project
            const projRef = await ProjectService.addProject(user.uid, { name: newProjName, goalId: selectedGoalId });
            
            // 2. Buat Tasks
            const promises = steps.map(step => TaskService.addTask(user.uid, step, 'normal', projRef.id));
            await Promise.all(promises);

            toast.success("Magic Plan Selesai! 🪄", { id: toastId });
            setNewProjName('');
        } catch (e) {
            console.error(e);
            toast.error("Gagal generate plan", { id: toastId });
        }
        setIsMagicLoading(false);
    };

    const handleDelete = (id) => {
        if(confirm("Hapus project?")) ProjectService.deleteProject(user.uid, id);
    };

    // Helper Filter
    const getProjectsByStatus = (status) => projects.filter(p => p.status === status);
    const activeProjectData = activeDragId ? projects.find(p => p.id === activeDragId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDragId(e.active.id)} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
                {/* Header & Input */}
                <div className="mb-8 space-y-4">
                    <h1 className="text-2xl font-bold text-white">Projects Board</h1>
                    
                    {/* Input Bar */}
                    <div className="glass-card p-4 flex flex-col md:flex-row gap-3">
                        <input value={newProjName} onChange={e => setNewProjName(e.target.value)} className="input-glass w-full" placeholder="Project baru..." />
                        <select value={selectedGoalId} onChange={e => setSelectedGoalId(e.target.value)} className="input-glass md:w-1/3 text-slate-300">
                            <option value="">-- Link Goal --</option>
                            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <button onClick={handleMagicPlan} disabled={isMagicLoading} className="btn-secondary px-4 py-3 rounded-xl flex items-center gap-2">
                                {isMagicLoading ? <span className="animate-spin material-symbols-rounded">sync</span> : <span className="material-symbols-rounded text-purple-400">auto_awesome</span>}
                            </button>
                            <button onClick={handleAdd} className="btn-primary px-6 py-3 rounded-xl font-bold">Buat</button>
                        </div>
                    </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['progress', 'todo', 'done'].map(status => (
                        <DroppableColumn key={status} id={status} title={status} count={getProjectsByStatus(status).length}>
                            {getProjectsByStatus(status).map(p => (
                                <ProjectCard 
                                    key={p.id} p={p} goals={goals} tasks={tasks} deleteProject={handleDelete} 
                                />
                            ))}
                        </DroppableColumn>
                    ))}
                </div>

                <DragOverlay>
                    {activeProjectData && <ProjectCard p={activeProjectData} goals={goals} tasks={tasks} isOverlay />}
                </DragOverlay>
            </div>
        </DndContext>
    );
}