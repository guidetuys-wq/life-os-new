'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export function ProjectCardContent({ p, goals, tasks, deleteProject, isOverlay, style }) {
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const total = projectTasks.length;
    const done = projectTasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    
    const linkedGoal = goals.find(g => g.id === p.goalId);

    return (
        <div 
            style={style}
            className={`
                p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-2 relative group w-full
                ${isOverlay 
                    ? 'bg-slate-800 border-blue-500 shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] scale-105 cursor-grabbing z-50 rotate-2 ring-2 ring-blue-400/50' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 cursor-grab active:cursor-grabbing'
                }
            `}
        >
            {/* ... (Konten dalam kartu sama seperti sebelumnya) ... */}
            <div className="flex justify-between items-start">
                {linkedGoal ? (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20 truncate max-w-[120px] tracking-wider">
                        {linkedGoal.title}
                    </span>
                ) : <div className="h-4" />}
                
                {!isOverlay && (
                    <button 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={() => deleteProject(p.id)} 
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                        <span className="material-symbols-rounded text-base">delete</span>
                    </button>
                )}
            </div>

            <h4 className="text-base font-bold text-white leading-snug tracking-tight">{p.name}</h4>

            {total > 0 && (
                <div className="mt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                        <span className={percent === 100 ? 'text-emerald-400' : 'text-slate-400'}>{done}/{total}</span>
                        <span className={percent === 100 ? 'text-emerald-400' : 'text-blue-400 font-bold'}>{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className={`h-full rounded-full transition-all duration-500`} 
                            style={{ 
                                width: `${percent}%`, 
                                background: percent === 100 ? '#10b981' : '#3b82f6', 
                                boxShadow: `0 0 8px ${percent === 100 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                            }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function ProjectCard({ p, goals, tasks, deleteProject }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: p.id,
        data: { ...p }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1, // [TUNE] Jangan 0, beri opacity agar user tahu asalnya dari mana
        filter: isDragging ? 'grayscale(100%) blur(1px)' : 'none', // Efek visual saat ditinggalkan
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-4">
            <ProjectCardContent p={p} goals={goals} tasks={tasks} deleteProject={deleteProject} />
        </div>
    );
}