'use client';
import Link from 'next/link';
import { IdentityService } from '@/services/identityService';

export default function IdentityCard({ user, identityData, setIdentityData, projectCandidates, activeProjects }) {
    
    const handleIdentityUpdate = (field, value) => {
        setIdentityData(prev => ({ ...prev, [field]: value }));
        IdentityService.updateIdentity(user.uid, { [field]: value });
    };

    const handleFocusUpdate = (slot, projectId) => {
        const newFocus = { ...identityData.focus, [slot]: projectId };
        setIdentityData(prev => ({ ...prev, focus: newFocus }));
        IdentityService.updateIdentity(user.uid, { focus: newFocus });
    };

    // Helper: Auto-resize textarea
    const adjustHeight = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const getProjectById = (id) => projectCandidates?.find(p => p.id === id);

    return (
        // [FIX] Hapus 'overflow-hidden' dari container utama agar konten tidak terpotong
        <div className="glass-card p-8 flex flex-col gap-8 text-center relative group border border-white/10 bg-slate-900/40 z-10 flex-shrink-0">
            
            {/* [FIX] Background Decoration dipindah ke layer terpisah dengan overflow-hidden */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none -z-10">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
            </div>

            {/* Identity Inputs */}
            <div className="relative z-20 flex flex-col gap-3">
                <textarea 
                    value={identityData.statement}
                    onChange={(e) => { handleIdentityUpdate('statement', e.target.value); adjustHeight(e); }}
                    onFocus={adjustHeight}
                    className="w-full bg-transparent text-center text-xl md:text-2xl font-bold text-white border-none outline-none resize-none placeholder-slate-600 focus:placeholder-slate-500 transition-all leading-snug font-serif overflow-hidden"
                    rows="1"
                    placeholder="Siapa identitasmu?"
                    style={{ minHeight: '3rem' }}
                />
                <textarea 
                    value={identityData.anchor}
                    onChange={(e) => { handleIdentityUpdate('anchor', e.target.value); adjustHeight(e); }}
                    onFocus={adjustHeight}
                    className="w-full bg-transparent text-center text-sm md:text-base text-slate-400 italic border-none outline-none resize-none placeholder-slate-700 focus:text-slate-300 transition-all overflow-hidden"
                    rows="1"
                    placeholder="Apa prinsip utamamu?"
                    style={{ minHeight: '1.5rem' }}
                />
            </div>

            <div className="w-16 h-[1px] bg-slate-700 mx-auto opacity-50"></div>

            {/* Focus Grid */}
            <div className="relative z-20">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-4">Fokus Utama (Pilih Project)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['slot1', 'slot2', 'slot3'].map((slot, idx) => {
                        const selectedId = identityData.focus?.[slot] || '';
                        const project = getProjectById(selectedId);

                        return (
                            <div key={slot} className="relative group/slot h-full min-h-[80px]">
                                {project ? (
                                    <Link href="/projects" className="bg-slate-900/60 hover:bg-slate-800 border border-blue-500/30 p-4 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer h-full relative shadow-sm hover:shadow-md">
                                        <span className="text-[10px] font-mono text-blue-400/70 mb-1">0{idx + 1}</span>
                                        <span className="text-sm font-bold text-slate-200 truncate w-full text-center leading-tight">
                                            {project.name}
                                        </span>
                                        
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFocusUpdate(slot, ''); }}
                                            className="absolute top-1 right-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover/slot:opacity-100 transition-opacity p-1"
                                            title="Lepas Fokus"
                                        >
                                            <span className="material-symbols-rounded text-base">close</span>
                                        </button>
                                    </Link>
                                ) : (
                                    <div className="bg-slate-900/30 border border-dashed border-slate-700 hover:border-slate-500 p-2 rounded-xl flex flex-col items-center justify-center transition-all h-full relative">
                                        <div className="flex flex-col items-center justify-center pointer-events-none">
                                            <span className="material-symbols-rounded text-slate-600 mb-1 text-lg">add</span>
                                            <span className="text-[10px] text-slate-500">Pilih Fokus {idx+1}</span>
                                        </div>
                                        <select 
                                            value=""
                                            onChange={(e) => handleFocusUpdate(slot, e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            title="Pilih Project"
                                        >
                                            <option value="">Pilih Project...</option>
                                            {projectCandidates && projectCandidates.length > 0 ? (
                                                projectCandidates.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))
                                            ) : (
                                                <option disabled>Belum ada project aktif</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}