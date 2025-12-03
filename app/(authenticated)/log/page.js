'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogService } from '@/services/logService';

export default function DailyLogPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);

    // 1. Fetch Data via Service
    useEffect(() => {
        if (!user) return;
        const unsub = LogService.subscribeLogs(user.uid, 50, setLogs);
        return () => unsub();
    }, [user]);

    // 2. Grouping Logic (Memoized agar tidak re-render berat)
    const groupedLogs = useMemo(() => {
        return logs.reduce((acc, log) => {
            const date = log.createdAt?.seconds 
                ? new Date(log.createdAt.seconds * 1000).toLocaleDateString('id-ID', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })
                : 'Baru Saja';
            
            if (!acc[date]) acc[date] = [];
            acc[date].push(log);
            return acc;
        }, {});
    }, [logs]);

    // Helper: Icon & Color Config
    const getLogStyle = (type) => {
        switch(type) {
            case 'TASK_COMPLETED': return { icon: 'check_circle', color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' };
            case 'TRANSACTION_ADDED': return { icon: 'payments', color: 'bg-emerald-500' };
            case 'FOCUS_DONE': return { icon: 'timer', color: 'bg-blue-500' };
            default: return { icon: 'info', color: 'bg-slate-500' };
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 animate-enter">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Daily Log</h2>
                    <p className="text-sm text-slate-400">Jejak aktivitas digitalmu.</p>
                </div>
            </div>

            <div className="space-y-8">
                {Object.keys(groupedLogs).map(date => (
                    <div key={date}>
                        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 sticky top-0 bg-slate-950/90 backdrop-blur-sm py-2 z-10">
                            {date}
                        </h3>
                        <div className="relative border-l border-slate-800 ml-3 space-y-6">
                            {groupedLogs[date].map(log => {
                                const time = log.createdAt?.seconds 
                                    ? new Date(log.createdAt.seconds * 1000).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})
                                    : '--:--';
                                
                                const style = getLogStyle(log.type);

                                return (
                                    <div key={log.id} className="relative pl-8 group">
                                        {/* Dot Indicator */}
                                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${style.color} ring-4 ring-slate-950 transition-all group-hover:scale-125`}></div>
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="text-xs font-mono text-slate-500 min-w-[50px]">{time}</span>
                                            <div className="flex-1 bg-slate-900/30 p-3 rounded-xl border border-white/5 hover:bg-slate-800/50 transition-colors">
                                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{log.message}</p>
                                                {/* Metadata (Optional) */}
                                                {log.metadata && (
                                                    <div className="mt-2 text-[10px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
                                                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                
                {logs.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <span className="material-symbols-rounded text-6xl text-slate-700 mb-4">history_edu</span>
                        <p className="text-slate-500">Belum ada aktivitas tercatat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}