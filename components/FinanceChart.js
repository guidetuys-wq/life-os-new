'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FinanceChart({ transactions }) {
    
    // Logika Pengelompokan Data
    const chartData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};

        expenses.forEach(t => {
            // Jika tidak ada kategori, masukkan ke 'Lainnya'
            const cat = t.category || 'General';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        // Warna-warni Chart
        const bgColors = [
            'rgba(244, 63, 94, 0.7)',   // Rose
            'rgba(59, 130, 246, 0.7)',  // Blue
            'rgba(16, 185, 129, 0.7)',  // Emerald
            'rgba(245, 158, 11, 0.7)',  // Amber
            'rgba(139, 92, 246, 0.7)',  // Violet
            'rgba(100, 116, 139, 0.7)', // Slate
        ];

        return {
            labels,
            datasets: [
                {
                    label: 'Pengeluaran',
                    data,
                    backgroundColor: bgColors,
                    borderColor: 'rgba(15, 23, 42, 1)', // Border warna background app agar menyatu
                    borderWidth: 2,
                },
            ],
        };
    }, [transactions]);

    // Opsi Tampilan
    const options = {
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#94a3b8', // Slate-400
                    font: { family: 'Inter', size: 10 },
                    boxWidth: 10
                }
            }
        },
        cutout: '70%', // Membuat lubang tengah (Donut)
        responsive: true,
        maintainAspectRatio: false,
    };

    if (transactions.filter(t => t.type === 'expense').length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-slate-600 text-xs italic">
                Belum ada data pengeluaran.
            </div>
        );
    }

    return (
        <div className="h-40 relative">
            <Doughnut data={chartData} options={options} />
            {/* Teks Tengah (Opsional) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="material-symbols-rounded text-slate-700 text-4xl opacity-50">pie_chart</span>
            </div>
        </div>
    );
}