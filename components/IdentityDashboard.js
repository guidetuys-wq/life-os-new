'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IdentityService } from '@/services/identityService';
import { LogService } from '@/services/logService'; // Reuse LogService
import { addItem } from '@/lib/db'; // Direct add untuk log
import toast from 'react-hot-toast';

export default function IdentityDashboard() {
    const { user } = useAuth();
    
    // States
    const [data, setData] = useState(null);
    const [logs, setLogs] = useState([]);
    const [newLog, setNewLog] = useState('');

    // Fetch Data
    useEffect(() => {
        if (!user) return;

        // 1. Identity Data
        const unsubIdentity = IdentityService.subscribeIdentity(user.uid, setData);
        
        // 2. Memory Logs (Filter tipe MEMORY_LOG nanti di query atau terima semua log)
        // Kita pakai subscribeLogs biasa, nanti bisa difilter atau digabung
        const unsubLogs = LogService.subscribeLogs(user.uid, 10, setLogs);

        return () => { unsubIdentity(); unsubLogs(); };
    }, [user]);

    // Handlers (Auto-Save on Change)
    const handleUpdate = (field, value) => {
        // Update local state agar responsif
        setData(prev => ({ ...prev, [field]: value }));
        // Update DB
        IdentityService.updateIdentity(user.uid, { [field]: value });
    };

    const handleNestedUpdate = (parent, key, value) => {
        const newData = { ...data[parent], [key]: value };
        setData(prev => ({ ...prev, [parent]: newData }));
        IdentityService.updateIdentity(user.uid, { [parent]: newData });
    };

    const handleAddLog = async () => {
        if (!newLog.trim()) return;
        try {
            await addItem(user.uid, 'logs', {
                message: newLog,
                type: 'MEMORY_LOG', // Tipe khusus
                createdAt: new Date()
            });
            setNewLog('');
            toast.success("Jejak tersimpan", { icon: 'asd' });
        } catch (e) {
            toast.error("Gagal simpan log");
        }
    };

    if (!data) return <div className="p-10 text-center animate-pulse text-slate-500">Memuat Identitas...</div>;

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-10 text-slate-200">
            
            {/* 1. HEADER (Identity & Anchor) */}
            <header className="text-center space-y-4 animate-enter">
                <h1 className="text-4xl font-bold text-amber-400 tracking-tight font-serif">MarkASP</h1>
                <div className="flex flex-col gap-2">
                    {/* Read-only di sini, edit di Settings agar fokus */}
                    <p className="text-xl font-medium text-slate-100 leading-relaxed font-serif">
                        {data.statement}
                    </p>
                    <p className="text-sm text-amber-400/80 italic">
                        "{data.anchor}"
                    </p>
                </div>
            </header>

            <hr className="border-white/10 w-1/2 mx-auto" />

            {/* 2. FOKUS UTAMA (Manual Input seperti HTML lama) */}
            <section className="space-y-4 animate-enter stagger-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 block text-center font-bold">Fokus Utama Saat Ini</span>
                <div className="flex flex-col gap-3">
                    {['f1', 'f2', 'f3'].map((key, idx) => (
                        <input 
                            key={key}
                            type="text"
                            value={data.focus?.[key] || ''}
                            onChange={(e) => handleNestedUpdate('focus', key, e.target.value)}
                            placeholder={`Fokus ${idx + 1}`}
                            className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-amber-400/50 text-center text-lg font-medium text-slate-200 rounded-xl py-3 px-4 transition-all outline-none placeholder-slate-700"
                        />
                    ))}
                </div>
            </section>

            {/* 3. NEXT ACTION (Big Input) */}
            <section className="animate-enter stagger-2">
                <div className="relative bg-gradient-to-br from-slate-900 to-black p-8 rounded-3xl border border-white/10 shadow-2xl group">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 block">Next Action</span>
                    <input 
                        type="text" 
                        value={data.nextAction || ''}
                        onChange={(e) => handleUpdate('nextAction', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-amber-400/30 focus:border-amber-400 text-2xl text-white py-2 mb-4 outline-none transition-all placeholder-slate-700 font-serif"
                        placeholder="Satu hal konkret..."
                    />
                    <p className="text-center text-[10px] text-slate-500">Kalau bingung: kerjakan ini dulu.</p>
                </div>
            </section>

            {/* 4. MEMORY LOG */}
            <section className="space-y-4 animate-enter stagger-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 block text-center font-bold">Memory Log (Jejak Hidup)</span>
                
                <div className="flex gap-2">
                    <textarea 
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        rows="1"
                        placeholder="Apa yang barusan terjadi?"
                        className="w-full bg-slate-900/50 border border-slate-700/50 focus:border-slate-500 rounded-xl p-3 text-slate-300 text-sm outline-none resize-none transition-all"
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddLog(); } }}
                    />
                    <button onClick={handleAddLog} className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 transition-colors">
                        <span className="material-symbols-rounded">send</span>
                    </button>
                </div>

                {/* Log List */}
                <div className="flex flex-col gap-3">
                    {logs.filter(l => l.type === 'MEMORY_LOG').map(log => (
                        <div key={log.id} className="p-4 bg-white/5 border-l-2 border-amber-400/50 rounded-r-xl hover:bg-white/10 transition-colors">
                            <span className="block text-[10px] text-slate-500 mb-1 font-mono">
                                {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString('id-ID') : 'Baru saja'}
                            </span>
                            <p className="text-sm text-slate-300 leading-relaxed">{log.message}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. SNAPSHOT REFLECTION */}
            <section className="space-y-6 animate-enter stagger-3 pb-12">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 block text-center font-bold">Progress Snapshot</span>
                <div className="grid gap-4">
                    <SnapshotItem label="Apa yang berjalan baik?" value={data.snapshot?.good} onChange={(v) => handleNestedUpdate('snapshot', 'good', v)} />
                    <SnapshotItem label="Apa yang perlu diperbaiki?" value={data.snapshot?.fix} onChange={(v) => handleNestedUpdate('snapshot', 'fix', v)} />
                    <SnapshotItem label="Apa yang perlu ditinggalkan?" value={data.snapshot?.leave} onChange={(v) => handleNestedUpdate('snapshot', 'leave', v)} />
                </div>
            </section>

        </div>
    );
}

// Sub-component untuk Snapshot agar rapi
function SnapshotItem({ label, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-sm text-amber-400/80 font-serif italic ml-1">{label}</label>
            <textarea 
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows="2" 
                className="w-full bg-slate-900/30 border-l-2 border-slate-700 focus:border-amber-400 p-3 text-slate-300 text-sm outline-none transition-all rounded-r-lg resize-none" 
            />
        </div>
    );
}