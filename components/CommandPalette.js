'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/services/taskService';
import toast from 'react-hot-toast';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();
    const { user } = useAuth();

    // 1. Define Actions & Navigation
    const items = useMemo(() => [
        { type: 'Navigation', icon: 'dashboard', label: 'Go to Dashboard', action: () => router.push('/dashboard') },
        { type: 'Navigation', icon: 'splitscreen', label: 'Go to Projects', action: () => router.push('/projects') },
        { type: 'Navigation', icon: 'flag', label: 'Go to Goals', action: () => router.push('/goals') },
        { type: 'Navigation', icon: 'psychology', label: 'Go to Second Brain', action: () => router.push('/notes') },
        { type: 'Navigation', icon: 'account_balance_wallet', label: 'Go to Finance', action: () => router.push('/finance') },
        { type: 'Navigation', icon: 'local_library', label: 'Go to Library', action: () => router.push('/library') },
        
        { type: 'Action', icon: 'check_circle', label: 'Create New Task', action: () => {
            const text = prompt("Task baru:");
            if(text) {
                TaskService.addTask(user?.uid, text);
                toast.success("Task dibuat!");
            }
        }},
        { type: 'Action', icon: 'delete', label: 'Open Trash', action: () => router.push('/trash') },
        { type: 'Action', icon: 'settings', label: 'Settings', action: () => router.push('/settings') },
    ], [router, user]);

    // 2. Filter Logic
    const filteredItems = items.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    // 3. Keyboard Listeners
    useEffect(() => {
        const onKeydown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (isOpen) {
                if (e.key === 'Escape') setIsOpen(false);
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex(prev => (prev + 1) % filteredItems.length);
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredItems[activeIndex]) {
                        filteredItems[activeIndex].action();
                        setIsOpen(false);
                        setQuery('');
                    }
                }
            }
        };
        window.addEventListener('keydown', onKeydown);
        return () => window.removeEventListener('keydown', onKeydown);
    }, [isOpen, activeIndex, filteredItems]);

    // Reset index saat query berubah
    useEffect(() => setActiveIndex(0), [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
            <div 
                className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                    <span className="material-symbols-rounded text-slate-400 text-xl">search</span>
                    <input 
                        className="bg-transparent w-full text-lg text-white placeholder-slate-500 focus:outline-none"
                        placeholder="Ketik perintah atau tujuan..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ESC</span>
                </div>

                {/* Results List */}
                <div className="max-h-[300px] overflow-y-auto custom-scroll p-2 space-y-1">
                    {filteredItems.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Tidak ada hasil ditemukan.</div>
                    ) : (
                        filteredItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => { item.action(); setIsOpen(false); }}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                                    idx === activeIndex 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-300 hover:bg-white/5'
                                }`}
                            >
                                <span className={`material-symbols-rounded text-xl ${idx === activeIndex ? 'text-white' : 'text-slate-500'}`}>
                                    {item.icon}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{item.label}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${idx === activeIndex ? 'text-blue-200' : 'text-slate-600'}`}>
                                    {item.type}
                                </span>
                            </button>
                        ))
                    )}
                </div>
                
                {/* Footer Hint */}
                <div className="px-4 py-2 bg-slate-950/50 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
                    <span>Gunakan ↑ ↓ untuk navigasi</span>
                    <span>↵ untuk memilih</span>
                </div>
            </div>
        </div>
    );
}