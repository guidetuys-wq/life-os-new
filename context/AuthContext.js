// context/AuthContext.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
                router.push('/'); // Redirect to login if not authenticated
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    // [FIX] Tampilkan Loading Screen alih-alih null/kosong
    if (loading) {
        return (
            <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 animate-spin shadow-[0_0_20px_rgba(37,99,235,0.5)]"></div>
                <p className="text-slate-500 text-sm font-mono animate-pulse">Initializing Life OS...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};