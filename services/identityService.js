// services/identityService.js
import { db, appId } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Data disimpan di: users/{uid}/personal/identity
const COLLECTION = 'personal';
const DOC_ID = 'identity';

const getDocRef = (uid) => doc(db, 'artifacts', appId, 'users', uid, COLLECTION, DOC_ID);

export const IdentityService = {
    // 1. Subscribe Data Realtime
    subscribeIdentity: (uid, callback) => {
        return onSnapshot(getDocRef(uid), (snap) => {
            if (snap.exists()) {
                callback(snap.data());
            } else {
                // Default Data jika pengguna baru
                callback({
                    statement: 'Aku adalah orang yang selalu kembali ke sistemku sendiri.',
                    anchor: 'Kembali lebih penting dari kemajuan.',
                    focus: { f1: '', f2: '', f3: '' },
                    nextAction: '',
                    snapshot: { good: '', fix: '', leave: '' }
                });
            }
        });
    },

    // 2. Update Field Tertentu (Debounced di UI)
    updateIdentity: async (uid, data) => {
        try {
            await setDoc(getDocRef(uid), data, { merge: true });
        } catch (error) {
            console.error("Update Identity Error:", error);
            // Toast opsional, dimatikan agar tidak spamming saat ketik
        }
    },

    // 3. Update Full via Settings
    updateProfileSettings: async (uid, { statement, anchor }) => {
        try {
            await setDoc(getDocRef(uid), { statement, anchor }, { merge: true });
            toast.success("Identitas diperbarui");
        } catch (error) {
            toast.error("Gagal update identitas");
        }
    }
};