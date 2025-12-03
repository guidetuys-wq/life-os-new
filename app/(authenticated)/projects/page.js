'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, serverTimestamp 
} from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db';
import { generateSubtasksAction } from '@/app/actions/ai'; // Import action AI
import { addXP, XP_VALUES } from '@/lib/gamification'; // [TAMBAH] Import Gamification

// --- DND KIT IMPORTS ---
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    DragOverlay, 
    closestCorners,
    useSensor, 
    useSensors, 
    PointerSensor,
    TouchSensor,
    MouseSensor
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- 1. KOMPONEN KONTEN KARTU (TAMPILAN) ---
// Ini dipisah agar bisa dipakai di Board biasa DAN di Drag Overlay (saat melayang)
function ProjectCardContent({ p, goals, tasks, deleteProject, isOverlay }) {
    // Cari Goal terkait
    const linkedGoal = goals.find(g => g.id === p.goalId);
    
    // Hitung Progress Real-time dari Task
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const totalTasks = projectTasks.length;
    const doneTasks = projectTasks.filter(t => t.completed).length;
    const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    // Warna Progress Bar
    let barColor = 'bg-blue-500';
    if(progressPercent === 100) barColor = 'bg-emerald-500';
    else if(progressPercent < 30) barColor = 'bg-slate-600';

    return (
        <div className={`
            p-4 rounded-xl border transition-all shadow-sm group relative flex flex-col gap-2
            ${isOverlay ? 'bg-slate-800 border-blue-500 shadow-2xl scale-105 cursor-grabbing z-50' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600 cursor-grab'}
        `}>
            {/* Header: Goal Tag & Delete */}
            <div className="flex justify-between items-start">
                {linkedGoal ? (
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-rounded text-[12px] text-orange-400">flag</span>
                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wide bg-orange-400/10 px-1.5 py-0.5 rounded">
                            {linkedGoal.title}
                        </span>
                    </div>
                ) : (
                    <div className="h-4"></div> // Spacer jika tidak ada goal
                )}
                
                {/* Tombol Delete (Hanya muncul jika tidak sedang di-drag) */}
                {!isOverlay && (
                    <button 
                        onPointerDown={(e) => e.stopPropagation()} // Mencegah drag saat klik delete
                        onClick={() => deleteProject(p.id)} 
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <span className="material-symbols-rounded text-base">delete</span>
                    </button>
                )}
            </div>
            
            {/* Judul Project */}
            <h4 className={`text-sm font-bold text-white leading-snug ${p.status === 'done' && !isOverlay ? 'line-through text-slate-500' : ''}`}>
                {p.name}
            </h4>

            {/* Progress Bar Otomatis */}
            {totalTasks > 0 && (
                <div className="mt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                        <span>{doneTasks}/{totalTasks} Tasks</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            )}
            
            {/* Jika tidak ada task, tampilkan hint */}
            {totalTasks === 0 && !isOverlay && (
                <p className="text-[10px] text-slate-600 italic">Belum ada task (Gunakan Magic Plan/Inbox)</p>
            )}
        </div>
    );
}

// --- 2. KOMPONEN DRAGGABLE (WRAPPER) ---
function DraggableProjectCard({ p, goals, tasks, deleteProject }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: p.id,
        data: { ...p } 
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.0 : 1, // Sembunyikan kartu asli saat ditarik (biar overlay yg terlihat)
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none mb-3">
            <ProjectCardContent p={p} goals={goals} tasks={tasks} deleteProject={deleteProject} />
        </div>
    );
}

// --- 3. KOMPONEN DROPPABLE (KOLOM) ---
function DroppableColumn({ id, title, count, color, children }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    
    return (
        <div 
            ref={setNodeRef} 
            className={`flex flex-col rounded-2xl p-3 transition-colors min-h-[500px] border border-transparent ${isOver ? 'bg-slate-800/30 border-blue-500/30' : 'bg-slate-900/20'}`}
        >
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${color} mx-1`}>
                <span className={`w-2 h-2 rounded-full ${color.replace('border-', 'bg-').replace('/20', '')} animate-pulse`}></span>
                <h3 className={`text-xs font-bold uppercase tracking-widest ${color.replace('border-', 'text-').replace('/20', '-400')}`}>{title}</h3>
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono ml-auto">
                    {count}
                </span>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

// --- 4. HALAMAN UTAMA ---
export default function ProjectsPage() {
    const { user } = useAuth();
    
    // States
    const [projects, setProjects] = useState([]);
    const [goals, setGoals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [newProjName, setNewProjName] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState('');
    const [isMagicLoading, setIsMagicLoading] = useState(false);
    const [activeDragId, setActiveDragId] = useState(null);

    // Fetch Data
    useEffect(() => {
        if (!user) return;
        
        // Projects Query dengan Filter Soft Delete
        const qP = query(
            collection(db, 'artifacts', appId, 'users', user.uid, 'projects'), 
            where('deleted', '!=', true), // <--- Filter ini wajib
            orderBy('createdAt', 'desc')
        );
        
        const unsubP = onSnapshot(qP, (s) => 
            setProjects(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        
        // 2. Tasks (untuk hitung progress)
        const unsubT = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks')), 
            s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        
        // 3. Goals (untuk dropdown & tag)
        const fetchGoals = async () => {
            const s = await getDocs(query(collection(db, 'artifacts', appId, 'users', user.uid, 'goals')));
            setGoals(s.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchGoals();

        return () => { unsubP(); unsubT(); };
    }, [user]);

    // [FIX] Konfigurasi Sensor:
    // 1. Mouse: Drag aktif jika digeser 10px (mencegah klik tidak sengaja)
    // 2. Touch: Drag HANYA aktif jika ditahan 250ms (agar user tetap bisa scroll)
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { 
            activationConstraint: { delay: 250, tolerance: 5 } 
        })
    );

    // --- LOGIC DRAG & DROP ---
    const handleDragStart = (event) => setActiveDragId(event.active.id);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            const newStatus = over.id; 
            const oldStatus = active.data.current?.status; // Ambil status lama

            const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'projects', active.id);
            await updateDoc(projectRef, { status: newStatus });

            // [FIX] Cek jika pindah ke DONE dari status lain
            if (newStatus === 'done' && oldStatus !== 'done') {
                const projName = active.data.current?.name || 'Project';
                await addXP(user.uid, XP_VALUES.PROJECT_DONE, 'PROJECT_DONE', `Project Tuntas: ${projName}`);
                toast.success("Project Selesai! +100 XP", { icon: '🎉' });
            }
        }
    };

    // --- LOGIC CRUD & MAGIC PLAN ---
    const addProject = async () => {
        if (!newProjName.trim()) return;
        await addItem(user.uid, 'projects', { 
            name: newProjName, 
            status: 'todo', 
            goalId: selectedGoalId || '', 
            createdAt: serverTimestamp(),
            deleted: false // <--- Tambahkan ini
        });
        setNewProjName(''); 
        setSelectedGoalId('');
    };

    const handleMagicPlan = async () => {
        if (!newProjName.trim()) {
            toast.error("Isi nama project dulu!"); // [FIX] Ganti alert
            return;
        }
        setIsMagicLoading(true);
        const toastId = toast.loading("Sedang meracik rencana..."); // [FIX] Tambah loading toast

        try {
            // 1. Generate Subtasks
            const steps = await generateSubtasksAction(newProjName);
            
            // 2. Buat Project
            const projRef = await addItem(user.uid, 'projects', { 
                name: newProjName, 
                status: 'todo', 
                goalId: selectedGoalId || '', 
                createdAt: serverTimestamp(),
                deleted: false
            });
            
            // 3. Masukkan Tasks
            const batchPromises = steps.map(step => 
                addItem(user.uid, 'tasks', {
                    text: step,
                    completed: false,
                    projectId: projRef.id,
                    isAiGenerated: true
                })
            );
            await Promise.all(batchPromises);

            toast.success(`Magic Plan Berhasil! ${steps.length} langkah dibuat.`, { id: toastId }); // [FIX] Success toast
            setNewProjName(''); 
            setSelectedGoalId('');
        } catch (e) {
            console.error(e);
            toast.error("Gagal menjalankan Magic Plan.", { id: toastId }); // [FIX] Error toast
        }
        setIsMagicLoading(false);
    };

    const deleteProject = async (id) => { 
        if(confirm('Pindahkan project ini ke sampah?')) {
            // Gunakan updateDoc, BUKAN deleteDoc
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id), {
                deleted: true,
                deletedAt: serverTimestamp()
            });
            // Tidak perlu toast di sini jika UI update otomatis via snapshot, tapi boleh ditambahkan
        }
    };

    // Cari data project yang sedang di-drag untuk ditampilkan di Overlay
    const activeProjectData = activeDragId ? projects.find(p => p.id === activeDragId) : null;

    return (
        // [FIX] Pasang sensors ke DndContext
        <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd} 
            collisionDetection={closestCorners}
        >
            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 md:pb-8 animate-enter">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">Projects Board</h1>
                    <p className="text-sm text-slate-400">Kelola fokus utama dan progress jangka pendek.</p>
                </div>

                {/* Input Area (New Project & Magic Plan) */}
                <div className="glass-card p-4 mb-8 flex flex-col md:flex-row gap-4">
                    <input 
                        value={newProjName} onChange={e => setNewProjName(e.target.value)} 
                        className="input-glass w-full" 
                        placeholder="Nama Project Baru..." 
                    />
                    
                    <select 
                        value={selectedGoalId} onChange={e => setSelectedGoalId(e.target.value)} 
                        className="input-glass md:w-1/3 cursor-pointer appearance-none"
                    >
                        <option value="">-- Kaitkan Goal --</option>
                        {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>

                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={handleMagicPlan} 
                            disabled={isMagicLoading || !newProjName.trim()}
                            className="btn-secondary px-4 py-3 rounded-xl font-bold text-purple-400 border-purple-500/30 hover:bg-purple-500/10 disabled:opacity-50 flex items-center gap-2"
                            title="Generate dengan AI"
                        >
                            {isMagicLoading ? <span className="animate-spin material-symbols-rounded">sync</span> : <span className="material-symbols-rounded">auto_awesome</span>}
                            <span className="hidden md:inline">Magic Plan</span>
                        </button>

                        <button 
                            onClick={addProject} 
                            disabled={!newProjName.trim()}
                            className="btn-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                            <span className="material-symbols-rounded">add</span> Buat
                        </button>
                    </div>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Progress Column */}
                    <DroppableColumn id="progress" title="In Progress" count={projects.filter(p => p.status === 'progress').length} color="border-blue-500/20">
                        {projects.filter(p => p.status === 'progress').map(p => (
                            <DraggableProjectCard key={p.id} p={p} goals={goals} tasks={tasks} deleteProject={deleteProject} />
                        ))}
                    </DroppableColumn>
                    
                    {/* Todo Column */}
                    <DroppableColumn id="todo" title="To Do" count={projects.filter(p => p.status === 'todo').length} color="border-slate-700/50">
                        {projects.filter(p => p.status === 'todo').map(p => (
                            <DraggableProjectCard key={p.id} p={p} goals={goals} tasks={tasks} deleteProject={deleteProject} />
                        ))}
                    </DroppableColumn>

                    {/* Done Column */}
                    <DroppableColumn id="done" title="Done" count={projects.filter(p => p.status === 'done').length} color="border-green-500/20">
                        {projects.filter(p => p.status === 'done').map(p => (
                            <DraggableProjectCard key={p.id} p={p} goals={goals} tasks={tasks} deleteProject={deleteProject} />
                        ))}
                    </DroppableColumn>
                </div>

                {/* Overlay saat Dragging (Efek Melayang) */}
                <DragOverlay>
                    {activeProjectData ? (
                        <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                            <ProjectCardContent p={activeProjectData} goals={goals} tasks={tasks} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}