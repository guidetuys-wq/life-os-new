// app/page.js
'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input'; // Gunakan komponen UI yang konsisten

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    
    // State management yang lebih bersih
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error("Mohon lengkapi data.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Authenticating...');
        
        try {
            await login(formData.email, formData.password);
            toast.success("Welcome back!", { id: toastId });
            router.push('/dashboard'); 
        } catch (error) {
            toast.dismiss(toastId);
            const msg = mapAuthError(error.code);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Error Mapping (Bisa dipindah ke utils jika banyak dipakai)
    const mapAuthError = (code) => {
        switch(code) {
            case 'auth/invalid-credential': return "Email atau password salah.";
            case 'auth/user-not-found': return "Akun tidak ditemukan.";
            case 'auth/wrong-password': return "Password salah.";
            case 'auth/too-many-requests': return "Terlalu banyak percobaan. Tunggu sebentar.";
            default: return "Login gagal. Coba lagi nanti.";
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            
            <div className="glass-card p-8 rounded-3xl text-center max-w-md w-full relative z-10 border border-white/5 shadow-2xl">
                {/* Logo Area */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                    <span className="font-mono font-bold text-3xl text-white">S</span>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2">Singgih Life OS</h1>
                <p className="text-slate-400 text-sm mb-8">Personal Control & Clarity System</p>
                
                <form onSubmit={handleLogin} className="flex flex-col gap-5 text-left">
                    <Input
                        label="Email Address"
                        icon="mail"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={isLoading}
                    />
                    
                    <Input
                        label="Password"
                        icon="lock"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        rightIcon={showPassword ? "visibility_off" : "visibility"}
                        onRightIconClick={() => setShowPassword(!showPassword)}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        disabled={isLoading}
                    />

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="btn-primary w-full py-3.5 rounded-xl font-bold mt-4 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin material-symbols-rounded text-lg">sync</span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <span>Masuk System</span>
                                <span className="material-symbols-rounded text-lg">arrow_forward</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            <p className="absolute bottom-6 text-slate-600 text-xs font-mono">v3.8 • Secure Environment</p>
        </div>
    );
}