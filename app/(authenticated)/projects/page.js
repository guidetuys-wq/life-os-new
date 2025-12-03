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
    pointerWithin // [TUNE] Gunakan pointerWithin untuk deteksi lebih akurat
} from '@dnd-kit/core';
import toast from 'react-hot-toast';

// Components
import { ProjectCard, ProjectCardContent } from '@/components/ProjectCard';
import DroppableColumn from '@/components/DroppableColumn';

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

        return () => { 
            unsubProjects(); 
            if(unsubTasks) unsubTasks(); 
            if(unsubGoals) unsubGoals(); 
        };
    }, [user]);

    // 2. Drag Handlers (TUNING SENSITIVITAS)
    const sensors = useSensors(
        useSensor(MouseSensor, { 
            activationConstraint: { 
                distance: 12, // [BERAT] Harus geser 12px dulu baru dianggap drag (sebelumnya 5px)
            } 
        }),
        useSensor(TouchSensor, { 
            activationConstraint: { 
                delay: 200, // [BERAT] Tahan 200ms (0.2 detik) baru angkat
                tolerance: 5, // Toleransi goyang jari 5px saat menahan
            } 
        })
    );

    const handleDragStart = (event) => {
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            const project = active.data.current;
            await ProjectService.moveProject(user.uid, active.id, over.id, project);
        }
    };

    // 3. Actions
    const handleAdd = async () => {
        if (!newProjName.trim()) {
            return toast.error("Nama project wajib diisi");
        }
        
        try {
            await ProjectService.addProject(user.uid, { name: newProjName, goalId: selectedGoalId });
            setNewProjName(''); 
            setSelectedGoalId('');
            toast.success("Project dibuat", { icon: '🚀' });
        } catch (e) {
            toast.error("Gagal membuat project");
        }
    };

    const handleDelete = (id) => {
        if(confirm("Hapus project?")) ProjectService.deleteProject(user.uid, id);
    };

    // Helper Filter
    const getProjectsByStatus = (status) => projects.filter(p => p.status === status);
    const activeProjectData = activeDragId ? projects.find(p => p.id === activeDragId) : null;

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} // Algoritma deteksi tabrakan terbaik untuk grid
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd} 
        >
            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
                {/* Header & Input */}
                <div className="mb-8 space-y-4">
                    <h1 className="text-2xl font-bold text-white">Projects Board</h1>
                    <p className="text-sm text-slate-400">Kelola inisiatif strategis Anda di sini.</p>
                    
                    {/* Input Bar */}
                    <div className="glass-card p-4 flex flex-col md:flex-row gap-3">
                        <input 
                            value={newProjName} 
                            onChange={e => setNewProjName(e.target.value)} 
                            className="input-glass w-full" 
                            placeholder="Nama Project Baru..." 
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        
                        <select 
                            value={selectedGoalId} 
                            onChange={e => setSelectedGoalId(e.target.value)} 
                            className="input-glass md:w-1/3 text-slate-300 cursor-pointer"
                        >
                            <option value="">-- Link Goal (Opsional) --</option>
                            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                        </select>

                        <button 
                            onClick={handleAdd} 
                            disabled={!newProjName.trim()}
                            className="btn-primary px-6 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded">add</span>
                            Buat
                        </button>
                    </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['progress', 'todo', 'done'].map(status => (
                        <DroppableColumn 
                            key={status} 
                            id={status} 
                            title={status} 
                            count={getProjectsByStatus(status).length} 
                            color={status === 'progress' ? 'border-blue-500/20' : status === 'done' ? 'border-green-500/20' : 'border-slate-700/50'}
                        >
                            {getProjectsByStatus(status).map(p => (
                                <ProjectCard 
                                    key={p.id} p={p} goals={goals} tasks={tasks} deleteProject={handleDelete} 
                                />
                            ))}
                        </DroppableColumn>
                    ))}
                </div>

                {/* Drag Overlay (Visual Only) */}
                <DragOverlay 
                    // [TUNE] Animasi drop dipercepat sedikit agar terasa 'snappy'
                    dropAnimation={{ 
                        duration: 200, 
                        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' 
                    }}
                >
                    {activeProjectData ? (
                        <ProjectCardContent 
                            p={activeProjectData} 
                            goals={goals} 
                            tasks={tasks} 
                            isOverlay={true} 
                        />
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}