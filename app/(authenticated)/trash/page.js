'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrashService } from '@/services/trashService';
import toast from 'react-hot-toast';

export default function TrashPage() {
    const { user } = useAuth();
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTrash = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const items = await TrashService.getTrashItems(user.uid);
            setTrashItems(items);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat sampah");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTrash();
    }, [user]);

    const handleRestore = async (item) => {
        await TrashService.restoreItem(user.uid, item);
        // Hapus item dari state lokal agar UI langsung update tanpa fetch ulang
        setTrashItems(prev => prev.filter(i => i.id !== item.id));
    };

    const handleDelete = async (item) => {
        if(confirm(`Yakin hapus ${item.typeLabel} ini selamanya?`)) {
            await TrashService.deletePermanently(user.uid, item);
            setTrashItems(prev => prev.filter(i => i.id !== item.id));
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32 animate-enter">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-slate-500">delete</span> Trash
                </h1>
                <button 
                    onClick={loadTrash} 
                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                    title="Refresh"
                >
                    <span className="material-symbols-rounded">refresh</span>
                </button>
            </div>
            
            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse flex flex-col items-center gap-2">
                    <span className="material-symbols-rounded text-3xl">sync</span>
                    <span className="text-xs font-mono">Memindai tempat sampah...</span>
                </div>
            ) : trashItems.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                    <span className="material-symbols-rounded text-6xl text-slate-700 mb-4">delete_sweep</span>
                    <p className="text-sm text-slate-500">Tempat sampah bersih.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {trashItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                            
                            {/* Icon & Title */}
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex flex-shrink-0 items-center justify-center border border-white/5">
                                    <span className="material-symbols-rounded text-slate-400">{item.typeIcon}</span>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate pr-4">{item.displayTitle}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                                        <span className="uppercase tracking-wider text-blue-400/80">{item.typeLabel}</span>
                                        <span>•</span>
                                        <span>Dihapus: {item.deletedAt?.seconds ? new Date(item.deletedAt.seconds * 1000).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2 shrink-0">
                                <button 
                                    onClick={() => handleRestore(item)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 flex items-center gap-1"
                                >
                                    <span className="material-symbols-rounded text-sm">history</span>
                                    <span className="hidden sm:inline">Restore</span>
                                </button>
                                <button 
                                    onClick={() => handleDelete(item)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Hapus Permanen"
                                >
                                    <span className="material-symbols-rounded text-lg">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}