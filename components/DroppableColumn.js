// components/DroppableColumn.js
'use client';
import { useDroppable } from '@dnd-kit/core';

export default function DroppableColumn({ id, title, count, color = 'border-slate-700/50', children }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    // Helper untuk dynamic styling berdasarkan prop 'color'
    // Contoh color input: 'border-blue-500/20'
    // Output bg: 'bg-blue-500'
    // Output text: 'text-blue-400'
    const bgColor = color.replace('border-', 'bg-').replace('/20', '').replace('/50', '');
    const textColor = color.replace('border-', 'text-').replace('/20', '-400').replace('/50', '-400');

    return (
        <div 
            ref={setNodeRef} 
            className={`
                flex flex-col rounded-2xl p-3 transition-all min-h-[500px] border 
                ${isOver ? 'bg-slate-800/50 border-blue-500/30 ring-2 ring-blue-500/10' : 'bg-slate-900/20 border-transparent'}
            `}
        >
            {/* Column Header */}
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${color} mx-1`}>
                <span className={`w-2 h-2 rounded-full ${bgColor} animate-pulse`}></span>
                <h3 className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>
                    {title}
                </h3>
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono ml-auto">
                    {count}
                </span>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-3">
                {children}
            </div>
        </div>
    );
}