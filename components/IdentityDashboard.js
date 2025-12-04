'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IdentityService } from '@/services/identityService';
import { AiService } from '@/services/aiService'; // [NEW] Integrasi AI Jurnal
import toast from 'react-hot-toast';

// Helper: Debounce untuk Auto-save
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export default function IdentityDashboard() {
    const { user } = useAuth();
    
    // Local State untuk input
    const [snapshot, setSnapshot] = useState({ good: '', fix: '', leave: '' });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false); // [NEW] Loading state AI

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        const unsub = IdentityService.subscribeIdentity(user.uid, (data) => {
            // Load data awal hanya sekali agar tidak menimpa ketikan user
            if (!isLoaded) {
                setSnapshot({
                    good: data.snapshot?.good || '',
                    fix: data.snapshot?.fix || '',
                    leave: data.snapshot?.leave || ''
                });
                setIsLoaded(true);
            }
        });
        return () => unsub();
    }, [user, isLoaded]);

    // 2. Auto-Save Logic (Debounced)
    const debouncedSnapshot = useDebounce(snapshot, 1500);

    useEffect(() => {
        if (!user || !isLoaded) return;
        IdentityService.updateIdentity(user.uid, { snapshot: debouncedSnapshot });
    }, [debouncedSnapshot, user, isLoaded]);

    const handleChange = (field, value) => {
        setSnapshot(prev => ({ ...prev, [field]: value }));
    };

    // [NEW] Handler Auto Journal (The Scribe)
    const handleAutoJournal = async () => {
        if (!snapshot.good && !snapshot.fix) {
            if(!confirm("Refleksi masih kosong. AI hanya akan menggunakan data sistem (Log). Lanjut?")) return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("AI sedang merangkai jurnal hari ini...");
        
        try {
            const result = await AiService.createDailyJournal(user.uid, snapshot);
            toast.success(result, { id: toastId, icon: '✍️' });
        } catch (error) {
            toast.error("Gagal menulis jurnal", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        // [FIX] p-4 md:p-6
        <div className="glass-card p-4 md:p-6 border border-white/5 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -z-10 group-hover:bg-purple-500/10 transition-all duration-1000"></div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-900/20">
                        <span className="material-symbols-rounded text-xl">self_improvement</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Snapshot Reflection</h3>
                        <p className="text-xs text-slate-400">Evaluasi harian & Auto-Journal.</p>
                    </div>
                </div>

                {/* [NEW] AI Journal Button */}
                <button 
                    onClick={handleAutoJournal}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-[10px] font-bold transition-all border border-slate-700 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Tulis Jurnal Otomatis dari Data Hari Ini"
                >
                    {isGenerating ? (
                        <span className="material-symbols-rounded text-sm animate-spin">sync</span>
                    ) : (
                        <span className="material-symbols-rounded text-sm">auto_awesome</span>
                    )}
                    <span className="hidden sm:inline">{isGenerating ? 'Menulis...' : 'Wrap-up Day'}</span>
                </button>
            </div>

            <div className="space-y-5">
                <SnapshotItem 
                    label="Apa yang berjalan baik?" 
                    icon="thumb_up"
                    color="text-emerald-400"
                    placeholder="Kemenangan kecil..."
                    value={snapshot.good} 
                    onChange={(v) => handleChange('good', v)} 
                />
                <SnapshotItem 
                    label="Apa yang perlu diperbaiki?" 
                    icon="build"
                    color="text-amber-400"
                    placeholder="Distraksi..."
                    value={snapshot.fix} 
                    onChange={(v) => handleChange('fix', v)} 
                />
                <SnapshotItem 
                    label="Apa yang perlu ditinggalkan?" 
                    icon="delete_forever"
                    color="text-rose-400"
                    placeholder="Kebiasaan buruk..."
                    value={snapshot.leave} 
                    onChange={(v) => handleChange('leave', v)} 
                />
            </div>
        </div>
    );
}

// Sub-component agar rapi
function SnapshotItem({ label, icon, color, placeholder, value, onChange }) {
    return (
        <div className="space-y-2 group/item">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 group-hover/item:text-slate-300 transition-colors">
                <span className={`material-symbols-rounded text-sm ${color}`}>{icon}</span> {label}
            </label>
            <textarea 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows="2" 
                placeholder={placeholder}
                className="w-full bg-slate-950/30 text-white text-sm rounded-xl border border-slate-700/50 p-3 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none placeholder-slate-600"
            />
        </div>
    );
}