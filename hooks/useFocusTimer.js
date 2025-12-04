// hooks/useFocusTimer.js
import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_TIME = 25 * 60; 

export function useFocusTimer(onFinish) {
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState('');
    
    // Gunakan Ref untuk menyimpan callback agar tidak memicu effect loop
    const onFinishRef = useRef(onFinish);
    useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

    // Load Project ID
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedProjectId = localStorage.getItem('focusProjectId');
            if (savedProjectId) setActiveProjectId(savedProjectId);
        }
    }, []);

    const setProject = (id) => {
        setActiveProjectId(id);
        if (id) localStorage.setItem('focusProjectId', id);
        else localStorage.removeItem('focusProjectId');
    };

    const setDuration = useCallback((seconds) => {
        setTimeLeft(seconds);
        setIsRunning(false);
        localStorage.removeItem('timerTarget'); 
    }, []);

    // Load Timer State
    useEffect(() => {
        const savedTarget = localStorage.getItem('timerTarget');
        if (savedTarget) {
            const left = Math.ceil((parseInt(savedTarget) - Date.now()) / 1000);
            if (left > 0) {
                setTimeLeft(left);
                setIsRunning(true);
            } else {
                localStorage.removeItem('timerTarget');
                setTimeLeft(DEFAULT_TIME);
            }
        }
    }, []);

    // Core Timer Logic (Optimized)
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            if (!localStorage.getItem('timerTarget')) {
                const target = Date.now() + (timeLeft * 1000);
                localStorage.setItem('timerTarget', target.toString());
            }

            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Panggil ref current agar aman
                        setIsRunning(false);
                        localStorage.removeItem('timerTarget');
                        if (onFinishRef.current) onFinishRef.current();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (!isRunning && timeLeft !== 0) {
            localStorage.removeItem('timerTarget');
        }
        return () => clearInterval(interval);
    }, [isRunning]); // Hapus timeLeft dari dependency agar tidak re-subscribe tiap detik

    const toggleTimer = () => setIsRunning(!isRunning);
    
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(DEFAULT_TIME);
        localStorage.removeItem('timerTarget');
    };

    const formattedTime = () => {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return { 
        timeLeft, isRunning, toggleTimer, resetTimer, setDuration, formattedTime,
        activeProjectId, setProject 
    };
}