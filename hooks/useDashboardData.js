// hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { IdentityService } from '@/services/identityService';
import { ProjectService } from '@/services/projectService';
import { TaskService } from '@/services/taskService';
import { FinanceService } from '@/services/financeService';

export function useDashboardData(user) {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ xp: 0, level: 1 });
    const [finance, setFinance] = useState({ balance: 0 });
    const [activeTasks, setActiveTasks] = useState([]);
    
    // [NEW] Daftar semua project aktif yang bisa dipilih user
    const [projectCandidates, setProjectCandidates] = useState([]);
    
    const [identityData, setIdentityData] = useState({ 
        statement: '', 
        anchor: '', 
        focus: { slot1: '', slot2: '', slot3: '' } // Menyimpan ID project yang dipilih
    });

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);

        // 1. Profile Stats
        const unsubStats = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'profile'), (d) => {
            if (d.exists()) setStats(d.data());
        });

        // 2. Finance
        const unsubFinance = FinanceService.subscribeStats(user.uid, setFinance);

        // 3. Identity & Fokus
        const unsubIdentity = IdentityService.subscribeIdentity(user.uid, (data) => {
            setIdentityData({
                statement: data.statement || 'Aku adalah orang yang selalu kembali ke sistemku sendiri.',
                anchor: data.anchor || 'Kembali lebih penting dari kemajuan.',
                focus: data.focus || { slot1: '', slot2: '', slot3: '' }
            });
        });

        // 4. Tasks
        const unsubTasks = TaskService.subscribeToActiveTasks(user.uid, setActiveTasks);

        // 5. Projects (Ambil SEMUA yang aktif untuk pilihan)
        const unsubProjects = ProjectService.subscribeActiveProjects(user.uid, setProjectCandidates);

        const timer = setTimeout(() => setIsLoading(false), 500);

        return () => {
            unsubStats(); unsubFinance(); unsubIdentity();
            unsubTasks(); unsubProjects();
            clearTimeout(timer);
        };
    }, [user]);

    return { 
        isLoading, stats, finance, activeTasks, 
        projectCandidates, // List project untuk dropdown
        identityData, setIdentityData 
    };
}