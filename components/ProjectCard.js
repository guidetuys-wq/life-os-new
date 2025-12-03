'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export function ProjectCard({ p, goals, tasks, deleteProject, isOverlay }) {
    // Logic Draggable
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: p.id,
        data: { ...p }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.0 : 1,
    };

    // Kalkulasi Progress (Memoized di parent lebih baik, tapi di sini cukup oke untuk MVP)
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const total = projectTasks.length;
    const done = projectTasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    
    const linkedGoal = goals.find(g => g.id === p.goalId);

    // Wrapper agar bisa dipakai sebagai Overlay juga
    const Content = (
        <div className={`p-4 rounded-xl border transition-all flex flex-col gap-2 ${isOverlay ? 'bg-slate-800 border-blue-500 shadow-2xl rotate-2 cursor-grabbing' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 cursor-grab'}`}>
            
            {/* Header: Goal & Delete */}
            <div className="flex justify-between items-start">
                {linkedGoal ? (
                    <span className="text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20">
                        {linkedGoal.title}
                    </span>
                ) : <div />}
                
                {!isOverlay && (
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => deleteProject(p.id)} className="text-slate-600 hover:text-rose-400">
                        <span className="material-symbols-rounded text-base">delete</span>
                    </button>
                )}
            </div>

            <h4 className="text-sm font-bold text-white">{p.name}</h4>

            {/* Progress Bar */}
            {total > 0 && (
                <div className="mt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{done}/{total} Task</span>
                        <span>{percent}%</span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );

    if (isOverlay) return Content;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none mb-3">
            {Content}
        </div>
    );
}