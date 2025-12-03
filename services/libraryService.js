// services/libraryService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, 
    serverTimestamp, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const COLLECTION = 'library';

const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const LibraryService = {
    // 1. Subscribe Library Items
    subscribeLibrary: (uid, callback) => {
        const q = query(getCollectionRef(uid), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Library Sub Error:", error);
        });
    },

    // 2. Tambah Item Baru
    addItem: async (uid, data) => {
        const cleanData = {
            ...data,
            rating: parseInt(data.rating || 0),
            createdAt: serverTimestamp()
        };
        await addDoc(getCollectionRef(uid), cleanData);
        toast.success("Item ditambahkan ke Library!", { icon: '📚' });
    },

    // 3. Update Item (Status, Rating, Review)
    updateItem: async (uid, itemId, data) => {
        const itemRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, itemId);
        await updateDoc(itemRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    // 4. Update Status Cepat (Shortcut)
    updateStatus: async (uid, itemId, newStatus) => {
        const itemRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, itemId);
        await updateDoc(itemRef, { status: newStatus });
        toast.success(`Status: ${newStatus.toUpperCase()}`);
    },

    // 5. Hapus Item (Permanen)
    deleteItem: async (uid, itemId) => {
        const itemRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, itemId);
        await deleteDoc(itemRef);
        toast.success('Item dihapus dari koleksi');
    }
};