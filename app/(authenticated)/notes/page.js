'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { NoteService } from '@/services/noteService';
import { ProjectService } from '@/services/projectService';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown'; // [NEW] Markdown Renderer
import remarkGfm from 'remark-gfm';         // [NEW] Support Table, Strikethrough, dll

// Import UI Premium
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal'; // Pastikan Modal sudah direfactor sebelumnya

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
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editorMode, setEditorMode] = useState('write'); // [NEW] 'write' | 'preview'
    const [formData, setFormData] = useState({ 
        title: '', content: '', tags: '', color: 'slate', projectId: '', isPinned: false 
    });

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        const unsubNotes = NoteService.subscribeNotes(user.uid, setNotes);
        const unsubProjects = ProjectService.subscribeProjects(user.uid, setProjects);
        return () => { unsubNotes(); unsubProjects(); };
    }, [user]);

    // 2. Logic Filter & Tags
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
        }).sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1)); 
    }, [notes, searchQuery, selectedTag]);

    // 3. Actions
    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error("Judul wajib diisi");
        
        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            const dataToSave = { ...formData, tags: tagsArray };
            delete dataToSave.id; 

            if (editingNoteId) {
                await NoteService.updateNote(user.uid, editingNoteId, dataToSave);
                toast.success("Catatan diperbarui!");
            } else {
                await NoteService.addNote(user.uid, dataToSave);
                toast.success("Ide tersimpan!", { icon: '🧠' });
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
            tags: note.tags?.join(', ') || '',
        });
        setEditorMode('write'); // Reset mode ke write saat buka
        setShowModal(true);
    };

    const closeAndResetModal = () => {
        setShowModal(false);
        setEditingNoteId(null);
        setEditorMode('write');
        setFormData({ title: '', content: '', tags: '', color: 'slate', projectId: '', isPinned: false });
    };

    const colorMap = {
        slate: 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500',
        blue: 'bg-blue-900/10 border-blue-500/20 hover:border-blue-400/50',
        green: 'bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-400/50',
        rose: 'bg-rose-900/10 border-rose-500/20 hover:border-rose-400/50',
        amber: 'bg-amber-900/10 border-amber-500/20 hover:border-amber-400/50'
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 animate-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Second Brain</h1>
                    <p className="text-sm text-slate-400">Gudang ide, referensi, dan catatan terhubung.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <Link href="/second-brain-chat" className="px-4 py-2.5 rounded-xl font-bold text-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-purple-900/10">
                        <span className="material-symbols-rounded">smart_toy</span> <span className="hidden md:inline">Tanya AI</span>
                    </Link>

                    <div className="relative flex-1 md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-rounded">search</span>
                        <input 
                            type="text" 
                            placeholder="Cari ide..." 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-all placeholder-slate-600"
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
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedTag === tag 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/20' 
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
                        <div key={n.id} className={`break-inside-avoid glass-card p-6 rounded-2xl border transition-all relative group flex flex-col ${colorMap[n.color] || colorMap.slate}`}>
                            
                            {/* Pin */}
                            {n.isPinned && (
                                <div className="absolute -top-2 -left-2 bg-amber-500 text-slate-900 p-1 rounded-full shadow-lg z-20">
                                    <span className="material-symbols-rounded text-sm filled-icon block">keep</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => togglePin(n)} className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${n.isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-950/50 text-slate-400 hover:text-white'}`}>
                                    <span className="material-symbols-rounded text-lg filled-icon">{n.isPinned ? 'push_pin' : 'keep'}</span>
                                </button>
                                <button onClick={() => openEditModal(n)} className="p-1.5 rounded-lg bg-slate-950/50 text-slate-400 hover:text-blue-400 backdrop-blur-md transition-colors">
                                    <span className="material-symbols-rounded text-lg">edit</span>
                                </button>
                            </div>

                            <h4 className="font-bold text-white text-lg leading-snug mb-3 pr-8 tracking-tight">{n.title}</h4>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {linkedProject && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        <span className="material-symbols-rounded text-[12px]">folder</span> {linkedProject.name}
                                    </span>
                                )}
                                {n.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-950/30 px-2 py-0.5 rounded-md border border-white/5">#{tag}</span>
                                ))}
                            </div>

                            {/* Markdown Content (Preview Mode in Card) */}
                            <div className="prose prose-invert prose-sm max-w-none text-slate-300 line-clamp-[12] opacity-90 text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {n.content}
                                </ReactMarkdown>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                <span>{n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : 'Draft'}</span>
                                <button onClick={() => handleDelete(n.id)} className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity flex items-center gap-1">
                                    <span className="material-symbols-rounded text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 opacity-60 border-2 border-dashed border-slate-800 rounded-3xl mt-8">
                    <span className="material-symbols-rounded text-4xl text-slate-600 mb-4">psychology</span>
                    <p className="text-slate-500 font-medium">Belum ada catatan.</p>
                    <button onClick={() => setShowModal(true)} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold">
                        + Buat Catatan Pertama
                    </button>
                </div>
            )}

            {/* --- MODAL EDITOR --- */}
            <Modal isOpen={showModal} onClose={closeAndResetModal}>
                <div className="flex flex-col h-[85vh] md:h-[90vh]">
                    
                    {/* Header with Tabs */}
                    <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-900 shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setEditorMode('write')}
                                className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-all ${editorMode === 'write' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Tulis
                            </button>
                            <button 
                                onClick={() => setEditorMode('preview')}
                                className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-all ${editorMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Preview
                            </button>
                        </div>
                        <button onClick={closeAndResetModal} className="text-slate-500 hover:text-white transition-colors">
                            <span className="material-symbols-rounded text-xl">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
                        <div className="flex flex-col gap-6 p-6 overflow-y-auto custom-scroll flex-1">
                            
                            {/* Title (Always Visible) */}
                            <input 
                                className="bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none w-full border-b border-transparent focus:border-slate-700 pb-2 transition-all"
                                placeholder="Judul Catatan..."
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                autoFocus
                            />
                            
                            {/* EDITOR AREA */}
                            {editorMode === 'write' ? (
                                <textarea 
                                    placeholder="Tulis ide di sini (Markdown supported)... # Heading, **Bold**, - List" 
                                    className="w-full bg-slate-950/50 text-white p-5 rounded-2xl border border-slate-800 text-base leading-relaxed resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all flex-1 font-mono"
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                ></textarea>
                            ) : (
                                <div className="w-full bg-slate-950/30 text-white p-5 rounded-2xl border border-slate-800/50 flex-1 overflow-y-auto custom-scroll">
                                    {formData.content ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {formData.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 italic">Belum ada konten untuk ditampilkan.</p>
                                    )}
                                </div>
                            )}

                            {/* Meta Inputs (Collapsible or Bottom) */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input 
                                        label="Tags" icon="tag" placeholder="ide, kerja..." 
                                        value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})}
                                    />
                                    <Select 
                                        label="Project" icon="folder" 
                                        value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}
                                    >
                                        <option value="">-- Tidak Ada --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Select>
                                </div>

                                {/* Color Picker */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Warna:</span>
                                    <div className="flex gap-2">
                                        {Object.keys(colorMap).map(c => (
                                            <button 
                                                key={c} type="button" 
                                                onClick={() => setFormData({...formData, color: c})}
                                                className={`w-6 h-6 rounded-full border transition-all ${
                                                    c === 'slate' ? 'bg-slate-600' : 
                                                    c === 'blue' ? 'bg-blue-600' : 
                                                    c === 'green' ? 'bg-emerald-600' : 
                                                    c === 'rose' ? 'bg-rose-600' : 'bg-amber-500'
                                                } ${formData.color === c ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/5 bg-slate-900 flex justify-end gap-3 shrink-0">
                            <button type="button" onClick={closeAndResetModal} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                                Batal
                            </button>
                            <button type="submit" className="btn-primary px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2">
                                <span className="material-symbols-rounded">save</span> Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}