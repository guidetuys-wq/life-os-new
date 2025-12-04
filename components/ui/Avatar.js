export default function Avatar({ src, name = 'User', size = 'md', className = '' }) {
    const sizes = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-24 h-24 text-3xl"
    };

    return (
        <div className={`
            relative rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-inner flex items-center justify-center
            bg-gradient-to-tr from-blue-600 to-indigo-600
            ${sizes[size]} ${className}
        `}>
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span className="font-bold text-white font-mono select-none">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
            )}
        </div>
    );
}