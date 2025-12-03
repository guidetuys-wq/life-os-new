// services/trashService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, query, where, getDocs, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

// Konfigurasi koleksi yang mendukung Soft Delete
const COLLECTIONS = {
    projects: { label: 'Project', icon: 'splitscreen' },
    goals: { label: 'Goal', icon: 'flag' },
    notes: { label: 'Note', icon: 'psychology' }, // Icon psychology sesuai sidebar
    // tasks: { label: 'Task', icon: 'check_circle' } // (Opsional: Jika nanti Task mendukung soft delete)
};

export const TrashService = {
    // 1. Fetch Semua Item di Trash (Aggregation Client-Side)
    getTrashItems: async (uid) => {
        let allItems = [];
        
        // Loop setiap koleksi untuk mencari item yang dihapus
        for (const [colName, meta] of Object.entries(COLLECTIONS)) {
            const q = query(
                collection(db, 'artifacts', appId, 'users', uid, colName),
                where('deleted', '==', true)
                // Kita tidak pakai orderBy di sini untuk menghindari error composite index
                // Sorting dilakukan di JavaScript (client-side)
            );
            
            const snap = await getDocs(q);
            snap.forEach(d => {
                const data = d.data();
                allItems.push({
                    id: d.id,
                    ...data,
                    // Tambahkan metadata untuk UI
                    type: colName,
                    typeLabel: meta.label,
                    typeIcon: meta.icon,
                    // Fallback title karena tiap koleksi beda field (name vs title)
                    displayTitle: data.title || data.name || "Tanpa Judul"
                });
            });
        }

        // Sort manual by deletedAt (Terbaru di atas)
        return allItems.sort((a, b) => {
            const timeA = a.deletedAt?.seconds || 0;
            const timeB = b.deletedAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    // 2. Restore Item (Kembalikan ke Dunia Nyata)
    restoreItem: async (uid, item) => {
        const ref = doc(db, 'artifacts', appId, 'users', uid, item.type, item.id);
        await updateDoc(ref, { deleted: false });
        toast.success(`${item.typeLabel} dipulihkan`, { icon: '♻️' });
    },

    // 3. Hapus Permanen (Good Bye!)
    deletePermanently: async (uid, item) => {
        const ref = doc(db, 'artifacts', appId, 'users', uid, item.type, item.id);
        await deleteDoc(ref);
        toast.success('Dihapus permanen', { icon: '💥' });
    }
};