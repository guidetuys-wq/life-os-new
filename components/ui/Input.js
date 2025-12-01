'use client';

export default function Input({ label, icon, ...props }) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400">
                        <span className="material-symbols-rounded text-lg">{icon}</span>
                    </div>
                )}
                <input
                    {...props}
                    className={`
                        w-full bg-slate-950/30 text-white text-sm rounded-xl border border-slate-700/50 
                        placeholder-slate-600 outline-none transition-all duration-300
                        focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/10
                        hover:border-slate-600
                        ${icon ? 'pl-10 pr-4 py-3' : 'px-4 py-3'}
                        ${props.className || ''}
                    `}
                />
            </div>
        </div>
    );
}