// services/settingService.js
import { auth, db, appId } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { 
    collection, doc, getDoc, getDocs, writeBatch, 
    query, where, getCountFromServer, serverTimestamp 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const USERS_COLLECTION = 'users';

export const SettingService = {
    // 1. Update Profile (Firebase Auth)
    updateProfile: async (displayName, photoURL) => {
        if (!auth.currentUser) throw new Error("User not authenticated");
        
        await updateProfile(auth.currentUser, { 
            displayName, 
            photoURL 
        });
    },

    // 2. Get User Stats (Aggregation)
    getStats: async (uid) => {
        const profileRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, 'stats', 'profile');
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.data() || { xp: 0, level: 1 };

        const tasksRef = collection(db, 'artifacts', appId, USERS_COLLECTION, uid, 'tasks');
        const taskSnap = await getCountFromServer(query(tasksRef, where('completed', '==', true)));

        const logsRef = collection(db, 'artifacts', appId, USERS_COLLECTION, uid, 'logs');
        const focusSnap = await getCountFromServer(query(logsRef, where('type', '==', 'FOCUS_DONE')));

        return {
            ...profileData,
            totalTasks: taskSnap.data().count,
            totalSessions: focusSnap.data().count
        };
    },

    // 3. DANGER: Reset Account (Total Wipe)
    resetAccount: async (uid) => {
        const batch = writeBatch(db);
        
        // [UPDATE] Daftar lengkap koleksi untuk dibersihkan
        const collections = [
            'tasks', 'projects', 'goals', 'notes', 
            'library', 'transactions', 'habits', 
            'categories', 'logs', 'wellness' // + Wellness
        ];

        // A. Hapus semua dokumen di setiap koleksi
        for (const colName of collections) {
            const ref = collection(db, 'artifacts', appId, USERS_COLLECTION, uid, colName);
            const snap = await getDocs(ref);
            snap.forEach((doc) => {
                batch.delete(doc.ref);
            });
        }

        // B. Reset Stats Profile & Finance
        const profileStatsRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, 'stats', 'profile');
        batch.set(profileStatsRef, { xp: 0, level: 1, lastUpdated: serverTimestamp() });

        const financeStatsRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, 'stats', 'finance');
        batch.set(financeStatsRef, { balance: 0, income: 0, expense: 0 });
        
        // C. Reset Identity Personal (Agar kembali ke default)
        const identityRef = doc(db, 'artifacts', appId, USERS_COLLECTION, uid, 'personal', 'identity');
        batch.delete(identityRef); 

        // D. Eksekusi
        await batch.commit();
        toast.success("Akun berhasil di-reset bersih (Level 1)", { icon: '✨' });
    }
};