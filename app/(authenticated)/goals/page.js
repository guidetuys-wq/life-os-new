'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db';
import toast from 'react-hot-toast';

// Import Komponen UI Premium
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function GoalsPage() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // State Form
    const [formData, setFormData] = useState({ 
        title: '', 
        area: 'Career', 
        deadline: '',
        progress: 0 
    });

    // 1. Fetch Goals Realtime
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    // 2. Tambah Goal Baru
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error("Judul target wajib diisi!");
            return;
        }

        try {
            await addItem(user.uid, 'goals', {
                ...formData,
                progress: 0
            });
            setFormData({ title: '', area: 'Career', deadline: '', progress: 0 });
            setShowModal(false);
            toast.success("Target baru ditetapkan!", { icon: '🎯' });
        } catch (error) {
            toast.error("Gagal menyimpan target.");
        }
    };

    // 3. Update Progress (Slider)
    const updateProgress = async (id, val) => {
        // Optimistic UI update (opsional, tapi firestore onSnapshot sudah cukup cepat)
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'goals', id), { progress: parseInt(val) });
        } catch (e) {
            toast.error("Gagal update progress");
        }
    };

    // 4. Hapus Goal
    const handleDelete = async (id) => {
        if(confirm('Yakin ingin menghapus target ini?')) {
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'goals', id));
                toast.success('Target dihapus');
            } catch (e) { toast.error("Gagal menghapus"); }
        }
    };

    // Helper: Hitung Sisa Hari
    const getDaysLeft = (dateString) => {
        if (!dateString) return { text: 'No Deadline', color: 'text-slate-500' };
        
        const today = new Date();
        const target = new Date(dateString);
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

        if (diff < 0) return { text: `${Math.abs(diff)} Hari Lewat`, color: 'text-rose-400 font-bold' };
        if (diff === 0) return { text: 'Hari Ini!', color: 'text-amber-400 font-bold animate-pulse' };
        if (diff <= 7) return { text: `${diff} Hari Lagi 🔥`, color: 'text-amber-400 font-bold' };
        return { text: `${diff} Hari Lagi`, color: 'text-blue-300' };
    };

    // Helper: Style Berdasarkan Area
    const getAreaStyle = (area) => {
        switch(area) {
            case 'Finance': return 'from-emerald-900/40 to-slate-900 border-emerald-500/30 hover:border-emerald-500/50';
            case 'Health': return 'from-rose-900/40 to-slate-900 border-rose-500/30 hover:border-rose-500/50';
            case 'Career': return 'from-blue-900/40 to-slate-900 border-blue-500/30 hover:border-blue-500/50';
            case 'Spiritual': return 'from-purple-900/40 to-slate-900 border-purple-500/30 hover:border-purple-500/50';
            case 'Relationship': return 'from-pink-900/40 to-slate-900 border-pink-500/30 hover:border-pink-500/50';
            default: return 'from-slate-800 to-slate-900 border-slate-700 hover:border-slate-500';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            
            {/* Header Page */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Life Goals</h1>
                    <p className="text-sm text-slate-400">Visi jangka panjang & Impianmu.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="btn-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                    <span className="material-symbols-rounded text-lg">add_flag</span> Set Goal
                </button>
            </div>

            {/* Grid Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(g => {
                    const timeLeft = getDaysLeft(g.deadline);
                    const gradientClass = getAreaStyle(g.area);
                    
                    return (
                        <div key={g.id} className={`group relative p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 flex flex-col justify-between min-h-[200px] ${gradientClass}`}>
                            
                            {/* Top: Area & Delete */}
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-slate-950/50 border border-white/5 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg backdrop-blur-sm tracking-wider">
                                    {g.area}
                                </span>
                                <button 
                                    onClick={() => handleDelete(g.id)} 
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <span className="material-symbols-rounded text-sm">delete</span>
                                </button>
                            </div>

                            {/* Middle: Title & Date */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white leading-tight mb-2">{g.title}</h3>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="material-symbols-rounded text-base text-slate-500">event</span>
                                    <span className={`font-mono ${timeLeft.color}`}>{timeLeft.text}</span>
                                </div>
                            </div>

                            {/* Bottom: Progress Slider */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Progress</span>
                                    <span className={g.progress >= 100 ? 'text-emerald-400' : 'text-white'}>{g.progress}%</span>
                                </div>
                                <div className="relative h-2 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${g.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${g.progress}%` }}
                                    ></div>
                                    {/* Invisible Range Input for Dragging */}
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={g.progress || 0} 
                                        onChange={(e) => updateProgress(g.id, e.target.value)}
                                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>

                        </div>
                    );
                })}

                {/* Empty State */}
                {goals.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                        <span className="material-symbols-rounded text-6xl text-slate-700 mb-4 block">flag</span>
                        <p className="text-slate-500">Belum ada target impian.</p>
                    </div>
                )}
            </div>

            {/* MODAL ADD GOAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-enter">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                        
                        <h3 className="text-xl font-bold text-white mb-1">Target Baru</h3>
                        <p className="text-sm text-slate-400 mb-6">Apa yang ingin kamu capai?</p>

                        <form onSubmit={handleSave} className="flex flex-col gap-5">
                            <Input 
                                label="Judul Target"
                                placeholder="Cth: Tabungan 100 Juta..." 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="font-bold text-lg"
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Select 
                                    label="Area Hidup"
                                    value={formData.area} 
                                    onChange={e => setFormData({...formData, area: e.target.value})}
                                >
                                    <option value="Career">Career & Bisnis</option>
                                    <option value="Finance">Keuangan</option>
                                    <option value="Health">Kesehatan</option>
                                    <option value="Spiritual">Spiritual</option>
                                    <option value="Relationship">Relationship</option>
                                    <option value="Lifestyle">Hobi / Lifestyle</option>
                                </Select>

                                <Input 
                                    label="Deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                                Simpan Target
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}