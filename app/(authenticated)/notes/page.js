'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { NoteService } from '@/services/noteService';       // [NEW]
import { ProjectService } from '@/services/projectService'; // [NEW] Reuse Project Service
import toast from 'react-hot-toast';

// Import UI Premium
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function NotesPage() {
    const { user } = useAuth();
    
    // Data States
    const [notes, setNotes] = useState([]);
    const [projects, setProjects] = useState([]); // Untuk dropdown
    
    // UI/Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [formData, setFormData] = useState({ 
        title: '', content: '', tags: '', color: 'slate', projectId: '', isPinned: false 
    });

    // 1. Fetch Data (Centralized)
    useEffect(() => {
        if (!user) return;
        
        // Subscribe Notes
        const unsubNotes = NoteService.subscribeNotes(user.uid, setNotes);
        
        // Subscribe Projects (untuk Dropdown Link)
        // Kita gunakan service yang sama agar konsisten
        const unsubProjects = ProjectService.subscribeProjects(user.uid, setProjects);

        return () => { unsubNotes(); unsubProjects(); };
    }, [user]);

    // 2. Logic Filter (Memoized untuk performa)
    const allTags = useMemo(() => {
        const tags = new Set(['All']);
        notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [notes]);

    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            const matchesSearch = (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTag = selectedTag === 'All' || n.tags?.includes(selectedTag);
            return matchesSearch && matchesTag;
        }).sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1)); // Pinned first
    }, [notes, searchQuery, selectedTag]);

    // 3. Actions
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error("Judul wajib diisi");
        
        try {
            // Parse Tags (String -> Array)
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            const dataToSave = { ...formData, tags: tagsArray };
            
            // Hapus ID dari dataToSave agar tidak tertulis ke dokumen
            delete dataToSave.id; 

            if (editingNoteId) {
                await NoteService.updateNote(user.uid, editingNoteId, dataToSave);
                toast.success("Catatan diperbarui!");
            } else {
                await NoteService.addNote(user.uid, dataToSave);
                toast.success("Catatan tersimpan!", { icon: '🧠' });
            }
            closeAndResetModal();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan.");
        }
    };

    const handleDelete = (id) => {
        if(confirm('Pindahkan ke sampah?')) NoteService.deleteNote(user.uid, id);
    };

    const togglePin = (note) => {
        NoteService.togglePin(user.uid, note.id, note.isPinned);
    };

    // Helper Actions
    const openEditModal = (note) => {
        setEditingNoteId(note.id);
        setFormData({
            ...note,
            tags: note.tags?.join(', ') || '', // Array -> String untuk input
        });
        setShowModal(true);
    };

    const closeAndResetModal = () => {
        setShowModal(false);
        setEditingNoteId(null);
        setFormData({ title: '', content: '', tags: '', color: 'slate', projectId: '', isPinned: false });
    };

    const colorMap = {
        slate: 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500',
        blue: 'bg-blue-900/20 border-blue-500/20 hover:border-blue-400',
        green: 'bg-emerald-900/20 border-emerald-500/20 hover:border-emerald-400',
        rose: 'bg-rose-900/20 border-rose-500/20 hover:border-rose-400',
        amber: 'bg-amber-900/20 border-amber-500/20 hover:border-amber-400'
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Second Brain</h1>
                    <p className="text-sm text-slate-400">Gudang ide, referensi, dan catatan terhubung.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <Link href="/second-brain-chat" className="btn-secondary px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg border-slate-700 hover:text-blue-400 hover:bg-blue-500/10 flex items-center gap-2 whitespace-nowrap">
                        <span className="material-symbols-rounded">forum</span> Chat AI
                    </Link>

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
                        onClick={() => { closeAndResetModal(); setShowModal(true); }}
                        className="btn-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-rounded">add</span> <span className="hidden md:inline">Baru</span>
                    </button>
                </div>
            </div>

            {/* Tags Filter */}
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

            {/* Grid Notes */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
                {filteredNotes.map(n => {
                    const linkedProject = projects.find(p => p.id === n.projectId);
                    
                    return (
                        <div key={n.id} className={`break-inside-avoid card-enhanced p-5 rounded-2xl border transition-all relative group flex flex-col ${colorMap[n.color] || colorMap.slate}`}>
                            {/* Actions Overlay (Hover) */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => togglePin(n)} className={`p-1.5 rounded-lg backdrop-blur-md ${n.isPinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-950/50 text-slate-400 hover:text-white'}`}>
                                    <span className="material-symbols-rounded text-lg filled-icon">{n.isPinned ? 'push_pin' : 'keep'}</span>
                                </button>
                                <button onClick={() => openEditModal(n)} className="p-1.5 rounded-lg bg-slate-950/50 text-slate-400 hover:text-blue-400 backdrop-blur-md">
                                    <span className="material-symbols-rounded text-lg">edit</span>
                                </button>
                            </div>

                            <h4 className="font-bold text-white text-lg leading-tight mb-3 pr-10">{n.title}</h4>

                            {/* Metadata Badges */}
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

                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans mb-4 line-clamp-[10]">
                                {n.content}
                            </div>

                            <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                <span>{n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : 'Draft'}</span>
                                <button onClick={() => handleDelete(n.id)} className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredNotes.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <span className="material-symbols-rounded text-6xl text-slate-700 mb-4">psychology</span>
                    <p className="text-slate-500">Belum ada catatan.</p>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-enter">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl max-h-[90vh] flex flex-col">
                        <button onClick={closeAndResetModal} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                        
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingNoteId ? "Edit Catatan" : "Catatan Baru"}
                        </h3>

                        <form onSubmit={handleSave} className="flex flex-col gap-4 flex-1 min-h-0">
                            <div className="flex flex-col gap-4 overflow-y-auto custom-scroll pr-2 flex-1">
                                <input 
                                    className="bg-transparent text-xl font-bold text-white placeholder-slate-600 focus:outline-none w-full border-b border-transparent focus:border-slate-700 pb-2 transition-all"
                                    placeholder="Judul Catatan..."
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    autoFocus
                                />
                                
                                <textarea 
                                    placeholder="Tulis ide liarmu di sini..." 
                                    className="w-full bg-slate-950/30 text-white p-4 rounded-xl border border-slate-700/50 text-sm leading-relaxed resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all min-h-[200px]"
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                ></textarea>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input 
                                        label="Tags (Pisahkan koma)" icon="tag" placeholder="ide, kerja..." 
                                        value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                                    />
                                    <Select 
                                        label="Link Project" icon="folder" 
                                        value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}
                                    >
                                        <option value="">-- Tidak Ada --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Select>
                                </div>

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
                            </div>

                            <button type="submit" className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-rounded">save</span> Simpan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}