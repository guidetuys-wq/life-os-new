'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db';
import { formatMoney } from '@/lib/utils';
import toast from 'react-hot-toast';

// Import Komponen & UI Baru
import FinanceChart from '@/components/FinanceChart';
import CategoryManager from '@/components/CategoryManager';
import Input from '@/components/ui/Input';    // <-- Import UI Baru
import Select from '@/components/ui/Select';  // <-- Import UI Baru

export default function FinancePage() {
    const { user } = useAuth();
    
    // States Data
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
    
    // States UI
    const [formData, setFormData] = useState({ amount: '', desc: '', type: 'expense', category: 'General' });
    const [showCatManager, setShowCatManager] = useState(false);

    // 1. Fetch Transactions & Calculate Stats
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransactions(data);
            let inc = 0, exp = 0;
            data.forEach(t => { if(t.type === 'income') inc += t.amount; else exp += t.amount; });
            setStats({ income: inc, expense: exp, balance: inc - exp });
        });
        return () => unsub();
    }, [user]);

    // 2. Fetch Categories
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'categories'), orderBy('name', 'asc'));
        const unsub = onSnapshot(q, (snap) => {
            const customCats = snap.docs.map(d => d.data().name);
            const defaultCats = ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Gaji', 'Investasi', 'General'];
            setCategories([...new Set([...defaultCats, ...customCats])]);
        });
        return () => unsub();
    }, [user]);

    // 3. Handle Save
    const handleSave = async (e) => {
        e.preventDefault();
        const amt = parseInt(formData.amount);
        if (!amt || !formData.desc) { toast.error("Lengkapi data dulu!"); return; }

        try {
            await addItem(user.uid, 'transactions', {
                amount: amt, note: formData.desc, type: formData.type, category: formData.category || 'General'
            });
            setFormData(prev => ({ ...prev, amount: '', desc: '' }));
            toast.success('Transaksi dicatat!', { icon: '💰' });
        } catch (error) { toast.error('Gagal menyimpan data'); }
    };

    // 4. Handle Delete
    const handleDelete = async (id) => {
        if(confirm('Hapus transaksi ini?')) {
            try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id)); toast.success('Dihapus'); } 
            catch { toast.error('Gagal menghapus'); }
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto pb-32 animate-enter">
            <h1 className="text-2xl font-bold text-white mb-6 tracking-tight">Dompet & Cashflow</h1>

            {/* 1. KARTU SALDO (Premium Gradient) */}
            <div className="relative overflow-hidden rounded-[2rem] p-8 mb-8 border border-white/10 shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black z-0"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Total Balance</p>
                        <h2 className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                            {formatMoney(stats.balance)}
                        </h2>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">Masuk</span>
                            <span className="text-sm font-bold text-white font-mono">{formatMoney(stats.income)}</span>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <span className="text-[10px] text-rose-400 font-bold uppercase block mb-1">Keluar</span>
                            <span className="text-sm font-bold text-white font-mono">{formatMoney(stats.expense)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. INPUT FORM & CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                
                {/* Form Input (Menggunakan Komponen Baru UI/Input & UI/Select) */}
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
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </Select>
                        </div>

                        <Input 
                            label="Jumlah (Rp)"
                            type="number" 
                            icon="attach_money"
                            placeholder="0"
                            className="font-mono text-lg font-bold tracking-wide"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                        />

                        <div className="flex gap-3 items-end">
                            <Input 
                                label="Catatan"
                                type="text"
                                icon="description"
                                placeholder="Cth: Nasi Padang..."
                                value={formData.desc}
                                onChange={e => setFormData({...formData, desc: e.target.value})}
                                className="w-full"
                            />
                            <button type="submit" className="h-[46px] w-[56px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center mb-[1px]">
                                <span className="material-symbols-rounded text-xl">check</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Chart Visualization */}
                <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-rounded text-6xl">pie_chart</span>
                    </div>
                    <div className="w-full flex justify-between items-center mb-6 z-10">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analisa</h3>
                        <span className="text-[10px] text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">Expense Only</span>
                    </div>
                    <div className="w-full h-48 z-10">
                        <FinanceChart transactions={transactions} />
                    </div>
                </div>
            </div>

            {/* 3. RIWAYAT TERBARU */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 ml-1 uppercase tracking-wider text-[10px]">Riwayat Transaksi</h3>
                {transactions.map(t => (
                    <div key={t.id} className="group flex justify-between items-center p-4 bg-slate-900/40 hover:bg-slate-800/60 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                <span className="material-symbols-rounded text-2xl">
                                    {t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white mb-1">{t.note}</p>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                                    {t.category}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-5">
                            <span className={`text-sm font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                            </span>
                            <button 
                                onClick={() => handleDelete(t.id)} 
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-symbols-rounded text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
                
                {transactions.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                        <span className="material-symbols-rounded text-4xl text-slate-600 mb-2">receipt_long</span>
                        <p className="text-sm text-slate-500">Belum ada transaksi.</p>
                    </div>
                )}
            </div>

            {/* MODAL MANAGER */}
            {showCatManager && <CategoryManager onClose={() => setShowCatManager(false)} />}
        </div>
    );
}