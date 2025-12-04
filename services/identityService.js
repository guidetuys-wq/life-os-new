// services/identityService.js (FIXED VERSION)

import { db, appId } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const COLLECTION = 'personal';
const DOC_ID = 'identity';

const getDocRef = (uid) => doc(db, 'artifacts', appId, 'users', uid, COLLECTION, DOC_ID);

// ✅ Default data as constant
const DEFAULT_IDENTITY = {
    statement: 'Aku adalah orang yang selalu kembali ke sistemku sendiri.',
    anchor: 'Kembali lebih penting dari kemajuan.',
    focus: { f1: '', f2: '', f3: '' },
    nextAction: '',
    snapshot: { good: '', fix: '', leave: '' }
};

export const IdentityService = {
    // 1. Subscribe Data Realtime
    subscribeIdentity: (uid, callback) => {
        // ✅ Track if we've sent initial data
        let initialDataSent = false;

        return onSnapshot(
            getDocRef(uid),
            (snap) => {
                if (snap.exists()) {
                    callback(snap.data());
                    initialDataSent = true;
                } else if (!initialDataSent) {
                    // ✅ Only send default once
                    callback(DEFAULT_IDENTITY);
                    initialDataSent = true;
                }
            },
            (error) => {
                console.error("Identity subscription error:", error);
            }
        );
    },

    // 2. Update Field Tertentu (Debounced di UI)
    updateIdentity: async (uid, data) => {
        try {
            await setDoc(getDocRef(uid), data, { merge: true });
        } catch (error) {
            console.error("Update Identity Error:", error);
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
