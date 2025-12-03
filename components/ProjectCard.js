'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// 1. KOMPONEN VISUAL (Murni Tampilan - Dipakai oleh Original & Overlay)
export function ProjectCardContent({ p, goals, tasks, deleteProject, isOverlay, style }) {
    // Logic Progress Bar
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const total = projectTasks.length;
    const done = projectTasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    
    const linkedGoal = goals.find(g => g.id === p.goalId);

    return (
        <div 
            style={style}
            className={`
                p-4 rounded-xl border transition-all flex flex-col gap-2 relative group w-full
                ${isOverlay 
                    ? 'bg-slate-800 border-blue-500 shadow-2xl shadow-blue-900/20 scale-105 cursor-grabbing z-50 rotate-1' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 cursor-grab hover:-translate-y-1 hover:shadow-lg touch-none'
                }
            `}
        >
            {/* Header: Goal & Delete */}
            <div className="flex justify-between items-start">
                {linkedGoal ? (
                    <span className="text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20 truncate max-w-[120px]">
                        {linkedGoal.title}
                    </span>
                ) : <div className="h-4" />}
                
                {/* Delete hanya tampil di kartu asli (bukan overlay) */}
                {!isOverlay && (
                    <button 
                        onPointerDown={(e) => e.stopPropagation()} // Penting: Agar klik delete tidak memicu drag
                        onClick={() => deleteProject(p.id)} 
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                        <span className="material-symbols-rounded text-base">delete</span>
                    </button>
                )}
            </div>

            <h4 className="text-sm font-bold text-white leading-snug">{p.name}</h4>

            {/* Progress Bar */}
            {total > 0 && (
                <div className="mt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                        <span>{done}/{total}</span>
                        <span>{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 2. KOMPONEN LOGIC (Wrapper Draggable)
export function ProjectCard({ p, goals, tasks, deleteProject }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: p.id,
        data: { ...p }
    });

    const style = {
        // Gunakan Translate agar GPU optimized & lebih smooth
        transform: CSS.Translate.toString(transform),
        // Sembunyikan kartu asli saat di-drag (agar user melihat Overlay saja)
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-3">
            <ProjectCardContent p={p} goals={goals} tasks={tasks} deleteProject={deleteProject} />
        </div>
    );
}