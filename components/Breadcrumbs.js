'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
    const pathname = usePathname();
    
    // Jangan tampilkan di Dashboard (Home)
    if (pathname === '/dashboard') return null;

    const pathSegments = pathname.split('/').filter(p => p);

    const breadcrumbMap = {
        'dashboard': 'Home',
        'projects': 'Projects',
        'goals': 'Life Goals',
        'notes': 'Second Brain',
        'second-brain-chat': 'AI Chat',
        'library': 'Library',
        'finance': 'Finance',
        'settings': 'Settings',
        'trash': 'Trash',
        'log': 'Activity Log'
    };

    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-slate-500 mb-1">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link href="/dashboard" className="hover:text-blue-400 transition-colors flex items-center">
                        <span className="material-symbols-rounded text-lg">home</span>
                    </Link>
                </li>
                {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                    const label = breadcrumbMap[segment] || segment;
                    const isLast = index === pathSegments.length - 1;

                    return (
                        <li key={segment} className="flex items-center space-x-2">
                            <span className="material-symbols-rounded text-base text-slate-600">chevron_right</span>
                            {isLast ? (
                                <span className="font-semibold text-slate-200 capitalize cursor-default">
                                    {label}
                                </span>
                            ) : (
                                <Link href={href} className="hover:text-blue-400 transition-colors capitalize">
                                    {label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}