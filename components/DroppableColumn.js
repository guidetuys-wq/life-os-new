'use client';
import { useDroppable } from '@dnd-kit/core';

export default function DroppableColumn({ id, title, count, color = 'border-slate-700/50', isCollapsed, onToggle, children }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    // --- TAMPILAN TERLIPAT (COLLAPSED) ---
    if (isCollapsed) {
        return (
            <div
                ref={setNodeRef}
                onClick={onToggle}
                className={`
                    flex flex-col items-center py-6 px-2 rounded-2xl transition-all duration-300 border border-white/5 cursor-pointer group
                    h-[500px] w-16 flex-shrink-0
                    ${isOver 
                        ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30' 
                        : 'bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-600'
                    }
                `}
                title={`Klik untuk membuka ${title}`}
            >
                {/* Status Dot */}
                <div className={`w-3 h-3 rounded-full mb-8 shadow-lg shadow-white/10 ${id === 'progress' ? 'bg-blue-500' : id === 'done' ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse-slow`}></div>
                
                {/* Vertical Text */}
                <div className="flex-1 flex items-center justify-center writing-vertical-rl rotate-180">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors whitespace-nowrap">
                        {title}
                    </h3>
                </div>

                {/* Count Badge */}
                <div className="mt-8 bg-slate-950 text-white text-[10px] font-bold w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center shadow-lg">
                    {count}
                </div>
            </div>
        );
    }

    // --- TAMPILAN PENUH (EXPANDED) ---
    return (
        <div 
            ref={setNodeRef} 
            className={`
                flex flex-col rounded-2xl p-4 transition-all duration-300 min-h-[500px] border flex-1 min-w-[300px]
                ${isOver 
                    ? 'bg-blue-600/10 border-blue-500/50 ring-4 ring-blue-500/10 scale-[1.01] shadow-inner' 
                    : 'bg-slate-800/30 border-white/5'
                }
            `}
        >
            {/* Header */}
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${color} mx-1`}>
                <span className={`w-2 h-2 rounded-full ${id === 'progress' ? 'bg-blue-500' : id === 'done' ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse-slow`}></span>
                
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isOver ? 'text-blue-300' : 'text-slate-300'}`}>
                    {title}
                </h3>
                <span className="bg-slate-950 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono ml-auto border border-white/5">
                    {count}
                </span>

                {/* Collapse Toggle */}
                <button
                    onClick={onToggle}
                    className="ml-2 text-slate-600 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                    title="Lipat Kolom"
                >
                    <span className="material-symbols-rounded text-lg">unfold_less</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-3 pt-1">
                {children}
                
                {/* Visual Placeholder saat Drag Over */}
                {isOver && count === 0 && (
                    <div className="h-24 rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 flex items-center justify-center animate-pulse">
                        <span className="text-blue-500/50 text-xs font-bold">Lepas di sini</span>
                    </div>
                )}

                {/* Empty State */}
                {!isOver && count === 0 && (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-800/50 rounded-xl mt-4">
                        <span className="material-symbols-rounded text-3xl mb-1 text-slate-700">sentiment_neutral</span>
                        <p className="text-xs font-medium text-slate-600">
                            {id === 'done' ? 'Belum ada yang selesai' : 'Kosong'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}