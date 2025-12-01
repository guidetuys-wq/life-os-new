'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateFirebaseProfile, getAccumulatedStats } from '@/lib/user'; // Service baru
import toast from 'react-hot-toast';

// Import UI Premium
import Input from '@/components/ui/Input';

export default function SettingsPage() {
    const { user } = useAuth();
    const [profileForm, setProfileForm] = useState({
        displayName: '',
        photoURL: '',
    });
    const [stats, setStats] = useState({ 
        xp: 0, 
        level: 1, 
        totalTasks: 0, 
        totalSessions: 0 
    });
    const [isSaving, setIsSaving] = useState(false);

    // Load Data Awal & Stats
    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
            });
            
            // Ambil statistik akumulatif
            getAccumulatedStats(user.uid).then(setStats);
        }
    }, [user]);

    // Handle Update Profile
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateFirebaseProfile(profileForm.displayName, profileForm.photoURL);
            toast.success("Profil berhasil diupdate!");
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Gagal update profil: " + error.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32 animate-enter">
            <h1 className="text-2xl font-bold text-white mb-6">Profile & Settings</h1>
            
            {/* 1. PERSONALISASI FORM */}
            <div className="glass-card p-6 md:p-8 mb-8">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700/50 pb-3">Personalisasi Akun</h3>
                
                <form onSubmit={handleProfileUpdate} className="flex flex-col gap-5">
                    
                    {/* Display Photo */}
                    <div className="flex items-center gap-6">
                        <img 
                            src={profileForm.photoURL || `https://ui-avatars.com/api/?name=${profileForm.displayName || 'User'}&background=1e293b&color=fff`}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover border-4 border-white/10 shadow-lg"
                        />
                        <p className="text-sm text-slate-400">Ganti foto dengan memasukkan URL di bawah.</p>
                    </div>

                    <Input 
                        label="Display Name"
                        icon="person"
                        placeholder="Nama Lengkap"
                        value={profileForm.displayName}
                        onChange={e => setProfileForm({...profileForm, displayName: e.target.value})}
                    />
                    
                    <Input 
                        label="Photo URL"
                        icon="image"
                        placeholder="URL Foto (Opsional)"
                        value={profileForm.photoURL}
                        onChange={e => setProfileForm({...profileForm, photoURL: e.target.value})}
                    />

                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <span className="animate-spin material-symbols-rounded">sync</span>
                        ) : (
                            <span className="material-symbols-rounded">save</span>
                        )}
                        Simpan Perubahan
                    </button>
                </form>
            </div>
            
            {/* 2. STATISTIK GAMIFICATION */}
            <div className="glass-card p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700/50 pb-3">Statistik Life OS</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    
                    {/* Level */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-purple-400 font-bold uppercase mb-1 tracking-widest">Level</p>
                        <span className="text-3xl font-mono font-bold text-white">{stats.level}</span>
                    </div>

                    {/* XP Total */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-widest">XP Total</p>
                        <span className="text-xl font-mono font-bold text-white">{stats.xp}</span>
                    </div>

                    {/* Tasks Selesai */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-1 tracking-widest">Tasks Selesai</p>
                        <span className="text-xl font-mono font-bold text-white">{stats.totalTasks}</span>
                    </div>

                    {/* Sesi Fokus */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1 tracking-widest">Sesi Fokus</p>
                        <span className="text-xl font-mono font-bold text-white">{stats.totalSessions}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}