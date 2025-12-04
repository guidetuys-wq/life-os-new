'use client';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';

export default function SwipeableItem({ children, onSwipeLeft, onSwipeRight, leftColor = 'bg-emerald-500', rightColor = 'bg-rose-500', leftIcon = 'check', rightIcon = 'delete' }) {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-100, -50, 0, 50, 100], [1, 0.5, 0, 0.5, 1]);
    const [isSwiping, setIsSwiping] = useState(false);

    const handleDragEnd = (event, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset < -100 || (offset < -50 && velocity < -500)) {
            // Swipe Kiri (Biasanya Delete)
            if (onSwipeLeft) onSwipeLeft();
        } else if (offset > 100 || (offset > 50 && velocity > 500)) {
            // Swipe Kanan (Biasanya Complete/Archive)
            if (onSwipeRight) onSwipeRight();
        }
        
        setIsSwiping(false);
    };

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Background Layer (Actions) */}
            <div className="absolute inset-0 flex justify-between items-center px-4 z-0">
                <div className={`absolute left-0 top-0 bottom-0 w-full ${leftColor} flex items-center justify-start pl-4 transition-opacity`} style={{ opacity: x.get() > 0 ? 1 : 0 }}>
                    <span className="material-symbols-rounded text-white font-bold text-xl">{leftIcon}</span>
                </div>
                <div className={`absolute right-0 top-0 bottom-0 w-full ${rightColor} flex items-center justify-end pr-4 transition-opacity`} style={{ opacity: x.get() < 0 ? 1 : 0 }}>
                    <span className="material-symbols-rounded text-white font-bold text-xl">{rightIcon}</span>
                </div>
            </div>

            {/* Foreground Layer (Content) */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Snap back
                style={{ x }}
                onDragStart={() => setIsSwiping(true)}
                onDragEnd={handleDragEnd}
                className={`relative z-10 bg-slate-900/90 border-b border-slate-800/50 ${isSwiping ? 'cursor-grabbing' : 'cursor-grab'}`}
                whileTap={{ cursor: 'grabbing' }}
            >
                {children}
            </motion.div>
        </div>
    );
}