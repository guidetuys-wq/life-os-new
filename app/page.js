// app/page.js
'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        // [TAMBAH] Loading toast
        const toastId = toast.loading('Memproses...');
        
        try {
            await login(email, password);
            toast.dismiss(toastId);
            toast.success("Login Berhasil!");
            router.push('/dashboard'); 
        } catch (error) {
            toast.dismiss(toastId);
            // [FIX] Ganti alert dengan toast error
            let msg = "Login Gagal.";
            if(error.code === 'auth/invalid-credential') msg = "Email atau password salah.";
            if(error.code === 'auth/too-many-requests') msg = "Terlalu banyak percobaan. Coba lagi nanti.";
            
            toast.error(msg);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-3xl text-center max-w-md w-full">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="font-bold text-2xl text-white">S</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Singgih Life OS</h1>
                
                <form onSubmit={handleLogin} className="space-y-3 mt-8 text-left">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Email</label>
                        <input 
                            type="email"
                            name="email" // [FIX] Tambah name
                            autoComplete="email" // [FIX] Tambah autocomplete
                            className="input-enhanced w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Password</label>
                        <input 
                            type="password"
                            name="password" // [FIX] Tambah name
                            autoComplete="current-password" // [FIX] Tambah autocomplete
                            className="input-enhanced w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4">
                        Masuk
                    </button>
                </form>
            </div>
        </div>
    );
}