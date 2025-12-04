'use client';
import Link from 'next/link';

export default function Button({ 
    children, 
    variant = 'primary', // primary, secondary, danger, ghost, outline
    size = 'md',         // sm, md, lg, icon
    icon,                // Material Symbol Icon Name (String)
    rightIcon,           // Icon di kanan
    isLoading = false, 
    href, 
    className = '', 
    disabled,
    ...props 
}) {
    // Base Styles: Flex, Rounded, Transition
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
    
    // Varian Warna (Sesuai Design System)
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 border border-transparent",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700",
        danger: "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent",
        outline: "bg-transparent border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white",
        success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 border border-transparent"
    };

    // Ukuran
    const sizes = {
        sm: "text-xs px-3 py-1.5 gap-1.5",
        md: "text-sm px-5 py-2.5 gap-2",
        lg: "text-base px-6 py-3.5 gap-2.5",
        icon: "p-2 aspect-square", // Khusus tombol kotak (misal: tombol close/menu)
    };

    const combinedClass = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

    // Konten Tombol (Support Loading & Icons)
    const content = (
        <>
            {isLoading && <span className="material-symbols-rounded animate-spin text-lg">sync</span>}
            {!isLoading && icon && <span className="material-symbols-rounded text-lg">{icon}</span>}
            <span>{children}</span>
            {!isLoading && rightIcon && <span className="material-symbols-rounded text-lg">{rightIcon}</span>}
        </>
    );

    // Render sebagai Link (jika ada href) atau Button biasa
    if (href && !disabled) {
        return (
            <Link href={href} className={combinedClass} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button className={combinedClass} disabled={isLoading || disabled} {...props}>
            {content}
        </button>
    );
}