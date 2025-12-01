'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db';
import toast from 'react-hot-toast';

// Import UI Premium
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function NotesPage() {
    const { user } = useAuth();
    
    // Data States
    const [notes, setNotes] = useState([]);
    const [projects, setProjects] = useState([]);
    
    // UI/Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({ 
        title: '', 
        content: '', 
        tags: '', 
        color: 'slate', 
        projectId: '', 
        isPinned: false 
    });

    // 1. Fetch Data (Notes & Projects)
    useEffect(() => {
        if (!user) return;
        
        // Listen Notes
        const unsubNotes = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'notes'), orderBy('createdAt', 'desc')), 
            (snap) => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        // Fetch Projects (Untuk dropdown link)
        const fetchProjects = async () => {
            const snap = await getDocs(query(collection(db, 'artifacts', appId, 'users', user.uid, 'projects')));
            setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchProjects();

        return () => unsubNotes();
    }, [user]);

    // 2. Logic Filter & Search
    const allTags = useMemo(() => {
        const tags = new Set(['All']);
        notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [notes]);

    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              n.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag === 'All' || n.tags?.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    // Sort: Pinned selalu di atas
    const sortedNotes = filteredNotes.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

    // 3. Actions
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) { toast.error("Judul wajib diisi"); return; }

        try {
            // Proses Tags (Pisahkan koma -> Array)
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);

            await addItem(user.uid, 'notes', {
                ...formData,
                tags: tagsArray,
                createdAt: serverTimestamp()
            });
            
            setFormData({ title: '', content: '', tags: '', color: 'slate', projectId: '', isPinned: false });
            setShowModal(false);
            toast.success("Catatan tersimpan!", { icon: '🧠' });
        } catch (error) {
            toast.error("Gagal menyimpan.");
        }
    };

    const handleDelete = async (id) => {
        if(confirm('Hapus catatan ini?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', id));
            toast.success('Dihapus');
        }
    };

    const togglePin = async (note) => {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', note.id), { isPinned: !note.isPinned });
    };

    const copyContent = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Disalin ke clipboard");
    };

    // Color Map (Untuk Card Background)
    const colorMap = {
        slate: 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500',
        blue: 'bg-blue-900/20 border-blue-500/20 hover:border-blue-400',
        green: 'bg-emerald-900/20 border-emerald-500/20 hover:border-emerald-400',
        rose: 'bg-rose-900/20 border-rose-500/20 hover:border-rose-400',
        amber: 'bg-amber-900/20 border-amber-500/20 hover:border-amber-400'
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            
            {/* HEADER AREA */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Second Brain</h1>
                    <p className="text-sm text-slate-400">Gudang ide, referensi, dan catatan terhubung.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-rounded">search</span>
                        <input 
                            type="text" 
                            placeholder="Cari catatan..." 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="btn-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-rounded">add</span> <span className="hidden md:inline">Baru</span>
                    </button>
                </div>
            </div>

            {/* TAGS FILTER SCROLL */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedTag === tag 
                            ? 'bg-blue-600 text-white border-blue-500' 
                            : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                        }`}
                    >
                        # {tag}
                    </button>
                ))}
            </div>

            {/* GRID NOTES */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
                {sortedNotes.map(n => {
                    const linkedProject = projects.find(p => p.id === n.projectId);
                    
                    return (
                        <div key={n.id} className={`break-inside-avoid card-enhanced p-5 rounded-2xl border transition-all relative group flex flex-col ${colorMap[n.color] || colorMap.slate}`}>
                            
                            {/* Header Note */}
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-white text-lg leading-tight">{n.title}</h4>
                                <div className="flex gap-1 -mr-2 -mt-1">
                                    <button onClick={() => togglePin(n)} className={`p-1.5 rounded-lg transition-colors ${n.isPinned ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-slate-600 hover:text-white hover:bg-slate-700'}`}>
                                        <span className="material-symbols-rounded text-lg filled-icon">{n.isPinned ? 'push_pin' : 'keep'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tags & Project Link */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {linkedProject && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        <span className="material-symbols-rounded text-[12px]">folder</span> {linkedProject.name}
                                    </span>
                                )}
                                {n.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-950/30 px-2 py-0.5 rounded border border-white/5">#{tag}</span>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans mb-4">
                                {n.content}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : 'Draft'}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => copyContent(n.content)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-all" title="Copy">
                                        <span className="material-symbols-rounded text-sm">content_copy</span>
                                    </button>
                                    <button onClick={() => handleDelete(n.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Hapus">
                                        <span className="material-symbols-rounded text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {sortedNotes.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <span className="material-symbols-rounded text-6xl text-slate-700 mb-4">psychology</span>
                    <p className="text-slate-500">Belum ada catatan yang cocok.</p>
                </div>
            )}

            {/* MODAL TAMBAH NOTE */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-enter">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scroll">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                        
                        <h3 className="text-xl font-bold text-white mb-6">Catatan Baru</h3>

                        <form onSubmit={handleSave} className="flex flex-col gap-5">
                            {/* Judul & Pin */}
                            <div className="flex gap-3">
                                <input 
                                    className="bg-transparent text-xl font-bold text-white placeholder-slate-600 focus:outline-none w-full border-b border-transparent focus:border-slate-700 pb-2 transition-all"
                                    placeholder="Judul Catatan..."
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    autoFocus
                                />
                                <button 
                                    type="button"
                                    onClick={() => setFormData(p => ({...p, isPinned: !p.isPinned}))}
                                    className={`p-2 rounded-xl border ${formData.isPinned ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-500 hover:text-white'}`}
                                >
                                    <span className="material-symbols-rounded text-xl filled-icon">push_pin</span>
                                </button>
                            </div>

                            {/* Content Area */}
                            <textarea 
                                rows="8" 
                                placeholder="Tulis ide liarmu di sini..." 
                                className="w-full bg-slate-950/30 text-white p-4 rounded-xl border border-slate-700/50 text-sm leading-relaxed resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                                value={formData.content} 
                                onChange={e => setFormData({...formData, content: e.target.value})}
                            ></textarea>

                            {/* Metadata Inputs (Grid) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Tags (Pisahkan Koma)"
                                    icon="tag"
                                    placeholder="ide, kerja, penting..."
                                    value={formData.tags}
                                    onChange={e => setFormData({...formData, tags: e.target.value})}
                                />
                                
                                <Select 
                                    label="Link ke Project"
                                    icon="folder"
                                    value={formData.projectId} 
                                    onChange={e => setFormData({...formData, projectId: e.target.value})}
                                >
                                    <option value="">-- Tidak Ada --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </Select>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Warna Kartu</label>
                                <div className="flex gap-3">
                                    {Object.keys(colorMap).map(c => (
                                        <button 
                                            key={c} type="button" 
                                            onClick={() => setFormData({...formData, color: c})}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                c === 'slate' ? 'bg-slate-600' : 
                                                c === 'blue' ? 'bg-blue-600' : 
                                                c === 'green' ? 'bg-emerald-600' : 
                                                c === 'rose' ? 'bg-rose-600' : 'bg-amber-500'
                                            } ${formData.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-rounded">save</span> Simpan Catatan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}