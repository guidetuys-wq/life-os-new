'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // [FIX] Hapus orderBy
import { db, appId } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function TrashPage() {
    const { user } = useAuth();
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTrash = async () => {
        if (!user) return;
        setLoading(true);
        
        const collections = [
            { name: 'projects', label: 'Project', icon: 'splitscreen' },
            { name: 'goals', label: 'Goal', icon: 'flag' },
            { name: 'notes', label: 'Note', icon: 'description' }
        ];

        let allTrash = [];

        try {
            for (const col of collections) {
                // [FIX] Query disederhanakan: Hapus orderBy untuk menghindari error Index
                const q = query(
                    collection(db, 'artifacts', appId, 'users', user.uid, col.name),
                    where('deleted', '==', true)
                );
                
                const snap = await getDocs(q);
                snap.forEach(d => {
                    allTrash.push({ 
                        id: d.id, 
                        ...d.data(), 
                        type: col.name,
                        typeLabel: col.label,
                        typeIcon: col.icon
                    });
                });
            }
            // Sorting dilakukan di Client-Side (Sudah benar)
            allTrash.sort((a, b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0));
            setTrashItems(allTrash);
        } catch (error) {
            console.error("Error loading trash:", error);
            toast.error("Gagal memuat sampah");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTrash();
    }, [user]);

    // ... (Sisa kode handleRestore dan handlePermanentDelete tetap sama) ...

    return (
        // ... (JSX tetap sama) ...
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32 animate-enter">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-rounded text-slate-500">delete</span> Trash
                </h1>
                <button onClick={loadTrash} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-rounded text-slate-400">refresh</span>
                </button>
            </div>
            
            {/* ... Render List Trash ... */}
            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Memuat sampah...</div>
            ) : trashItems.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                    <span className="material-symbols-rounded text-6xl text-slate-700 mb-4">delete_sweep</span>
                    <p className="text-sm text-slate-500">Tempat sampah kosong.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {trashItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-slate-400">{item.typeIcon}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.title || item.name || "Tanpa Judul"}</h4>
                                    <p className="text-[10px] text-slate-500">
                                        Dihapus: {item.deletedAt?.seconds ? new Date(item.deletedAt.seconds * 1000).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRestore(item)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                                >
                                    Restore
                                </button>
                                <button 
                                    onClick={() => handlePermanentDelete(item)}
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