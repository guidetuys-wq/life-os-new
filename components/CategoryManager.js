'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FinanceService } from '@/services/financeService'; // Gunakan service
import toast from 'react-hot-toast';

export default function CategoryManager({ onClose }) {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Categories via Service
    useEffect(() => {
        if (!user) return;
        const unsub = FinanceService.subscribeCategories(user.uid, setCategories);
        return () => unsub();
    }, [user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCat.trim()) return;
        
        setIsLoading(true);
        try {
            // Cek duplikat client-side
            if (categories.some(c => c.name.toLowerCase() === newCat.trim().toLowerCase())) {
                throw new Error("Kategori sudah ada!");
            }
            await FinanceService.addCategory(user.uid, newCat);
            setNewCat('');
        } catch (error) {
            toast.error(error.message);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (confirm('Hapus kategori ini?')) {
            try {
                await FinanceService.deleteCategory(user.uid, id);
            } catch (error) {
                toast.error('Gagal menghapus');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-enter">
            <div className="bg-slate-900/90 border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Kelola Kategori</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
                        <span className="material-symbols-rounded text-lg">close</span>
                    </button>
                </div>

                {/* List Categories */}
                <div className="p-2 h-64 overflow-y-auto custom-scroll">
                    {categories.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                            <span className="material-symbols-rounded text-3xl mb-2 opacity-50">category</span>
                            <p>Belum ada kategori custom</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {categories.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-3 hover:bg-slate-800/50 rounded-xl group transition-colors">
                                    <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                                    <button 
                                        onClick={() => handleDelete(c.id)} 
                                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                        <span className="material-symbols-rounded text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Input */}
                <form onSubmit={handleAdd} className="p-4 bg-slate-800/50 border-t border-slate-700/50 flex gap-2">
                    <input 
                        value={newCat} 
                        onChange={(e) => setNewCat(e.target.value)}
                        placeholder="Kategori baru..." 
                        className="input-glass w-full py-2.5 text-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !newCat.trim()}
                        className="btn-primary w-12 rounded-xl flex items-center justify-center disabled:opacity-50"
                    >
                        {isLoading ? <span className="animate-spin material-symbols-rounded text-sm">sync</span> : <span className="material-symbols-rounded">add</span>}
                    </button>
                </form>
            </div>
        </div>
    );
}