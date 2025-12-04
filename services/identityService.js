// services/identityService.js
import { db, appId } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const COLLECTION = 'personal';
const DOC_ID = 'identity';

const getDocRef = (uid) => doc(db, 'artifacts', appId, 'users', uid, COLLECTION, DOC_ID);

// [UPDATE] Tambahkan field 'aiContext'
const DEFAULT_IDENTITY = {
    statement: 'Aku adalah orang yang selalu kembali ke sistemku sendiri.',
    anchor: 'Kembali lebih penting dari kemajuan.',
    aiContext: 'Saya seorang pekerja kreatif yang butuh motivasi keras. Gaya bicara santai tapi to the point.', // [NEW]
    focus: { f1: '', f2: '', f3: '' },
    nextAction: '',
    snapshot: { good: '', fix: '', leave: '' }
};

export const IdentityService = {
    // 1. Subscribe Data Realtime
    subscribeIdentity: (uid, callback) => {
        let initialDataSent = false;

        return onSnapshot(
            getDocRef(uid),
            (snap) => {
                if (snap.exists()) {
                    callback(snap.data());
                    initialDataSent = true;
                } else if (!initialDataSent) {
                    callback(DEFAULT_IDENTITY);
                    initialDataSent = true;
                }
            },
            (error) => {
                console.error("Identity subscription error:", error);
            }
        );
    },

    // 2. Update Field (Partial)
    updateIdentity: async (uid, data) => {
        try {
            await setDoc(getDocRef(uid), data, { merge: true });
        } catch (error) {
            console.error("Update Identity Error:", error);
        }
    },

    // 3. Update Full via Settings (termasuk AI Context)
    updateProfileSettings: async (uid, { statement, anchor, aiContext }) => {
        try {
            await setDoc(getDocRef(uid), { statement, anchor, aiContext }, { merge: true });
            toast.success("Identitas diperbarui");
        } catch (error) {
            toast.error("Gagal update identitas");
        }
    }
};