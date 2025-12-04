export default function Badge({ 
    children, 
    variant = 'default', // default, success, warning, error, info, brand
    size = 'md',         // sm, md
    icon,
    className = '' 
}) {
    const variants = {
        default: "bg-slate-800 text-slate-400 border-slate-700",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        error:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
        info:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
        brand:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    const sizes = {
        sm: "text-[9px] px-1.5 py-0.5 gap-1",
        md: "text-[10px] px-2.5 py-1 gap-1.5",
    };

    return (
        <span className={`
            inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-wider border
            ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}
        `}>
            {icon && <span className="material-symbols-rounded text-sm">{icon}</span>}
            {children}
        </span>
    );
}