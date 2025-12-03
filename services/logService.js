// services/logService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, query, orderBy, limit, onSnapshot 
} from 'firebase/firestore';

const COLLECTION = 'logs';
const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const LogService = {
    // Subscribe Logs (Realtime)
    subscribeLogs: (uid, limitCount = 50, callback) => {
        const q = query(
            getCollectionRef(uid), 
            orderBy('createdAt', 'desc'), 
            limit(limitCount)
        );
        
        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(data);
        }, (error) => {
            console.error("Log Sub Error:", error);
        });
    }
};