// lib/user.js
import { auth, db, appId } from './firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';

/**
 * Memperbarui nama dan foto di Firebase Authentication
 */
export async function updateFirebaseProfile(displayName, photoURL) {
    if (!auth.currentUser) throw new Error("Not authenticated.");
    await updateProfile(auth.currentUser, { displayName, photoURL });
}

/**
 * Mengambil statistik akumulatif dari Firestore
 */
export async function getAccumulatedStats(uid) {
    // 1. Fetch Profile (XP/Level)
    const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'stats', 'profile');
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.data() || { xp: 0, level: 1 };
    
    // 2. Hitung Agregat dari Logs (Ini mahal, tapi untuk mendapatkan total)
    const logsRef = collection(db, 'artifacts', appId, 'users', uid, 'logs');
    const logsSnap = await getDocs(query(logsRef, orderBy('createdAt', 'desc')));

    let totalTasks = 0;
    let totalSessions = 0;
    
    // Filter dan hitung dari semua log
    logsSnap.forEach(d => {
        const type = d.data().type;
        if (type === 'TASK_COMPLETED') totalTasks++;
        if (type === 'FOCUS_SESSION') totalSessions++;
    });

    return {
        ...profileData,
        totalTasks,
        totalSessions
    };
}