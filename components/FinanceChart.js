'use client';
import { useMemo, memo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Palet warna yang sesuai dengan tema Dark Mode (Slate-950)
const PALETTE = [
    '#f43f5e', // Rose-500
    '#3b82f6', // Blue-500
    '#10b981', // Emerald-500
    '#f59e0b', // Amber-500
    '#8b5cf6', // Violet-500
    '#06b6d4', // Cyan-500
    '#ec4899', // Pink-500
    '#6366f1', // Indigo-500
    '#84cc16', // Lime-500
    '#64748b', // Slate-500
];

const FinanceChart = ({ transactions }) => {
    
    // 1. Data Transformation (Memoized)
    const { chartData, totalExpense } = useMemo(() => {
        // Filter Expense sekali saja
        const expenses = transactions.filter(t => t.type === 'expense');
        
        // Grouping
        const categoryTotals = {};
        let total = 0;

        expenses.forEach(t => {
            const cat = t.category || 'General';
            const amount = Number(t.amount);
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
            total += amount;
        });

        // Sorting: Kategori terbesar di awal
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);

        const labels = sortedCategories.map(([name]) => name);
        const data = sortedCategories.map(([, amount]) => amount);
        
        // Warna dinamis (Cycle through palette)
        const backgroundColor = labels.map((_, i) => PALETTE[i % PALETTE.length]);

        return {
            totalExpense: total,
            chartData: {
                labels,
                datasets: [{
                    label: 'Pengeluaran',
                    data,
                    backgroundColor,
                    borderColor: 'rgba(15, 23, 42, 1)', // Slate-950 (Background App)
                    borderWidth: 2,
                    hoverOffset: 4
                }],
            }
        };
    }, [transactions]);

    // 2. Opsi Chart (Memoized static)
    const options = useMemo(() => ({
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#94a3b8', // Slate-400
                    font: { family: 'Inter', size: 10 },
                    usePointStyle: true,
                    boxWidth: 6
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const percentage = ((value / totalExpense) * 100).toFixed(1);
                        return ` Rp ${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '75%', // Lebih tipis agar terlihat modern
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 }
    }), [totalExpense]);

    // 3. Render Empty State
    if (totalExpense === 0) {
        return (
            <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-60">
                <span className="material-symbols-rounded text-3xl mb-1">data_usage</span>
                <span className="text-[10px] italic">Belum ada pengeluaran</span>
            </div>
        );
    }

    return (
        <div className="h-40 relative group cursor-default">
            <Doughnut data={chartData} options={options} />
            
            {/* Center Text (Total / Icon) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-50">Total</span>
                <span className="text-xs font-mono font-bold text-white opacity-80 group-hover:text-blue-400 transition-colors">
                    {/* Format Short: 2.5jt */}
                    {new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(totalExpense)}
                </span>
            </div>
        </div>
    );
};

// Bungkus memo agar tidak re-render jika parent update tapi transactions sama
export default memo(FinanceChart);