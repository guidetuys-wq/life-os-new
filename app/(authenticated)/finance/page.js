'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FinanceService, DEFAULT_CATEGORIES } from '@/services/financeService';
import { formatMoney } from '@/lib/utils';
import toast from 'react-hot-toast';

// UI Components
import FinanceChart from '@/components/FinanceChart';
import CategoryManager from '@/components/CategoryManager';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function FinancePage() {
    const { user } = useAuth();
    
    // Data States
    const [transactions, setTransactions] = useState([]);
    const [customCategories, setCustomCategories] = useState([]);
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
    
    // UI States
    const [formData, setFormData] = useState({ amount: '', desc: '', type: 'expense', category: 'General' });
    const [showCatManager, setShowCatManager] = useState(false);
    
    // [NEW] Filter State (Interactive Chart)
    const [filterCategory, setFilterCategory] = useState(null); 

    // 1. Subscription
    useEffect(() => {
        if (!user) return;
        const unsubStats = FinanceService.subscribeStats(user.uid, setStats);
        const unsubTrans = FinanceService.subscribeTransactions(user.uid, 100, setTransactions); // Naikkan limit agar export berguna
        const unsubCats = FinanceService.subscribeCategories(user.uid, setCustomCategories);
        return () => { unsubStats(); unsubTrans(); unsubCats(); };
    }, [user]);

    // 2. Computed Data
    const categoryOptions = useMemo(() => {
        const customNames = customCategories.map(c => c.name);
        return [...new Set([...DEFAULT_CATEGORIES, ...customNames])];
    }, [customCategories]);

    // [NEW] Filtered Transactions List
    const displayedTransactions = useMemo(() => {
        if (!filterCategory) return transactions;
        return transactions.filter(t => t.category === filterCategory && t.type === 'expense');
    }, [transactions, filterCategory]);

    // 3. Actions
    const handleSave = async (e) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0 || !formData.desc) {
            return toast.error("Data tidak valid.");
        }
        try {
            await FinanceService.addTransaction(user.uid, { ...formData, amount });
            setFormData(prev => ({ ...prev, amount: '', desc: '' })); 
            toast.success("Transaksi dicatat!");
        } catch (error) { toast.error("Gagal menyimpan"); }
    };

    const handleDelete = async (transaction) => {
        if(confirm('Hapus transaksi ini?')) {
            await FinanceService.deleteTransaction(user.uid, transaction);
        }
    };

    // [NEW] Export CSV Function
    const handleExportCSV = () => {
        if (transactions.length === 0) return toast.error("Belum ada data untuk diexport");

        // Header CSV
        const headers = ["Tanggal", "Tipe", "Kategori", "Jumlah (IDR)", "Catatan"];
        
        // Rows Data
        const rows = transactions.map(t => {
            const date = t.createdAt?.seconds 
                ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('id-ID')
                : '-';
            return [
                date,
                t.type,
                t.category,
                t.amount,
                `"${t.note || ''}"` // Quote note agar koma aman
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        // Trigger Download
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `LifeOS_Finance_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Laporan berhasil didownload!", { icon: '📄' });
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32 animate-enter">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dompet & Cashflow</h1>
                    <p className="text-sm text-slate-400">Kelola keuanganmu dengan bijak.</p>
                </div>
                
                {/* [NEW] Export Button */}
                <button 
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 hover:text-white transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-rounded text-lg">download</span>
                    Export CSV
                </button>
            </div>

            {/* Hero Balance Card (Sama seperti sebelumnya) */}
            <div className="relative overflow-hidden rounded-[2rem] p-8 mb-8 border border-white/10 shadow-2xl group bg-slate-900/40">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-black/50 z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Total Balance</p>
                        <h2 className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 animate-pulse-slow">
                            {formatMoney(stats.balance || 0)}
                        </h2>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">Masuk</span>
                            <span className="text-sm font-bold text-white font-mono">{formatMoney(stats.income || 0)}</span>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <span className="text-[10px] text-rose-400 font-bold uppercase block mb-1">Keluar</span>
                            <span className="text-sm font-bold text-white font-mono">{formatMoney(stats.expense || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                
                {/* Form Input */}
                <div className="lg:col-span-7 glass-card p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-rounded text-blue-400">edit_square</span> Catat Transaksi
                        </h3>
                        <button onClick={() => setShowCatManager(true)} className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1">
                            <span className="material-symbols-rounded text-xs">settings</span> Kategori
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col gap-5">
                        {/* ... Input Fields (Sama seperti sebelumnya) ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <Select 
                                label="Tipe"
                                icon={formData.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className={formData.type === 'income' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
                            >
                                <option value="expense">Pengeluaran</option>
                                <option value="income">Pemasukan</option>
                            </Select>

                            <Select 
                                label="Kategori"
                                icon="category"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Select>
                        </div>

                        <Input 
                            label="Jumlah (Rp)" type="number" min="0" icon="attach_money" placeholder="0"
                            className="font-mono text-lg font-bold tracking-wide"
                            value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        />

                        <div className="flex gap-3 items-end">
                            <Input 
                                label="Catatan" type="text" icon="description" placeholder="Cth: Nasi Padang..."
                                value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full"
                            />
                            <button type="submit" disabled={!formData.amount || !formData.desc} className="h-[46px] w-[56px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center mb-[1px] disabled:opacity-50">
                                <span className="material-symbols-rounded text-xl">check</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Interactive Chart */}
                <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-rounded text-6xl">pie_chart</span>
                    </div>
                    
                    <div className="w-full flex justify-between items-center mb-6 z-10">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analisa Pengeluaran</h3>
                        
                        {/* [NEW] Filter Indicator */}
                        {filterCategory ? (
                            <button 
                                onClick={() => setFilterCategory(null)}
                                className="text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-500 transition-colors animate-in fade-in"
                            >
                                Filter: {filterCategory} <span className="material-symbols-rounded text-sm">close</span>
                            </button>
                        ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">Semua Kategori</span>
                        )}
                    </div>
                    
                    <div className="w-full h-48 z-10">
                        {/* [NEW] Pass Handler */}
                        <FinanceChart transactions={transactions} onCategoryClick={setFilterCategory} />
                    </div>
                    
                    <p className="text-[9px] text-slate-500 mt-4 text-center">
                        *Klik grafik untuk filter riwayat di bawah
                    </p>
                </div>
            </div>

            {/* History List (Filtered) */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider text-[10px]">
                    {filterCategory ? `Riwayat: ${filterCategory}` : 'Riwayat Transaksi'}
                </h3>
                
                {displayedTransactions.map(t => (
                    <div key={t.id} className="group flex justify-between items-center p-4 bg-slate-900/40 hover:bg-slate-800/60 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                <span className="material-symbols-rounded text-2xl">
                                    {t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white mb-1 leading-snug">{t.note}</p>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800 tracking-wider">
                                    {t.category}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-5">
                            <span className={`text-sm font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                            </span>
                            <button onClick={() => handleDelete(t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-80 group-hover:opacity-100">
                                <span className="material-symbols-rounded text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                {displayedTransactions.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                        <span className="material-symbols-rounded text-4xl text-slate-600 mb-2">filter_list_off</span>
                        <p className="text-sm text-slate-500">Tidak ada transaksi {filterCategory ? `di kategori ${filterCategory}` : ''}.</p>
                    </div>
                )}
            </div>

            {showCatManager && <CategoryManager onClose={() => setShowCatManager(false)} />}
        </div>
    );
}