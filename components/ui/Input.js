// components/ui/Input.js
'use client';

export default function Input({ 
    label, 
    icon, 
    rightIcon, // [BARU] Icon kanan (misal: mata password)
    onRightIconClick, // [BARU] Action icon kanan
    error, // [BARU] Prop error visual
    ...props 
}) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {/* Icon Kiri */}
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400 pointer-events-none">
                        <span className="material-symbols-rounded text-lg">{icon}</span>
                    </div>
                )}
                
                <input
                    {...props}
                    className={`
                        w-full bg-slate-950/30 text-white text-sm rounded-xl border 
                        placeholder-slate-600 outline-none transition-all duration-300
                        ${icon ? 'pl-10' : 'pl-4'} 
                        ${rightIcon ? 'pr-10' : 'pr-4'} py-3
                        ${error 
                            ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10' 
                            : 'border-slate-700/50 focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-blue-500/10 hover:border-slate-600'
                        }
                        ${props.className || ''}
                    `}
                />

                {/* Icon Kanan (Interactive) */}
                {rightIcon && (
                    <button 
                        type="button"
                        onClick={onRightIconClick}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-rounded text-lg">{rightIcon}</span>
                    </button>
                )}
            </div>
            {/* Error Message */}
            {error && <span className="text-[10px] text-rose-400 font-medium ml-1">{error}</span>}
        </div>
    );
}