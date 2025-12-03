import { doc, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db'; // Untuk log aktivitas
import toast from 'react-hot-toast';

// Konstanta XP
export const XP_VALUES = {
    TASK_COMPLETE: 10,
    TIMER_SESSION: 25,
    PROJECT_DONE: 100,
    HABIT_STREAK: 5,
    TRANSACTION_LOG: 2
};

export async function addXP(uid, amount, actionType, message) {
    if (!uid) return;
    
    const userRef = doc(db, 'artifacts', appId, 'users', uid, 'stats', 'profile');
    
    // 1. Tambah XP di Database
    await updateDoc(userRef, { 
        xp: increment(amount),
        lastUpdated: serverTimestamp()
    }).catch(async (e) => {
        // Jika dokumen belum ada (user baru), buat dulu
        if (e.code === 'not-found') {
            const { setDoc } = await import('firebase/firestore');
            await setDoc(userRef, { xp: amount, level: 1 });
        }
    });

    // 2. Cek Level Up
    const snap = await getDoc(userRef);
    const currentXP = snap.data()?.xp || 0;
    const currentLevel = snap.data()?.level || 1;
    const newLevel = Math.floor(currentXP / 100) + 1;

    if (newLevel > currentLevel) {
        await updateDoc(userRef, { level: newLevel });
        
        // [FIX] Ganti alert() dengan toast yang cantik
        toast.success(`LEVEL UP! Naik ke Level ${newLevel}! 🎉`, {
            duration: 5000,
            style: {
                background: '#3b82f6', // Biru
                color: '#fff',
                fontWeight: 'bold',
                border: '2px solid #60a5fa'
            },
            icon: '🚀'
        });
    }

    // 3. Catat di Log Aktivitas (Agar muncul di Daily Log)
    await addItem(uid, 'logs', {
        type: actionType,
        message: `${message} (+${amount} XP)`,
        xpGained: amount
    });
}