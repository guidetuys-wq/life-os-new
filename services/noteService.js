// services/noteService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, doc, serverTimestamp, 
    query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const COLLECTION = 'notes';

const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const NoteService = {
    // 1. Subscribe Notes (Realtime, Filter Soft Delete)
    subscribeNotes: (uid, callback) => {
        const q = query(
            getCollectionRef(uid),
            where('deleted', '!=', true), // Pastikan index composite ada jika error
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Notes Sub Error:", error);
        });
    },

    // 2. Tambah Catatan
    addNote: async (uid, data) => {
        // Validasi data sederhana
        const cleanData = {
            ...data,
            tags: Array.isArray(data.tags) ? data.tags : [], // Pastikan array
            deleted: false,
            isPinned: data.isPinned || false,
            createdAt: serverTimestamp()
        };
        await addDoc(getCollectionRef(uid), cleanData);
    },

    // 3. Update Catatan
    updateNote: async (uid, noteId, data) => {
        const noteRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, noteId);
        await updateDoc(noteRef, {
            ...data,
            updatedAt: serverTimestamp() // Baik untuk tracking edit terakhir
        });
    },

    // 4. Toggle Pin (Shortcut UX)
    togglePin: async (uid, noteId, currentStatus) => {
        const noteRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, noteId);
        await updateDoc(noteRef, { isPinned: !currentStatus });
    },

    // 5. Soft Delete
    deleteNote: async (uid, noteId) => {
        const noteRef = doc(db, 'artifacts', appId, 'users', uid, COLLECTION, noteId);
        await updateDoc(noteRef, { 
            deleted: true, 
            deletedAt: serverTimestamp() 
        });
        toast.success('Dipindahkan ke sampah', { icon: '🗑️' });
    }
};