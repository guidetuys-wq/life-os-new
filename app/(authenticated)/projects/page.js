'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProjectService } from '@/services/projectService';
import { TaskService } from '@/services/taskService';
import { GoalService } from '@/services/goalService';
import { 
    DndContext, 
    DragOverlay, 
    useSensor, 
    useSensors, 
    MouseSensor, 
    TouchSensor, 
    closestCorners,
    defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import toast from 'react-hot-toast';

// Components
import { ProjectCard, ProjectCardContent } from '@/components/ProjectCard';
import DroppableColumn from '@/components/DroppableColumn';

// [CONFIG] Animasi Drop
const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: '0.5' } },
    }),
    duration: 250,
    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
};

export default function ProjectsPage() {
    const { user } = useAuth();
    
    // Data States
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]); 
    const [goals, setGoals] = useState([]); 
    
    // UI States
    const [activeDragId, setActiveDragId] = useState(null);
    const [collapsed, setCollapsed] = useState({ todo: false, progress: false, done: false }); // Default terbuka semua
    const [searchQuery, setSearchQuery] = useState('');
    
    // Form States
    const [newProjName, setNewProjName] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState('');

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        const unsubProjects = ProjectService.subscribeProjects(user.uid, setProjects);
        
        let unsubTasks = () => {};
        if (TaskService && typeof TaskService.subscribeAllTasks === 'function') {
             unsubTasks = TaskService.subscribeAllTasks(user.uid, setTasks);
        }

        let unsubGoals = () => {};
        if (GoalService && typeof GoalService.subscribeGoals === 'function') {
            unsubGoals = GoalService.subscribeGoals(user.uid, setGoals);
        }

        return () => { unsubProjects(); if(unsubTasks) unsubTasks(); if(unsubGoals) unsubGoals(); };
    }, [user]);

    // 2. Handlers
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
    );

    const handleDragStart = (event) => setActiveDragId(event.active.id);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragId(null);
        if (over && active.id !== over.id) {
            const project = active.data.current;
            await ProjectService.moveProject(user.uid, active.id, over.id, project);
        }
    };

    const toggleColumn = (id) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // 3. Actions
    const handleAdd = async () => {
        if (!newProjName.trim()) return toast.error("Nama project wajib diisi");
        try {
            await ProjectService.addProject(user.uid, { name: newProjName, goalId: selectedGoalId });
            setNewProjName(''); setSelectedGoalId('');
            toast.success("Project dibuat", { icon: '🚀' });
        } catch (e) { toast.error("Gagal membuat project"); }
    };

    const handleDelete = (id) => {
        if(confirm("Hapus project?")) ProjectService.deleteProject(user.uid, id);
    };

    // Helper Filter (Search Logic)
    const getProjectsByStatus = (status) => {
        return projects
            .filter(p => p.status === status)
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    };
    
    const activeProjectData = activeDragId ? projects.find(p => p.id === activeDragId) : null;

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd} 
        >
            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
                
                {/* --- HEADER SECTION --- */}
                <div className="mb-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Project Board</h1>
                            <p className="text-sm text-slate-400">Papan strategi dan eksekusi.</p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative w-full md:w-64 group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 material-symbols-rounded transition-colors">search</span>
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari project..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-all placeholder-slate-600"
                            />
                        </div>
                    </div>
                    
                    {/* Input Bar (Create) */}
                    <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-rounded">add_circle</span>
                            <input 
                                value={newProjName} 
                                onChange={e => setNewProjName(e.target.value)} 
                                className="input-glass w-full text-sm py-2.5 pl-10" 
                                placeholder="Mulai project baru..." 
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        
                        <select 
                            value={selectedGoalId} 
                            onChange={e => setSelectedGoalId(e.target.value)} 
                            className="input-glass md:w-1/3 text-sm text-slate-300 cursor-pointer h-[42px]"
                        >
                            <option value="">-- Link Goal (Opsional) --</option>
                            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                        </select>

                        <button 
                            onClick={handleAdd} 
                            disabled={!newProjName.trim()}
                            className="btn-primary w-full md:w-auto h-[42px] px-6 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all whitespace-nowrap"
                        >
                            Buat
                        </button>
                    </div>
                </div>

                {/* --- KANBAN BOARD --- */}
                <div className="flex gap-6 overflow-x-auto pb-4 items-start min-h-[600px]">
                    {['todo', 'progress', 'done'].map(status => (
                        <DroppableColumn 
                            key={status} 
                            id={status} 
                            title={status.toUpperCase()} 
                            count={getProjectsByStatus(status).length} 
                            isCollapsed={collapsed[status]}
                            onToggle={() => toggleColumn(status)}
                            color={status === 'progress' ? 'border-blue-500/20' : status === 'done' ? 'border-emerald-500/20' : 'border-slate-700/50'}
                        >
                            {getProjectsByStatus(status).map(p => (
                                <ProjectCard 
                                    key={p.id} p={p} goals={goals} tasks={tasks} deleteProject={handleDelete} 
                                />
                            ))}
                        </DroppableColumn>
                    ))}
                </div>

                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeProjectData ? (
                        <ProjectCardContent 
                            p={activeProjectData} goals={goals} tasks={tasks} isOverlay={true} 
                        />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}