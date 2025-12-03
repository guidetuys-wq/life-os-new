// services/goalService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, doc, serverTimestamp, 
    query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const COLLECTION = 'goals';

const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const GoalService = {
    // 1. Subscribe Goals (Realtime)
    subscribeGoals: (uid, callback) => {
        const q = query(
            getCollectionRef(uid),
            where('deleted', '!=', true),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    // 2. Tambah Goal
    addGoal: async (uid, data) => {
        const cleanData = {
            ...data,
            progress: 0,
            deleted: false,
            createdAt: serverTimestamp()
        };
        await addDoc(getCollectionRef(uid), cleanData);
    },

    // 3. Update Progress (atau Field Lain)
    updateGoal: async (uid, goalId, data) => {
        const goalRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, goalId);
        await updateDoc(goalRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // 4. Hapus (Soft Delete)
    deleteGoal: async (uid, goalId) => {
        const goalRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, goalId);
        await updateDoc(goalRef, { 
            deleted: true, 
            deletedAt: serverTimestamp() 
        });
        toast.success('Target dipindahkan ke sampah', { icon: '🗑️' });
    }
};