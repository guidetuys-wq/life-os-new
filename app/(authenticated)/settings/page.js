'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IdentityService } from '@/services/identityService'; // Gunakan Service
import { SettingService } from '@/services/settingService';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
    const { user } = useAuth();
    
    // Auth Profile
    const [profile, setProfile] = useState({ displayName: '', photoURL: '' });
    // Identity Data
    const [identity, setIdentity] = useState({ statement: '', anchor: '' });
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        setProfile({ displayName: user.displayName || '', photoURL: user.photoURL || '' });

        // Subscribe Identity untuk di-edit
        const unsub = IdentityService.subscribeIdentity(user.uid, (data) => {
            setIdentity({
                statement: data.statement || '',
                anchor: data.anchor || ''
            });
        });
        return () => unsub();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await SettingService.updateProfile(profile.displayName, profile.photoURL);
            await IdentityService.updateProfileSettings(user.uid, identity);
            
            toast.success("Pengaturan tersimpan!");
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error("Gagal menyimpan");
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32 animate-enter">
            <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
            
            <div className="glass-card p-6 md:p-8 border border-white/10">
                <form onSubmit={handleSave} className="flex flex-col gap-6">
                    
                    {/* Identity Settings */}
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
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Anchor (Prinsip)</label>
                            <input 
                                value={identity.anchor}
                                onChange={e => setIdentity({...identity, anchor: e.target.value})}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-400 focus:outline-none transition-all placeholder-slate-600"
                            />
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="space-y-4 mt-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">Account</h3>
                        <Input 
                            label="Nama Tampilan" icon="person" 
                            value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})}
                        />
                        <Input 
                            label="Foto URL" icon="image" 
                            value={profile.photoURL} onChange={e => setProfile({...profile, photoURL: e.target.value})}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 rounded-xl font-bold mt-4">
                        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
}