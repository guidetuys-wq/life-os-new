// services/taskService.js
import { db, appId } from '@/lib/firebase';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
    query, where, orderBy, onSnapshot 
} from 'firebase/firestore';
import { addXP, XP_VALUES } from '@/lib/gamification';

const COLLECTION = 'tasks';

// Helper untuk mendapatkan referensi koleksi user spesifik
const getCollectionRef = (uid) => collection(db, 'artifacts', appId, 'users', uid, COLLECTION);

export const TaskService = {
  // 1. Tambah Task Baru
  addTask: async (uid, text, priority = 'normal', projectId = '') => {
    const docRef = await addDoc(getCollectionRef(uid), {
      text,
      completed: false,
      priority,
      projectId, // Bisa kosong atau ID project
      createdAt: serverTimestamp(),
      isAiGenerated: false
    });
    // Reward XP kecil untuk capture
    await addXP(uid, 2, 'TASK_ADDED', 'Task Capture');
    return docRef;
  },

  // 2. Tandai Selesai (Complete)
  completeTask: async (uid, taskId, taskText) => {
    await updateDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, taskId), {
      completed: true,
      completedAt: serverTimestamp()
    });
    // Reward XP Besar
    await addXP(uid, XP_VALUES.TASK_COMPLETE, 'TASK_COMPLETED', `Selesai: ${taskText}`);
  },

  // 3. Update Properti Task (Text, Priority, dll)
  updateTask: async (uid, taskId, data) => {
    await updateDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, taskId), data);
  },

  // 4. Hapus Task Permanen
  deleteTask: async (uid, taskId) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', uid, COLLECTION, taskId));
  },

  // 5. Listener: Hanya Task Aktif (Untuk Dashboard/Inbox)
  // Mengambil task yang BELUM selesai
  subscribeToActiveTasks: (uid, callback) => {
    const q = query(
        getCollectionRef(uid),
        where('completed', '==', false),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    }, (error) => {
        console.error("Active Tasks Sub Error:", error);
    });
  },

  // 6. Listener: SEMUA Task (Untuk Project Board)
  // Diperlukan untuk menghitung progress bar (Total vs Done)
  subscribeAllTasks: (uid, callback) => {
    const q = query(
        getCollectionRef(uid),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
    }, (error) => {
        console.error("All Tasks Sub Error:", error);
    });
  }
};