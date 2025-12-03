// services/wellnessService.js
import { db, appId } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { addXP } from '@/lib/gamification';
import { getLocalDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const COLLECTION = 'wellness';
const WELLNESS_XP_REWARD = 5; // Reward XP saat target tercapai

const getDocRef = (uid) => {
    const today = getLocalDate(); // Menggunakan format YYYY-MM-DD
    return doc(db, 'artifacts', appId, 'users', uid, COLLECTION, today);
};

export const WellnessService = {
    // 1. Subscribe Data Hari Ini
    subscribeWellness: (uid, callback) => {
        return onSnapshot(getDocRef(uid), (snap) => {
            if (snap.exists()) {
                callback(snap.data());
            } else {
                callback({ water: 0, mood: null });
            }
        });
    },

    // 2. Update Mood
    setMood: async (uid, mood) => {
        // Gunakan setDoc dengan merge agar field water tidak tertimpa
        await setDoc(getDocRef(uid), { mood }, { merge: true });
    },

    // 3. Tambah Air Minum (Business Logic)
    addWater: async (uid, currentCount) => {
        if (currentCount >= 8) return; // Batas max 8 gelas

        const newCount = currentCount + 1;
        await setDoc(getDocRef(uid), { water: newCount }, { merge: true });

        // Cek Reward (Hanya sekali saat mencapai target 8)
        if (newCount === 8) {
            await addXP(uid, WELLNESS_XP_REWARD, 'WELLNESS_GOAL', 'Target Minum Tercapai');
            toast.success(`Target hidrasi tercapai! +${WELLNESS_XP_REWARD} XP`, { icon: '💧' });
        }
    }
};