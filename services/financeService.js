// services/financeService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, doc, writeBatch, serverTimestamp, 
    query, orderBy, limit, onSnapshot, increment, where
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const USERS_COLLECTION = 'users';
const TRANS_COLLECTION = 'transactions';
const CAT_COLLECTION = 'categories';
const STATS_DOC = 'stats/finance';

const getUserRef = (uid) => collection(db, 'artifacts', appId, USERS_COLLECTION, uid, TRANS_COLLECTION);
const getCatRef = (uid) => collection(db, 'artifacts', appId, USERS_COLLECTION, uid, CAT_COLLECTION);
const getStatsRef = (uid) => doc(db, 'artifacts', appId, USERS_COLLECTION, uid, STATS_DOC);

export const DEFAULT_CATEGORIES = ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Gaji', 'Investasi', 'General'];

export const FinanceService = {
    // 1. Subscribe Stats (Saldo Global)
    subscribeStats: (uid, callback) => {
        return onSnapshot(getStatsRef(uid), (snap) => {
            if (snap.exists()) callback(snap.data());
            else callback({ balance: 0, income: 0, expense: 0 });
        });
    },

    // 2. Subscribe Riwayat Transaksi
    subscribeTransactions: (uid, limitCount = 50, callback) => {
        const q = query(
            getUserRef(uid),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    // 3. Subscribe Custom Categories
    subscribeCategories: (uid, callback) => {
        const q = query(getCatRef(uid), orderBy('name', 'asc'));
        return onSnapshot(q, (snap) => {
            const customCats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(customCats);
        });
    },

    // 4. Tambah Transaksi (ATOMIC BATCH)
    addTransaction: async (uid, data) => {
        const batch = writeBatch(db);
        
        // A. Buat Transaksi Baru
        const newTransRef = doc(getUserRef(uid)); // Auto-ID
        const transData = {
            ...data,
            amount: Number(data.amount), // Pastikan number
            createdAt: serverTimestamp()
        };
        batch.set(newTransRef, transData);

        // B. Update Global Stats
        const amountVal = Math.abs(transData.amount);
        const updates = {
            [transData.type]: increment(amountVal),
            balance: increment(transData.type === 'income' ? amountVal : -amountVal)
        };
        // Gunakan set dengan merge: true agar aman jika doc stats belum ada
        batch.set(getStatsRef(uid), updates, { merge: true });

        // C. Commit Batch
        await batch.commit();
        toast.success('Transaksi dicatat!', { icon: '💰' });
    },

    // 5. Hapus Transaksi (ATOMIC REVERSAL)
    deleteTransaction: async (uid, transaction) => {
        const batch = writeBatch(db);
        
        // A. Hapus Doc Transaksi
        const transRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, TRANS_COLLECTION, transaction.id);
        batch.delete(transRef);

        // B. Revert Stats (Balikkan angka)
        const amountVal = Number(transaction.amount);
        // Jika hapus Income -> Saldo berkurang (-), Income berkurang (-)
        // Jika hapus Expense -> Saldo bertambah (+), Expense berkurang (-)
        const updates = {
            [transaction.type]: increment(-amountVal),
            balance: increment(transaction.type === 'income' ? -amountVal : amountVal)
        };
        batch.set(getStatsRef(uid), updates, { merge: true });

        await batch.commit();
        toast.success('Dihapus & Saldo dikembalikan', { icon: '🔄' });
    },

    // 6. Kelola Kategori
    addCategory: async (uid, name) => {
        const batch = writeBatch(db);
        const newCatRef = doc(getCatRef(uid));
        batch.set(newCatRef, { name: name.trim(), createdAt: serverTimestamp() });
        await batch.commit();
        toast.success('Kategori ditambahkan');
    },

    deleteCategory: async (uid, id) => {
        const catRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, CAT_COLLECTION, id);
        await deleteDoc(catRef); // Delete kategori tidak perlu batch dengan stats
        toast.success('Kategori dihapus');
    }
};