'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';

export default function DailyLogPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (!user) return;
        // Ambil 50 log terakhir
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('createdAt', 'desc'), limit(50));
        
        const unsub = onSnapshot(q, (snap) => {
            setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user]);

    // Group logs by date
    const groupedLogs = logs.reduce((acc, log) => {
        const date = log.createdAt?.seconds 
            ? new Date(log.createdAt.seconds * 1000).toDateString() 
            : 'Baru Saja';
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {});

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Daily Log</h2>
                    <p className="text-sm text-slate-400">Jejak aktivitas digitalmu.</p>
                </div>
            </div>

            <div className="space-y-8">
                {Object.keys(groupedLogs).map(date => (
                    <div key={date}>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 sticky top-0 bg-slate-950/90 backdrop-blur py-2 z-10">
                            {date}
                        </h3>
                        <div className="relative border-l border-slate-800 ml-3 space-y-6">
                            {groupedLogs[date].map(log => {
                                const time = log.createdAt?.seconds 
                                    ? new Date(log.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                    : '';
                                
                                let icon = 'info';
                                let color = 'bg-slate-500';
                                
                                if (log.type === 'TASK_COMPLETED') { icon = 'check_circle'; color = 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'; }
                                if (log.type === 'TRANSACTION_ADDED') { icon = 'payments'; color = 'bg-emerald-500'; }
                                if (log.type === 'FOCUS_DONE') { icon = 'timer'; color = 'bg-blue-500'; }

                                return (
                                    <div key={log.id} className="relative pl-8">
                                        <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${color} ring-4 ring-slate-950`}></div>
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="text-xs font-mono text-slate-500 min-w-[50px]">{time}</span>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-300 font-medium">{log.message}</p>
                                                {log.metadata && (
                                                    <pre className="text-[10px] text-slate-600 mt-1 overflow-x-auto">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}