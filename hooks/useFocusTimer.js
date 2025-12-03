// hooks/useFocusTimer.js
import { useState, useEffect, useCallback } from 'react';

const DEFAULT_TIME = 25 * 60; // 25 Menit

export function useFocusTimer(onFinish) {
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isRunning, setIsRunning] = useState(false);

    // Load state saat mount
    useEffect(() => {
        const savedTarget = localStorage.getItem('timerTarget');
        if (savedTarget) {
            const left = Math.ceil((parseInt(savedTarget) - Date.now()) / 1000);
            if (left > 0) {
                setTimeLeft(left);
                setIsRunning(true);
            } else {
                localStorage.removeItem('timerTarget');
            }
        }
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            // Sync target di localStorage
            if (!localStorage.getItem('timerTarget')) {
                const target = Date.now() + (timeLeft * 1000);
                localStorage.setItem('timerTarget', target.toString());
            }

            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleFinish();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (!isRunning) {
            localStorage.removeItem('timerTarget');
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleFinish = useCallback(() => {
        setIsRunning(false);
        localStorage.removeItem('timerTarget');
        if (onFinish) onFinish();
    }, [onFinish]);

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(DEFAULT_TIME);
        localStorage.removeItem('timerTarget');
    };

    // Helper format waktu MM:SS
    const formattedTime = () => {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return { timeLeft, isRunning, toggleTimer, resetTimer, formattedTime };
}