'use client';

export default function Select({ label, icon, options = [], className = '', ...props }) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400 pointer-events-none">
                        <span className="material-symbols-rounded text-lg">{icon}</span>
                    </div>
                )}
                
                <select
                    {...props}
                    className={`
                        w-full bg-slate-950/30 text-white rounded-xl border border-slate-700/50 
                        outline-none appearance-none cursor-pointer transition-all duration-300
                        focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/10
                        hover:border-slate-600
                        /* [FIX] Font size 16px mobile */
                        text-base md:text-sm
                        ${icon ? 'pl-10 pr-10 py-3' : 'px-4 pr-10 py-3'}
                        ${className}
                    `}
                >
                    {props.children}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-white transition-colors">
                    <span className="material-symbols-rounded text-xl">unfold_more</span>
                </div>
            </div>
        </div>
    );
}