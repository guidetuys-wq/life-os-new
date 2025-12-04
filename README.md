# 🧬 Life OS — Personal Control & Clarity

`Life OS` adalah dasbor produktivitas all-in-one untuk mengelola pekerjaan (Focus Zone) dan keseimbangan hidup (Life Zone). Aplikasi ini memadukan task management, habit tracking, finance, dan note-taking dengan elemen gamifikasi dan integrasi AI.

![Life OS Dashboard Preview](public/window.svg)

**Ringkasan singkat**
- **Fokus**: Task, Projects (Kanban), Focus Timer (Pomodoro)
- **Hidup**: Finance manager, Habit tracker, Wellness, Notes (Second Brain)
- **Ekstra**: Gamification (XP/level), AI features (Magic Plan, Chat with Brain)

---

**✨ Fitur Utama**
- **Smart Inbox & AI Refine**: Tangkap ide cepat, gunakan AI untuk mengubah ide menjadi task terstruktur.
- **Magic Plan (AI)**: Pecah judul proyek menjadi langkah konkret (Server-side AI).
- **Kanban**: Board drag & drop untuk proyek dan task (`@dnd-kit`).
- **Focus Timer**: Pomodoro yang terintegrasi dengan task dan persistensi state.
- **Finance Manager**: Catat transaksi, saldo terakumulasi dengan akurasi.
- **Second Brain**: Notes + Chat via AI (RAG) untuk meng-query koleksi catatan Anda.
- **Habit & Wellness**: Pelacakan kebiasaan dan mood.

---

**🛠️ Teknologi (Tech Stack)**
- **Framework**: `Next.js` (App Router, Server Actions)
- **Language**: `JavaScript` / `React`
- **Database & Auth**: `Firebase` (Firestore, Auth)
- **Styling**: `Tailwind CSS`
- **AI**: Mistral AI (dipanggil dari Server Actions / server-side only)
- **Lib tambahan**: `@dnd-kit`, `react-hot-toast`, `chart.js`

---

**Struktur penting proyek** (root)
- `app/` : Pages (Next.js App Router) dan server actions
- `components/` : UI & composite components
- `actions/` : Server-side action helpers (AI planner, second-brain actions)
- `lib/` : utilitas, `firebase.js`, `db.js`, `confetti.js`, dll.
- `services/` : business logic per-domain (finance, notes, projects, habits)
- `public/` : static assets (gambar, ikon)

---

**🚀 Menjalankan secara lokal**
1. Pasang dependensi:
```pwsh
npm install
```
2. Siapkan variabel lingkungan. Buat file `.env.local` di root dan tambahkan minimal konfigurasi Firebase dan kunci server AI (contoh):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
MISTRAL_API_KEY=your_mistral_api_key
```

> Catatan: `MISTRAL_API_KEY` hanya digunakan server-side via Server Actions; jangan menaruhnya di `NEXT_PUBLIC_`.

3. Jalankan development server:
```pwsh
npm run dev
```

4. Build dan jalankan production:
```pwsh
npm run build
npm run start
```

---

**File & lokasi penting**
- **AI / actions**: `actions/` — server-side helpers untuk planner dan second-brain.
- **Firebase init**: `lib/firebase.js` — konfigurasi SDK dan helper auth.
- **Database helpers**: `lib/db.js` — fungsi akses Firestore.
- **Services**: `services/` — domain logic (financeService, noteService, dll.).

---

**Pengembangan & kontribusi**
- Ikuti pola komponen di `components/` dan `ui/` untuk konsistensi.
- Letakkan logic server-side sensitif (panggilan AI, kunci) pada server actions atau API routes.

---

Butuh bantuan lebih lanjut? Minta saya untuk:
- Menambahkan contoh `.env.local` yang lebih lengkap
- Menambahkan instruksi deploy (Vercel / Firebase Hosting)
- Memperjelas bagian arsitektur (RAG, gamification, atau sync timer)

Terima kasih telah membuka proyek — siap bantu lanjutan!