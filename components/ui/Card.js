export default function Card({ children, className = '', hover = false, ...props }) {
    return (
        <div 
            className={`
                bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl overflow-hidden
                ${hover ? 'transition-all duration-300 hover:bg-slate-800/50 hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : ''}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}