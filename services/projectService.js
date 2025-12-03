// services/projectService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, query, where, orderBy, limit, onSnapshot, 
    addDoc, updateDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { addXP, XP_VALUES } from '@/lib/gamification';
import toast from 'react-hot-toast';

const COLLECTION = 'projects';

const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const ProjectService = {
    // 1. Subscribe Semua Project (Untuk Halaman Projects Board)
    subscribeProjects: (uid, callback) => {
        const q = query(
            getCollectionRef(uid),
            where('deleted', '==', false), // [FIX] Gunakan == agar aman
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    // 2. Subscribe Project Aktif (Untuk Pilihan Dropdown di Dashboard)
    // Mengambil project yang statusnya BUKAN 'done' (Todo & Progress)
    subscribeActiveProjects: (uid, callback) => {
        const q = query(
            getCollectionRef(uid),
            where('deleted', '==', false), // [FIX] Gunakan ==
            where('status', '!=', 'done'), // [FIX] Satu-satunya inequality filter
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            // Jika error index muncul, cek console browser dan klik link yang diberikan Firestore
            console.error("Active Projects Query Error:", error);
        });
    },

    // 3. Tambah Project
    addProject: async (uid, data) => {
        return await addDoc(getCollectionRef(uid), {
            ...data,
            status: 'todo',
            deleted: false,
            createdAt: serverTimestamp()
        });
    },

    // 4. Pindah Status
    moveProject: async (uid, projectId, newStatus, projectData) => {
        const oldStatus = projectData.status;
        await updateDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, projectId), { 
            status: newStatus 
        });

        if (newStatus === 'done' && oldStatus !== 'done') {
            await addXP(uid, XP_VALUES.PROJECT_DONE, 'PROJECT_DONE', `Project Tuntas: ${projectData.name}`);
            toast.success("Project Selesai! +100 XP", { icon: '🎉' });
        }
    },

    // 5. Soft Delete
    deleteProject: async (uid, projectId) => {
        await updateDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, projectId), {
            deleted: true,
            deletedAt: serverTimestamp()
        });
    }
};