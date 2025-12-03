'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TaskService } from '@/services/taskService';
import { getGreeting } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Header() {
    const { user } = useAuth();
    
    const [time, setTime] = useState('');
    const [greeting, setGreeting] = useState('Halo');
    const [weather, setWeather] = useState({ temp: '--', icon: '🌤️' });
    const [quickTask, setQuickTask] = useState('');

    useEffect(() => {
        const updateClockAndGreeting = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            if (user?.displayName) {
                const name = user.displayName.split(' ')[0];
                setGreeting(getGreeting(name));
            }
        };
        updateClockAndGreeting();
        const timer = setInterval(updateClockAndGreeting, 1000);
        return () => clearInterval(timer);
    }, [user]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`);
                const data = await res.json();
                const w = data.current_weather;
                setWeather({ temp: Math.round(w.temperature), icon: getWeatherIcon(w.weathercode) });
            } catch (e) { console.error("Weather error", e); }
        }, () => {});
    }, []);

    const getWeatherIcon = (code) => {
        if (code === 0) return "☀️";
        if (code >= 1 && code <= 3) return "⛅";
        if (code >= 45 && code <= 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 80 && code <= 99) return "⛈️";
        return "🌡️";
    };

    const handleQuickCapture = async (e) => {
        if (e.key === 'Enter' && quickTask.trim()) {
            try {
                await TaskService.addTask(user.uid, quickTask);
                setQuickTask('');
                toast.success('Task disimpan ke Inbox', { 
                    icon: '🚀',
                    style: { background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(59, 130, 246, 0.3)' }
                });
            } catch (error) { toast.error('Gagal menyimpan task.'); }
        }
    };

    return (
        // [FIX] z-index 50 agar selalu di atas IdentityCard (z-10)
        // bg-slate-950/80 (lebih gelap) + backdrop-blur-xl agar konten di bawahnya tidak "bocor"
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all shadow-sm">
            
            <div className="flex items-center gap-6">
                <div>
                    <h1 className="text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                        {time || '--:--'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                         <p className="text-xs text-slate-400 font-medium">
                            {greeting}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/5">
                    <span className="text-lg">{weather.icon}</span>
                    <span className="text-xs font-bold text-slate-300">{weather.temp}°</span>
                </div>

                <div className="hidden md:flex items-center bg-slate-900/80 rounded-full px-4 py-2 w-[280px] border border-white/5 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <span className="material-symbols-rounded text-slate-500 text-lg mr-2">add_task</span>
                    <input 
                        className="bg-transparent border-none text-sm text-white placeholder-slate-600 focus:outline-none w-full" 
                        placeholder="Add quick task..." 
                        type="text"
                        value={quickTask}
                        onChange={(e) => setQuickTask(e.target.value)}
                        onKeyDown={handleQuickCapture}
                    />
                    <span className="text-[10px] text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded ml-2">↵</span>
                </div>
            </div>
        </header>
    );
}