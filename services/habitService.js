// services/habitService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, doc, deleteField, 
    serverTimestamp, query, orderBy, onSnapshot, deleteDoc 
} from 'firebase/firestore';
import { addXP, XP_VALUES } from '@/lib/gamification';
import { getLocalDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const COLLECTION = 'habits';

const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const HabitService = {
    // 1. Subscribe Habits
    subscribeHabits: (uid, callback) => {
        const q = query(getCollectionRef(uid), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    // 2. Tambah Habit Baru
    addHabit: async (uid, name) => {
        await addDoc(getCollectionRef(uid), {
            name,
            history: {}, // Map tanggal: boolean
            createdAt: serverTimestamp()
        });
        toast.success('Kebiasaan baru dimulai!', { icon: '🌱' });
    },

    // 3. Toggle Status (Check/Uncheck)
    toggleHabit: async (uid, habit, dateIso) => {
        const habitRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, habit.id);
        const isDone = habit.history && habit.history[dateIso];
        const today = getLocalDate();

        try {
            if (isDone) {
                // UNCHECK (Undo)
                await updateDoc(habitRef, { [`history.${dateIso}`]: deleteField() });
                
                // Tarik kembali XP jika undo dilakukan untuk hari ini
                if (dateIso === today) {
                    await addXP(uid, -XP_VALUES.HABIT_STREAK, 'HABIT_UNDO', `Undo: ${habit.name}`);
                    toast('XP Dibatalkan', { icon: '↩️' });
                }
            } else {
                // CHECK (Done)
                await updateDoc(habitRef, { [`history.${dateIso}`]: true });
                
                // Beri XP hanya jika check untuk hari ini (atau kemarin, opsional)
                if (dateIso === today) {
                    await addXP(uid, XP_VALUES.HABIT_STREAK, 'HABIT_DONE', `Habit: ${habit.name}`);
                    toast.success('Mantap! Konsisten itu kunci.', { icon: '🔥' });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal update habit");
        }
    },

    // 4. Hapus Habit (Permanen karena tidak krusial masuk Trash)
    deleteHabit: async (uid, id) => {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, id));
        toast.success('Habit dihapus');
    }
};