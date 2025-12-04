'use client';
import { useMemo, memo, useRef } from 'react'; // [NEW] useRef
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2'; // [NEW] getElementAtEvent

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
    '#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#ec4899', '#6366f1', '#84cc16', '#64748b',
];

// [UPDATE] Terima props onCategoryClick
const FinanceChart = ({ transactions, onCategoryClick }) => {
    const chartRef = useRef(null); // [NEW] Ref untuk akses instance chart

    const { chartData, totalExpense, categories } = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};
        let total = 0;

        expenses.forEach(t => {
            const cat = t.category || 'General';
            const amount = Number(t.amount);
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
            total += amount;
        });

        const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
        const labels = sorted.map(([name]) => name);
        const data = sorted.map(([, amount]) => amount);
        const backgroundColor = labels.map((_, i) => PALETTE[i % PALETTE.length]);

        return {
            totalExpense: total,
            categories: labels, // Simpan urutan kategori untuk mapping klik
            chartData: {
                labels,
                datasets: [{
                    label: 'Pengeluaran',
                    data,
                    backgroundColor,
                    borderColor: 'rgba(15, 23, 42, 1)',
                    borderWidth: 2,
                    hoverOffset: 8 // Efek hover lebih besar
                }],
            }
        };
    }, [transactions]);

    const options = useMemo(() => ({
        plugins: {
            legend: { 
                position: 'right', 
                labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 }, usePointStyle: true, boxWidth: 6 } 
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const percentage = ((value / totalExpense) * 100).toFixed(1);
                        return ` Rp ${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event) => {
            // [NEW] Logic Click Handler
            if (!chartRef.current) return;
            const elements = getElementAtEvent(chartRef.current, event);
            
            if (elements.length > 0) {
                const index = elements[0].index;
                const category = categories[index];
                if (onCategoryClick) onCategoryClick(category);
            } else {
                // Klik di luar donat = Reset filter
                if (onCategoryClick) onCategoryClick(null);
            }
        }
    }), [totalExpense, categories, onCategoryClick]);

    if (totalExpense === 0) {
        return (
            <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-60">
                <span className="material-symbols-rounded text-3xl mb-1">data_usage</span>
                <span className="text-[10px] italic">Belum ada data</span>
            </div>
        );
    }

    return (
        <div className="h-40 relative group cursor-pointer">
            <Doughnut ref={chartRef} data={chartData} options={options} />
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold opacity-60">Total Expense</span>
                <span className="text-xs font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                    {new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(totalExpense)}
                </span>
            </div>
        </div>
    );
};

export default memo(FinanceChart);