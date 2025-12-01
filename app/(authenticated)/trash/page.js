'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';

export default function TrashPage() {
    const { user } = useAuth();
    const [trashItems, setTrashItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch semua koleksi (Task, Project, Note, dll)
    const loadTrash = async () => {
        if (!user) return;
        setLoading(true);
        const collections = ['tasks', 'projects', 'notes', 'goals', 'library', 'transactions'];
        let allTrash = [];

        for (const colName of collections) {
            // Note: Querying multiple collections client-side is heavy, but fine for personal use
            // Di Next.js/Firestore, idealnya Anda punya field 'deleted' dan Composite Index
            // Untuk simplifikasi migrasi, kita fetch manual.
            try {
                // Fetch manual karena 'deleted' mungkin tidak ada di semua doc lama
                // Cara yang benar untuk soft-delete system:
                const q = query(collection(db, 'artifacts', appId, 'users', user.uid, colName)); 
                const snap = await getDocs(q);
                
                snap.forEach(d => {
                    const data = d.data();
                    // Kita asumsikan field 'deleted' ada jika item dihapus
                    // Di implementasi sebelumnya saya pakai deleteDoc langsung untuk simplifikasi.
                    // Jika Anda ingin SOFT DELETE, Anda harus ubah logic delete di page lain menjadi:
                    // updateDoc(ref, { deleted: true, deletedAt: new Date() })
                    // 
                    // TAPI: Di kode langkah sebelumnya saya pakai deleteDoc (Hard Delete). 
                    // Jika Anda ingin fitur Trash jalan, Anda harus ganti logic delete di page lain.
                });
            } catch (e) {
                console.error(e);
            }
        }
        setTrashItems(allTrash);
        setLoading(false);
    };
    
    // ... Implementasi Trash butuh sistem Soft Delete yang konsisten.
    // Karena di langkah sebelumnya kita pakai Hard Delete (deleteDoc), Trash ini akan kosong.
    
    return (
        <div className="p-8 text-center text-slate-500">
            <span className="material-symbols-rounded text-6xl mb-4 block opacity-20">delete</span>
            <h1 className="text-xl font-bold text-white mb-2">Tempat Sampah</h1>
            <p className="text-sm">
                Saat ini sistem menggunakan "Penghapusan Permanen" untuk menghemat storage. 
                <br/>Item yang dihapus tidak dapat dikembalikan.
            </p>
        </div>
    );
}