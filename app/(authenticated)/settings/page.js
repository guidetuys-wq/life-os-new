'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IdentityService } from '@/services/identityService';
import { SettingService } from '@/services/settingService';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
    const { user } = useAuth();
    
    // Tabs State
    const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'account' | 'system'

    // Auth Profile
    const [profile, setProfile] = useState({ displayName: '', photoURL: '' });
    const [previewImage, setPreviewImage] = useState('');

    // Identity Data
    const [identity, setIdentity] = useState({ statement: '', anchor: '', aiContext: '' });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        setProfile({ displayName: user.displayName || '', photoURL: user.photoURL || '' });
        setPreviewImage(user.photoURL || '');

        const unsub = IdentityService.subscribeIdentity(user.uid, (data) => {
            setIdentity({
                statement: data.statement || '',
                anchor: data.anchor || '',
                aiContext: data.aiContext || ''
            });
        });
        return () => unsub();
    }, [user]);

    // Handle Image Upload (Convert to Base64)
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { // Limit 500KB agar tidak memberatkan auth profile
                toast.error("Ukuran gambar maksimal 500KB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setProfile(prev => ({ ...prev, photoURL: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await SettingService.updateProfile(profile.displayName, profile.photoURL);
            await IdentityService.updateProfileSettings(user.uid, identity);
            
            toast.success("Pengaturan tersimpan!");
            // setTimeout(() => window.location.reload(), 1000); // Opsional jika avatar tidak langsung berubah
        } catch (error) {
            toast.error("Gagal menyimpan: " + error.message);
        }
        setIsLoading(false);
    };

    const handleResetDatabase = async () => {
        const confirmText = prompt("KETIK 'DELETE' untuk menghapus SEMUA data. Akun akan kembali ke Level 1. Tindakan ini permanen!");
        
        if (confirmText === 'DELETE') {
            setIsResetting(true);
            try {
                await SettingService.resetAccount(user.uid);
                toast.success("Database bersih total!");
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error(error);
                toast.error("Gagal reset database");
                setIsResetting(false);
            }
        } else if (confirmText !== null) {
            toast.error("Konfirmasi salah. Batal.");
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32 animate-enter">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
            
            {/* TABS NAVIGATION */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                {['identity', 'account', 'system'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap border ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="glass-card p-6 md:p-8 border border-white/10">
                <form onSubmit={handleSave} className="flex flex-col gap-6">
                    
                    {/* TAB: IDENTITY */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest border-b border-amber-400/20 pb-2">
                                    Identity & Principles
                                </h3>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Identity Statement</label>
                                    <textarea 
                                        value={identity.statement}
                                        onChange={e => setIdentity({...identity, statement: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none transition-all placeholder-slate-600"
                                        rows="2"
                                        placeholder="Siapa dirimu?"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Anchor (Prinsip)</label>
                                    <input 
                                        value={identity.anchor}
                                        onChange={e => setIdentity({...identity, anchor: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-400 focus:outline-none transition-all placeholder-slate-600"
                                        placeholder="Prinsip utamamu..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-purple-400/20 pb-2 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-lg">psychology</span> AI Context
                                </h3>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tentang Saya (Untuk AI)</label>
                                    <p className="text-xs text-slate-500 mb-2 ml-1">
                                        Bantu AI memahami konteks hidupmu, tujuan, dan gaya komunikasi yang kamu suka.
                                    </p>
                                    <textarea 
                                        value={identity.aiContext}
                                        onChange={e => setIdentity({...identity, aiContext: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-purple-500/30 rounded-xl p-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-slate-600 leading-relaxed"
                                        rows="4"
                                        placeholder="Contoh: Saya seorang desainer grafis yang sering menunda pekerjaan. Saya butuh AI yang tegas tapi suportif. Tujuan saya tahun ini adalah membangun agensi sendiri."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ACCOUNT */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Profile</h3>
                            
                            {/* Image Upload UI */}
                            <div className="flex items-center gap-6">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                                        {previewImage ? (
                                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-rounded text-4xl text-slate-600">person</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-rounded text-white">edit</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors border border-slate-700"
                                    >
                                        Upload Foto
                                    </button>
                                    <p className="text-[10px] text-slate-500 mt-2">Max 500KB. Format JPG/PNG.</p>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            <Input 
                                label="Nama Tampilan" icon="person" 
                                value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})}
                            />
                        </div>
                    )}

                    {/* TAB: SYSTEM */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest border-b border-rose-500/20 pb-2 flex items-center gap-2">
                                <span className="material-symbols-rounded">warning</span> Danger Zone
                            </h3>
                            
                            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
                                <h4 className="text-white font-bold text-sm mb-2">Reset Database Total</h4>
                                <p className="text-xs text-rose-300/70 mb-4 leading-relaxed">
                                    Tindakan ini akan <strong>MENGHAPUS SELURUH DATA</strong> Anda secara permanen (Tasks, Projects, Notes, Finance, Habits, Logs, dll). 
                                    Akun Anda akan kembali bersih seperti saat pertama kali mendaftar.
                                </p>
                                <button 
                                    type="button"
                                    onClick={handleResetDatabase}
                                    disabled={isResetting}
                                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
                                >
                                    {isResetting ? <span className="animate-spin material-symbols-rounded">sync</span> : <span className="material-symbols-rounded">delete_forever</span>}
                                    {isResetting ? 'Mereset...' : 'Reset Semua Data'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Save Button (Hide on System Tab) */}
                    {activeTab !== 'system' && (
                        <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 rounded-xl font-bold mt-4 shadow-lg shadow-blue-600/20">
                            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}