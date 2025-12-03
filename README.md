# 🧬 Life OS - Personal Control & Clarity

**Life OS** adalah aplikasi dasbor produktivitas terpadu yang dirancang untuk membantu Anda mengelola pekerjaan (*Focus Zone*) dan keseimbangan hidup (*Life Zone*) dalam satu tempat. Dibangun dengan teknologi web modern, aplikasi ini menggabungkan manajemen tugas, keuangan, dan catatan dengan elemen **Gamifikasi** dan kecerdasan buatan (**AI**) untuk membuat produktivitas menjadi menyenangkan.

![Life OS Dashboard Preview](public/window.svg) ## ✨ Fitur Utama

### 🎯 Focus & Productivity (Zona Kerja)
* **Gamification Engine**: Dapatkan **XP** setiap kali menyelesaikan Task, Habit, atau Project. Naik level dan pantau progres Anda layaknya karakter game RPG.
* **Smart Inbox**: Tangkap ide dengan cepat. Gunakan **AI Refine** untuk mengubah ide mentah menjadi task yang *SMART* (Spesifik & Actionable).
* **Projects Board (Kanban)**: Kelola proyek dengan tampilan Kanban *Drag & Drop*. Gunakan fitur **Magic Plan** (AI) untuk memecah judul proyek menjadi langkah-langkah konkret secara otomatis.
* **Focus Timer**: Timer fokus (Pomodoro) yang terintegrasi dengan Task. Timer tetap berjalan di latar belakang meskipun halaman di-refresh (*Persistence*).
* **Life Goals**: Tetapkan visi jangka panjang dengan progress bar visual.

### 🧘 Life Balance (Zona Hidup)
* **Finance Manager**: Catat pemasukan dan pengeluaran. Saldo dihitung secara *real-time* dan akurat dengan sistem *Atomic Transactions*.
* **Second Brain (Notes)**: Simpan catatan dan ide. Fitur **Chat with Brain** memungkinkan Anda bertanya kepada AI tentang isi catatan Anda sendiri (RAG System).
* **Habit Tracker**: Bangun kebiasaan positif dengan *Heatmap* visual 7 hari terakhir.
* **Wellness Tracker**: Pantau hidrasi harian dan suasana hati (Mood).
* **Library**: Manajemen koleksi buku, kursus, dan film.

### 🛡️ System & Security
* **Secure AI Integration**: Integrasi Mistral AI menggunakan **Server Actions** sehingga API Key aman dan tidak terekspos ke klien.
* **Trash (Soft Delete)**: Data yang dihapus masuk ke "Tempat Sampah" terlebih dahulu dan bisa dipulihkan (*Restore*).
* **Optimized Stats**: Perhitungan statistik menggunakan *Firestore Aggregation* untuk performa tinggi dan biaya rendah.

---

## 🛠️ Teknologi (Tech Stack)

* **Framework**: [Next.js 14+](https://nextjs.org/) (App Router, Server Actions)
* **Language**: JavaScript / React
* **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **AI Model**: [Mistral AI](https://mistral.ai/) (via SDK)
* **Icons**: Google Material Symbols Rounded
* **Utilities**: `react-hot-toast` (Notifikasi), `@dnd-kit` (Drag & Drop), `chart.js` (Visualisasi Data).

---

## 🚀 Cara Menjalankan (Getting Started)

Ikuti langkah ini untuk menjalankan proyek di komputer lokal Anda.

### 1. Clone Repository
```bash
git clone [https://github.com/username/life-os.git](https://github.com/username/life-os.git)
cd life-os