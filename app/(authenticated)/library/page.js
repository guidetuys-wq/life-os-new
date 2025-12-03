'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LibraryService } from '@/services/libraryService'; // [NEW]
import { GoalService } from '@/services/goalService';       // [NEW] Reuse Goal Service
import toast from 'react-hot-toast';

// Import UI Premium
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function LibraryPage() {
    const { user } = useAuth();
    
    // Data States
    const [items, setItems] = useState([]);
    const [goals, setGoals] = useState([]);
    
    // UI/Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All'); // All, book, movie, course...
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({ 
        title: '', 
        type: 'book', 
        status: 'queue',
        goalId: '', 
        rating: 0,
        review: ''
    });

    // 1. Fetch Data (Centralized)
    useEffect(() => {
        if (!user) return;
        
        // Subscribe Library
        const unsubLibrary = LibraryService.subscribeLibrary(user.uid, setItems);

        // Subscribe Goals (untuk Dropdown Link)
        // Pastikan GoalService.subscribeGoals tersedia
        let unsubGoals = () => {};
        if (GoalService && typeof GoalService.subscribeGoals === 'function') {
             unsubGoals = GoalService.subscribeGoals(user.uid, setGoals);
        }

        return () => { unsubLibrary(); unsubGoals(); };
    }, [user]);

    // 2. Logic Filter & Search
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'All' || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [items, searchQuery, filterType]);

    // 3. Actions
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) { toast.error("Judul wajib diisi"); return; }

        try {
            await LibraryService.addItem(user.uid, formData);
            // Reset Form
            setFormData({ title: '', type: 'book', status: 'queue', goalId: '', rating: 0, review: '' });
            setShowModal(false);
        } catch (error) {
            toast.error("Gagal menyimpan.");
        }
    };

    const handleDelete = (id) => {
        if(confirm('Hapus item ini dari library?')) {
            LibraryService.deleteItem(user.uid, id);
        }
    };

    const updateStatus = (item, newStatus) => {
        LibraryService.updateStatus(user.uid, item.id, newStatus);
    };

    const updateRating = (item, newRating) => {
        LibraryService.updateItem(user.uid, item.id, { rating: newRating });
    };

    // Helper: UI Configs
    const getTypeInfo = (type) => {
        const map = {
            book: { icon: 'menu_book', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Buku' },
            movie: { icon: 'movie', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', label: 'Film' },
            course: { icon: 'school', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Kursus' },
            article: { icon: 'article', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', label: 'Artikel' }
        };
        return map[type] || map.book;
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active': return { class: 'bg-blue-500 text-white animate-pulse', label: 'Sedang Proses' };
            case 'done': return { class: 'bg-emerald-500 text-white', label: 'Selesai' };
            default: return { class: 'bg-slate-700 text-slate-400', label: 'Antrean' };
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Library</h1>
                    <p className="text-sm text-slate-400">Koleksi pengetahuan dan hiburanmu.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-rounded">search</span>
                        <input 
                            type="text" 
                            placeholder="Cari judul..." 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="btn-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-rounded">add</span> <span className="hidden md:inline">Tambah</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                {['All', 'book', 'course', 'movie', 'article'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border capitalize ${
                            filterType === type 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                            : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        {type === 'All' ? 'Semua' : type}
                    </button>
                ))}
            </div>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredItems.map(item => {
                    const info = getTypeInfo(item.type);
                    const statusInfo = getStatusBadge(item.status);
                    const linkedGoal = goals.find(g => g.id === item.goalId);

                    return (
                        <div key={item.id} className="card-enhanced p-5 flex flex-col justify-between group h-full">
                            
                            {/* Top Info */}
                            <div className="flex justify-between items-start mb-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${info.color}`}>
                                    <span className="material-symbols-rounded text-sm">{info.icon}</span> {info.label}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(item.id)} className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors">
                                        <span className="material-symbols-rounded text-base">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-4 flex-1">
                                <h4 className="text-base font-bold text-white leading-snug mb-2 line-clamp-2" title={item.title}>
                                    {item.title}
                                </h4>
                                {linkedGoal && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/50 px-2 py-1 rounded w-fit border border-slate-800/50">
                                        <span className="material-symbols-rounded text-xs text-orange-400">flag</span>
                                        <span>{linkedGoal.title}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-3 border-t border-slate-700/30">
                                {/* Status Control */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${statusInfo.class}`}>
                                        {statusInfo.label}
                                    </span>
                                    
                                    <select 
                                        value={item.status} 
                                        onChange={(e) => updateStatus(item, e.target.value)}
                                        className="bg-transparent text-[10px] text-slate-400 border border-slate-700 rounded px-1 py-0.5 outline-none hover:border-slate-500 cursor-pointer"
                                    >
                                        <option className="bg-slate-900" value="queue">Queue</option>
                                        <option className="bg-slate-900" value="active">Active</option>
                                        <option className="bg-slate-900" value="done">Done</option>
                                    </select>
                                </div>

                                {/* Rating (Interactive) */}
                                {(item.status === 'done' || item.rating > 0) && (
                                    <div className="flex items-center justify-center gap-1 bg-slate-900/50 py-1.5 rounded-lg border border-slate-800">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star}
                                                onClick={() => updateRating(item, star)}
                                                className={`text-sm transition-transform hover:scale-125 ${star <= item.rating ? 'text-amber-400' : 'text-slate-700'}`}
                                            >
                                                <span className="material-symbols-rounded filled-icon">star</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
                <div className="text-center py-20 opacity-50 border-2 border-dashed border-slate-800 rounded-3xl mt-8">
                    <span className="material-symbols-rounded text-6xl text-slate-700 mb-4 block">local_library</span>
                    <p className="text-slate-500">Rak buku masih kosong.</p>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-enter">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                        
                        <h3 className="text-xl font-bold text-white mb-6">Tambah Koleksi</h3>

                        <form onSubmit={handleSave} className="flex flex-col gap-5">
                            <Input 
                                label="Judul"
                                placeholder="Judul Buku / Film / Kursus..."
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                autoFocus
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Select 
                                    label="Tipe"
                                    icon="category"
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="book">Buku 📚</option>
                                    <option value="course">Kursus 🎓</option>
                                    <option value="movie">Film 🎬</option>
                                    <option value="article">Artikel 📄</option>
                                </Select>

                                <Select 
                                    label="Status"
                                    icon="flag"
                                    value={formData.status} 
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="queue">Antrean</option>
                                    <option value="active">Sedang Proses</option>
                                    <option value="done">Selesai</option>
                                </Select>
                            </div>

                            <Select 
                                label="Kaitkan dengan Goal (Opsional)"
                                icon="track_changes"
                                value={formData.goalId} 
                                onChange={e => setFormData({...formData, goalId: e.target.value})}
                            >
                                <option value="">-- Tidak Ada --</option>
                                {goals.map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </Select>

                            {/* Rating Input */}
                            {formData.status === 'done' && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star} type="button"
                                                onClick={() => setFormData({...formData, rating: star})}
                                                className={`text-2xl transition-transform hover:scale-110 ${star <= formData.rating ? 'text-amber-400' : 'text-slate-700'}`}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                                Simpan ke Library
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}