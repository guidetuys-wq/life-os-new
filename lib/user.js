// lib/user.js
import { auth, db, appId } from './firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore'; // Import getCountFromServer

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
    // 1. Fetch Profile (XP/Level) - Tetap sama
    const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'stats', 'profile');
    const profileSnap = await getDoc(profileRef);
    const profileData = profileSnap.data() || { xp: 0, level: 1 };
    
    // 2. Hitung Agregat dengan getCountFromServer (Jauh lebih hemat & cepat)
    const logsRef = collection(db, 'artifacts', appId, 'users', uid, 'logs');

    // Hitung Task Completed
    const taskQuery = query(logsRef, where('type', '==', 'TASK_COMPLETED'));
    const taskSnap = await getCountFromServer(taskQuery);
    
    // Hitung Focus Session
    const focusQuery = query(logsRef, where('type', '==', 'FOCUS_DONE'));
    const focusSnap = await getCountFromServer(focusQuery);

    return {
        ...profileData,
        totalTasks: taskSnap.data().count,
        totalSessions: focusSnap.data().count
    };
}