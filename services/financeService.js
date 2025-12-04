// services/financeService.js (ENHANCED VERSION)

import { db, appId } from '@/lib/firebase';
import { 
    collection, doc, writeBatch, serverTimestamp, 
    query, orderBy, limit, onSnapshot, increment, where,
    Timestamp, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { FinanceValidator } from '@/lib/validators/finance.validator';
import toast from 'react-hot-toast';

const USERS_COLLECTION = 'users';
const TRANS_COLLECTION = 'transactions';
const CAT_COLLECTION = 'categories';
const BUDGET_COLLECTION = 'budgets';
const STATS_DOC = 'stats/finance';

const getUserRef = (uid) => collection(db, 'artifacts', appId, USERS_COLLECTION, uid, TRANS_COLLECTION);
const getCatRef = (uid) => collection(db, 'artifacts', appId, USERS_COLLECTION, uid, CAT_COLLECTION);
const getBudgetRef = (uid) => collection(db, 'artifacts', appId, USERS_COLLECTION, uid, BUDGET_COLLECTION);
const getStatsRef = (uid) => doc(db, 'artifacts', appId, USERS_COLLECTION, uid, STATS_DOC);

export const DEFAULT_CATEGORIES = [
  'Makan', 'Transport', 'Belanja', 'Tagihan', 
  'Hiburan', 'Kesehatan', 'Gaji', 'Investasi', 'General'
];

export const FinanceService = {
  
  // ==================== STATS ====================
  
  subscribeStats: (uid, callback) => {
    return onSnapshot(getStatsRef(uid), (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback({ 
          balance: 0, 
          income: 0, 
          expense: 0,
          monthlyIncome: 0,
          monthlyExpense: 0
        });
      }
    }, (error) => {
      console.error('Error subscribing to stats:', error);
      toast.error('Gagal memuat statistik');
    });
  },
  
  // ==================== TRANSACTIONS ====================
  
  subscribeTransactions: (uid, limitCount = 50, callback) => {
    const q = query(
      getUserRef(uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, (snap) => {
      const transactions = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      callback(transactions);
    }, (error) => {
      console.error('Error subscribing to transactions:', error);
      toast.error('Gagal memuat transaksi');
    });
  },
  
  addTransaction: async (uid, data) => {
    try {
      // Validate input
      const validation = FinanceValidator.validateTransaction(data);
      if (!validation.valid) {
        throw new Error(validation.errors[0]); // Show first error
      }
      
      // Sanitize input
      const sanitized = FinanceValidator.sanitizeTransaction(data);
      
      const batch = writeBatch(db);
      
      // Create transaction document
      const newTransRef = doc(getUserRef(uid));
      const transData = {
        ...sanitized,
        userId: uid,
        createdAt: serverTimestamp(),
        date: Timestamp.fromDate(sanitized.date)
      };
      batch.set(newTransRef, transData);
      
      // Update global stats
      const amountVal = Math.abs(transData.amount);
      const statsUpdates = {
        [transData.type]: increment(amountVal),
        balance: increment(transData.type === 'income' ? amountVal : -amountVal),
        lastUpdated: serverTimestamp()
      };
      
      // Update monthly stats if current month
      const now = new Date();
      const transDate = sanitized.date;
      if (transDate.getMonth() === now.getMonth() && 
          transDate.getFullYear() === now.getFullYear()) {
        const monthlyField = transData.type === 'income' ? 'monthlyIncome' : 'monthlyExpense';
        statsUpdates[monthlyField] = increment(amountVal);
      }
      
      batch.set(getStatsRef(uid), statsUpdates, { merge: true });
      
      // Commit batch
      await batch.commit();
      
      toast.success('Transaksi dicatat!', { icon: '💰' });
      return newTransRef.id;
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error.message || 'Gagal menyimpan transaksi');
      throw error;
    }
  },
  
  deleteTransaction: async (uid, transaction) => {
    try {
      const batch = writeBatch(db);
      
      // Delete transaction document
      const transRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, TRANS_COLLECTION, transaction.id);
      batch.delete(transRef);
      
      // Revert stats
      const amountVal = Number(transaction.amount);
      const statsUpdates = {
        [transaction.type]: increment(-amountVal),
        balance: increment(transaction.type === 'income' ? -amountVal : amountVal),
        lastUpdated: serverTimestamp()
      };
      
      batch.set(getStatsRef(uid), statsUpdates, { merge: true });
      
      await batch.commit();
      
      toast.success('Transaksi dihapus & saldo dikembalikan', { icon: '🔄' });
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Gagal menghapus transaksi');
      throw error;
    }
  },
  
  // ==================== CATEGORIES ====================
  
  subscribeCategories: (uid, callback) => {
    const q = query(getCatRef(uid), orderBy('name', 'asc'));
    return onSnapshot(q, (snap) => {
      const categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(categories);
    }, (error) => {
      console.error('Error subscribing to categories:', error);
      toast.error('Gagal memuat kategori');
    });
  },
  
  addCategory: async (uid, name) => {
    try {
      // Validate
      const validation = FinanceValidator.validateCategory(name);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }
      
      const batch = writeBatch(db);
      const newCatRef = doc(getCatRef(uid));
      batch.set(newCatRef, { 
        name: name.trim(), 
        createdAt: serverTimestamp(),
        userId: uid
      });
      
      await batch.commit();
      toast.success('Kategori ditambahkan');
      
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Gagal menambah kategori');
      throw error;
    }
  },
  
  deleteCategory: async (uid, id) => {
    try {
      const catRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, CAT_COLLECTION, id);
      await deleteDoc(catRef);
      toast.success('Kategori dihapus');
      
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Gagal menghapus kategori');
      throw error;
    }
  },
  
  // ==================== BUDGETS (NEW) ====================
  
  subscribeBudgets: (uid, callback) => {
    const q = query(getBudgetRef(uid), orderBy('category', 'asc'));
    return onSnapshot(q, (snap) => {
      const budgets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(budgets);
    }, (error) => {
      console.error('Error subscribing to budgets:', error);
      // Silent fail for budgets (optional feature)
    });
  },
  
  addBudget: async (uid, data) => {
    try {
      // Validate
      const validation = FinanceValidator.validateBudget(data);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }
      
      const budgetRef = doc(getBudgetRef(uid));
      await setDoc(budgetRef, {
        ...data,
        userId: uid,
        spent: 0,
        createdAt: serverTimestamp()
      });
      
      toast.success('Budget berhasil dibuat!', { icon: '📊' });
      
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error(error.message || 'Gagal membuat budget');
      throw error;
    }
  },
  
  updateBudget: async (uid, budgetId, updates) => {
    try {
      const budgetRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, BUDGET_COLLECTION, budgetId);
      await updateDoc(budgetRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Budget diupdate!');
      
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Gagal mengupdate budget');
      throw error;
    }
  },
  
  deleteBudget: async (uid, budgetId) => {
    try {
      const budgetRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, BUDGET_COLLECTION, budgetId);
      await deleteDoc(budgetRef);
      
      toast.success('Budget dihapus');
      
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Gagal menghapus budget');
      throw error;
    }
  }
};
