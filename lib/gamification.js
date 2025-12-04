import { doc, updateDoc, increment, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { addItem } from '@/lib/db'; 
import toast from 'react-hot-toast';
import { triggerLevelUpConfetti } from '@/lib/confetti'; // [NEW] Import
import { playSound } from '@/lib/sounds'; // [NEW] Import Sound

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
    
    // 1. Update XP Atomic
    try {
        await updateDoc(userRef, { 
            xp: increment(amount),
            lastUpdated: serverTimestamp()
        });
    } catch (e) {
        if (e.code === 'not-found') {
            await setDoc(userRef, { xp: amount, level: 1 });
        }
    }

    // 2. Cek Level Up Logic
    const snap = await getDoc(userRef);
    const currentXP = snap.data()?.xp || 0;
    const currentLevel = snap.data()?.level || 1;
    const newLevel = Math.floor(currentXP / 100) + 1;

    if (newLevel > currentLevel) {
        await updateDoc(userRef, { level: newLevel });
        
        // [VISUAL & AUDIO] Celebration
        triggerLevelUpConfetti();
        playSound('levelup'); // [NEW] Mainkan suara Level Up!

        toast.success(`LEVEL UP! Selamat datang di Level ${newLevel}! 🎉`, {
            duration: 6000,
            style: {
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)'
            },
            icon: '🚀'
        });
    }

    // 3. Log Aktivitas
    await addItem(uid, 'logs', {
        type: actionType,
        message: `${message} (+${amount} XP)`,
        xpGained: amount
    });
}