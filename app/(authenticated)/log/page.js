'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogService } from '@/services/logService';
import { AiService } from '@/services/aiService'; // [NEW]
import ReactMarkdown from 'react-markdown'; // [NEW] Untuk render hasil report
import Modal from '@/components/ui/Modal';  // [NEW]
import toast from 'react-hot-toast';

export default function DailyLogPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // [NEW] State untuk Weekly Review
    const [isReviewLoading, setIsReviewLoading] = useState(false);
    const [reviewResult, setReviewResult] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);

    // 1. Fetch Data
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const unsub = LogService.subscribeLogs(user.uid, 50, (data) => {
            setLogs(data);
            setIsLoading(false);
        });
        return () => unsub();
    }, [user]);

    // [NEW] Handler Generate Review
    const handleGenerateReview = async () => {
        setIsReviewLoading(true);
        const toastId = toast.loading("AI sedang menulis laporan mingguan...");
        
        try {
            const result = await AiService.generateWeeklyReview(user.uid);
            setReviewResult(result);
            setShowReviewModal(true);
            toast.success("Laporan siap!", { id: toastId });
        } catch (e) {
            toast.error("Gagal membuat laporan", { id: toastId });
        } finally {
            setIsReviewLoading(false);
        }
    };

    // 2. Grouping Logic (Tetap sama)
    const groupedLogs = useMemo(() => {
        return logs.reduce((acc, log) => {
            if (!log.createdAt) return acc; 
            const date = log.createdAt.seconds 
                ? new Date(log.createdAt.seconds * 1000).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : 'Baru Saja';
            if (!acc[date]) acc[date] = [];
            acc[date].push(log);
            return acc;
        }, {});
    }, [logs]);

    // Helper Style (Tetap sama)
    const getLogStyle = (type) => {
        switch(type) {
            case 'TASK_COMPLETED': return { icon: 'check_circle', color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' };
            case 'TRANSACTION_ADDED': return { icon: 'payments', color: 'bg-emerald-500' };
            case 'FOCUS_DONE': return { icon: 'timer', color: 'bg-blue-500' };
            case 'PROJECT_DONE': return { icon: 'flag', color: 'bg-purple-500 shadow-lg' };
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
                {/* [NEW] Button Generate */}
                <button 
                    onClick={handleGenerateReview}
                    disabled={isReviewLoading}
                    className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 hover:bg-slate-800 transition-all"
                >
                    {isReviewLoading ? <span className="animate-spin material-symbols-rounded text-sm">sync</span> : <span className="material-symbols-rounded text-sm">auto_awesome</span>}
                    Weekly Review
                </button>
            </div>

            {/* ... (Bagian List Logs tetap sama persis dengan sebelumnya) ... */}
            <div className="space-y-8">
                {isLoading ? (
                     <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-900/50 rounded-xl animate-pulse"></div>)}
                     </div>
                ) : (
                    Object.keys(groupedLogs).map(date => (
                        <div key={date}>
                            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 sticky top-0 bg-slate-950/90 backdrop-blur-sm py-2 z-10">{date}</h3>
                            <div className="relative border-l border-slate-800 ml-3 space-y-6">
                                {groupedLogs[date].map(log => {
                                    // ... (render log item sama) ...
                                    const style = getLogStyle(log.type);
                                    return (
                                        <div key={log.id} className="relative pl-8 group">
                                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${style.color} ring-4 ring-slate-950 transition-all group-hover:scale-125`}></div>
                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{log.message}</p>
                                                {log.xpGained && <span className="text-[10px] text-amber-400">+{log.xpGained} XP</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* [NEW] Modal Result */}
            <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)}>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scroll">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-rounded text-purple-400">summarize</span> Weekly Review
                        </h3>
                        <button onClick={() => setShowReviewModal(false)} className="text-slate-500 hover:text-white"><span className="material-symbols-rounded">close</span></button>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <ReactMarkdown>{reviewResult}</ReactMarkdown>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={() => setShowReviewModal(false)} className="btn-primary px-6 py-2 rounded-xl font-bold text-sm">Tutup</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}