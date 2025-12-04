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
    // 1. Subscribe All Projects
    subscribeProjects: (uid, callback) => {
        const q = query(
            getCollectionRef(uid),
            where('deleted', '==', false),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    // 2. Subscribe Active Projects
    subscribeActiveProjects: (uid, callback) => {
        const q = query(
            getCollectionRef(uid),
            where('deleted', '==', false),
            where('status', '!=', 'done'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Active Projects Sub Error:", error);
        });
    },

    // 3. Tambah Project (FIX: Default ke 'progress')
    addProject: async (uid, data) => {
        return await addDoc(getCollectionRef(uid), {
            status: 'progress', // [FIX] Default masuk ke Progress
            ...data,            // Data input (bisa override status jika perlu)
            deleted: false,
            createdAt: serverTimestamp()
        });
    },

    // 4. Pindah Status (FIXED LOGIC)
    moveProject: async (uid, projectId, newStatus, projectData) => {
        const oldStatus = projectData.status;
        await updateDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, projectId), { 
            status: newStatus 
        });

        // Skenario 1: Project Selesai -> Tambah XP
        if (newStatus === 'done' && oldStatus !== 'done') {
            await addXP(uid, XP_VALUES.PROJECT_DONE, 'PROJECT_DONE', `Project Tuntas: ${projectData.name}`);
            toast.success("Project Selesai! +100 XP", { icon: '🎉' });
        }
        
        // [NEW] Skenario 2: Project Batal Selesai (Undo) -> Tarik XP
        else if (oldStatus === 'done' && newStatus !== 'done') {
            await addXP(uid, -XP_VALUES.PROJECT_DONE, 'PROJECT_UNDO', `Undo: ${projectData.name}`);
            toast("XP Dibatalkan (Project Aktif Kembali)", { icon: 'ue21a' });
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