// services/trashService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, query, where, getDocs, doc, updateDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

// Konfigurasi koleksi (Sama seperti sebelumnya)
const COLLECTIONS = {
    projects: { label: 'Project', icon: 'splitscreen' },
    goals: { label: 'Goal', icon: 'flag' },
    notes: { label: 'Note', icon: 'psychology' }, 
};

export const TrashService = {
    // 1. Fetch Semua Item (Tetap sama)
    getTrashItems: async (uid) => {
        let allItems = [];
        for (const [colName, meta] of Object.entries(COLLECTIONS)) {
            const q = query(
                collection(db, 'artifacts', appId, 'users', uid, colName),
                where('deleted', '==', true)
            );
            const snap = await getDocs(q);
            snap.forEach(d => {
                const data = d.data();
                allItems.push({
                    id: d.id,
                    ...data,
                    type: colName,
                    typeLabel: meta.label,
                    typeIcon: meta.icon,
                    displayTitle: data.title || data.name || "Tanpa Judul"
                });
            });
        }
        return allItems.sort((a, b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0));
    },

    // 2. Restore Item (Tetap sama)
    restoreItem: async (uid, item) => {
        const ref = doc(db, 'artifacts', appId, 'users', uid, item.type, item.id);
        await updateDoc(ref, { deleted: false });
        toast.success(`${item.typeLabel} dipulihkan`, { icon: '♻️' });
    },

    // 3. Hapus Permanen Satu Item (Tetap sama)
    deletePermanently: async (uid, item) => {
        const ref = doc(db, 'artifacts', appId, 'users', uid, item.type, item.id);
        await deleteDoc(ref);
        toast.success('Dihapus permanen', { icon: '💥' });
    },

    // 4. [NEW] Hapus Semua (Empty Trash)
    emptyTrash: async (uid, items) => {
        // Kita gunakan Promise.all untuk parallel delete (lebih cepat dari loop biasa)
        // Note: Jika item > 500, sebaiknya pakai chunking / writeBatch, tapi untuk trash ini cukup aman.
        const promises = items.map(item => {
            const ref = doc(db, 'artifacts', appId, 'users', uid, item.type, item.id);
            return deleteDoc(ref);
        });
        
        await Promise.all(promises);
        toast.success('Tempat sampah dikosongkan!', { icon: '🧹' });
    }
};