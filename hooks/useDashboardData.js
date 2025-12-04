// hooks/useDashboardData.js (FIXED - No Infinite Loop)

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
    const [projectCandidates, setProjectCandidates] = useState([]);
    
    const [identityData, setIdentityData] = useState({ 
        statement: '', 
        anchor: '', 
        focus: { slot1: '', slot2: '', slot3: '' }
    });

    // ✅ FIX: Separate effect for data subscriptions
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // 1. Profile Stats
        const unsubStats = onSnapshot(
            doc(db, 'artifacts', appId, 'users', user.uid, 'stats', 'profile'),
            (d) => {
                if (d.exists()) setStats(d.data());
            },
            (error) => {
                console.error('Error loading stats:', error);
            }
        );

        // 2. Finance
        const unsubFinance = FinanceService.subscribeStats(user.uid, (data) => {
            setFinance(data || { balance: 0 });
        });

        // 3. Identity & Focus
        const unsubIdentity = IdentityService.subscribeIdentity(user.uid, (data) => {
            setIdentityData({
                statement: data?.statement || 'Aku adalah orang yang selalu kembali ke sistemku sendiri.',
                anchor: data?.anchor || 'Kembali lebih penting dari kemajuan.',
                focus: data?.focus || { slot1: '', slot2: '', slot3: '' }
            });
        });

        // 4. Tasks
        const unsubTasks = TaskService.subscribeToActiveTasks(user.uid, (tasks) => {
            setActiveTasks(tasks || []);
        });

        // 5. Projects (All active for selection)
        const unsubProjects = ProjectService.subscribeActiveProjects(user.uid, (projects) => {
            setProjectCandidates(projects || []);
        });

        const timer = setTimeout(() => setIsLoading(false), 500);

        return () => {
            unsubStats();
            unsubFinance();
            unsubIdentity();
            unsubTasks();
            unsubProjects();
            clearTimeout(timer);
        };
    }, [user]); // ✅ ONLY user dependency, no identityData.focus!

    // ✅ Computed value for active projects (no effect needed)
    const activeProjects = projectCandidates.filter(p => 
        Object.values(identityData.focus || {}).includes(p.id)
    );

    return { 
        isLoading,
        stats,
        finance,
        activeTasks,
        activeProjects, // ✅ Now computed, not state
        projectCandidates,
        identityData,
        setIdentityData
    };
}
