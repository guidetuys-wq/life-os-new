'use server';

import { Mistral } from "@mistralai/mistralai";
import { db, appId } from '@/lib/firebase';
import { 
  collection, query, getDocs, where, orderBy, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// --- 1. TOOL HELPERS (Expanded) ---

async function createQuickTask(uid, taskName) {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'tasks'), {
            text: taskName, completed: false, priority: 'normal', projectId: '', createdAt: serverTimestamp(), isAiGenerated: true
        });
        return JSON.stringify({ status: "success", message: `Task '${taskName}' masuk Inbox.` });
    } catch (e) { return JSON.stringify({ status: "error", message: e.message }); }
}

async function logExpense(uid, amount, category, note) {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'transactions'), {
            amount: Number(amount), type: 'expense', category: category || 'General', note: note || 'AI Entry', createdAt: serverTimestamp()
        });
        return JSON.stringify({ status: "success", message: `Expense Rp${amount} (${category}) tercatat.` });
    } catch (e) { return JSON.stringify({ status: "error", message: e.message }); }
}

// [NEW] Tool: Tambah ke Library
async function addToLibrary(uid, title, type, rating) {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'library'), {
            title, type: type || 'book', status: 'done', rating: Number(rating) || 0, createdAt: serverTimestamp()
        });
        return JSON.stringify({ status: "success", message: `Item '${title}' masuk Library.` });
    } catch (e) { return JSON.stringify({ status: "error", message: e.message }); }
}

// [NEW] Tool: Simpan Catatan (Insight)
async function saveNote(uid, title, content, tags) {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'notes'), {
            title, content, tags: tags ? tags.split(',') : ['ai-generated'], color: 'blue', isPinned: false, deleted: false, createdAt: serverTimestamp()
        });
        return JSON.stringify({ status: "success", message: `Catatan '${title}' disimpan.` });
    } catch (e) { return JSON.stringify({ status: "error", message: e.message }); }
}

// --- 2. TOOL DEFINITIONS ---
const tools = [
    {
        type: "function",
        function: {
            name: "createQuickTask",
            description: "Buat task/tugas baru di Inbox.",
            parameters: { type: "object", properties: { taskName: { type: "string" } }, required: ["taskName"] },
        },
    },
    {
        type: "function",
        function: {
            name: "logExpense",
            description: "Catat pengeluaran keuangan.",
            parameters: {
                type: "object",
                properties: {
                    amount: { type: "number" },
                    category: { type: "string", enum: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'General'] },
                    note: { type: "string" },
                },
                required: ["amount"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "addToLibrary",
            description: "Simpan buku, film, atau kursus yang sudah diselesaikan ke Library.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    type: { type: "string", enum: ['book', 'movie', 'course', 'article'] },
                    rating: { type: "number", description: "Rating 1-5 (opsional)" },
                },
                required: ["title"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "saveNote",
            description: "Simpan ide penting, ringkasan, atau insight percakapan menjadi Catatan (Second Brain).",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    content: { type: "string", description: "Isi catatan lengkap (bisa Markdown)" },
                    tags: { type: "string", description: "Tags dipisah koma (cth: ide, penting)" },
                },
                required: ["title", "content"],
            },
        },
    }
];

// --- 3. MAIN ACTION ---

// --- 3. MAIN ACTION (UPDATED) ---

export async function chatWithNotesAction(uid, question) {
  // 1. Cek API Key
  if (!process.env.MISTRAL_API_KEY) return "AI System Offline (Check API Key).";

  try {
    // A. FETCH HOLISTIC CONTEXT (Parallel Fetching)
    // Kita ambil snapshot data dari berbagai modul untuk memberi AI "Mata Tuhan"
    // Menggunakan import() dinamis untuk 'doc' dan 'getDoc' agar tidak perlu ubah import di atas
    const firestore = await import('firebase/firestore');
    
    const [notesSnap, projectsSnap, goalsSnap, habitsSnap, financeSnap, identitySnap] = await Promise.all([
      // 1. Notes (10 Terakhir)
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'notes'), orderBy('createdAt', 'desc'), limit(10))),
      // 2. Active Projects
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'projects'), where('status', '!=', 'done'))),
      // 3. Life Goals
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'goals'), where('deleted', '!=', true))),
      // 4. Habits
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'habits'))), 
      // 5. Finance Stats
      firestore.getDoc(firestore.doc(db, 'artifacts', appId, 'users', uid, 'stats', 'finance')),
      // 6. Identity & AI Context [NEW]
      firestore.getDoc(firestore.doc(db, 'artifacts', appId, 'users', uid, 'personal', 'identity'))
    ]);

    // B. CONSTRUCT CONTEXT STRING
    let contextText = "=== SYSTEM CONTEXT ===\n";

    // [NEW] Inject Personal Context (Priority High)
    if (identitySnap.exists()) {
        const idData = identitySnap.data();
        if (idData.aiContext) {
            contextText += `\n[TENTANG USER (PENTING!)]\n${idData.aiContext}\n`;
            contextText += `(Gunakan informasi di atas untuk menyesuaikan nada bicara dan sudut pandang saran Anda)\n`;
        }
        if (idData.anchor) contextText += `Prinsip Hidup User: "${idData.anchor}"\n`;
    }

    // Goals
    if (!goalsSnap.empty) {
        contextText += "\n[LIFE GOALS]\n";
        goalsSnap.forEach(d => contextText += `- ${d.data().title} (${d.data().area}): ${d.data().progress}%\n`);
    }

    // Projects
    if (!projectsSnap.empty) {
        contextText += "\n[ACTIVE PROJECTS]\n";
        projectsSnap.forEach(d => contextText += `- ${d.data().name}\n`);
    }

    // Habits
    if (!habitsSnap.empty) {
        contextText += "\n[HABITS TRACKER]\n";
        habitsSnap.forEach(d => {
            const h = d.data();
            // Hitung streak sederhana (jumlah true di history)
            const streak = h.history ? Object.keys(h.history).length : 0;
            contextText += `- ${h.name}: ${streak} hari tercentang\n`;
        });
    }

    // Finance
    if (financeSnap.exists()) {
        const f = financeSnap.data();
        contextText += `\n[FINANCE]\n- Balance: Rp${f.balance}\n- Expense: Rp${f.expense}\n`;
    }

    // Recent Notes
    if (!notesSnap.empty) {
        contextText += "\n[RECENT NOTES]\n";
        notesSnap.forEach(d => contextText += `- [${d.data().title}]: ${d.data().content.substring(0, 150)}...\n`);
    }

    // C. SYSTEM PROMPT (Persona Tuning)
    const systemPrompt = `
    Anda adalah 'Life OS Core', partner berpikir (Second Brain) untuk pengguna.
    
    DATA & KONTEKS:
    ${contextText}

    INSTRUKSI:
    1. Prioritaskan [TENTANG USER] dalam menentukan gaya bahasa dan pendekatan saran.
    2. Jawab pertanyaan berdasarkan DATA di atas. Hubungkan titik-titik antara Goals, Projects, Habits, dan Finance.
    3. Bersikaplah proaktif! Tawarkan solusi konkret, bukan hanya teori.
    4. GUNAKAN TOOLS jika relevan:
       - User ingin melakukan sesuatu nanti -> 'createQuickTask'
       - User melapor pengeluaran -> 'logExpense'
       - User selesai baca buku/nonton -> 'addToLibrary'
       - User ingin menyimpan ide/insight -> 'saveNote'
    5. Jawab singkat, padat, dan langsung ke poin (kecuali diminta menjelaskan).
    `;

    // D. LLM CALL (First Pass)
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
    ];

    const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: messages,
        tools: tools,
        toolChoice: "auto" 
    });

    const choice = response.choices[0];
    const toolCalls = choice.message.toolCalls;

    // E. TOOL EXECUTION LOOP
    if (toolCalls && toolCalls.length > 0) {
        // Tambahkan pesan asisten ke history agar konteks nyambung
        messages.push(choice.message); 

        for (const toolCall of toolCalls) {
            const funcName = toolCall.function.name;
            const funcArgs = JSON.parse(toolCall.function.arguments);
            
            let toolResult = "";

            // Execute Function
            try {
                if (funcName === 'createQuickTask') {
                    toolResult = await createQuickTask(uid, funcArgs.taskName);
                } else if (funcName === 'logExpense') {
                    toolResult = await logExpense(uid, funcArgs.amount, funcArgs.category, funcArgs.note);
                } else if (funcName === 'addToLibrary') {
                    toolResult = await addToLibrary(uid, funcArgs.title, funcArgs.type, funcArgs.rating);
                } else if (funcName === 'saveNote') {
                    toolResult = await saveNote(uid, funcArgs.title, funcArgs.content, funcArgs.tags);
                }
            } catch (err) {
                toolResult = JSON.stringify({ status: "error", message: err.message });
            }

            // Push Tool Result ke history pesan
            messages.push({
                role: "tool",
                name: funcName,
                content: toolResult,
                toolCallId: toolCall.id
            });
        }

        // F. LLM CALL (Second Pass - Generate Final Answer)
        const finalResponse = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: messages,
        });

        return finalResponse.choices[0].message.content;
    }

    // Jika tidak ada tool call, kembalikan jawaban langsung
    return choice.message.content;

  } catch (e) {
    console.error("AI Agent Error:", e);
    return "Maaf, sistem AI sedang overload atau terjadi kesalahan jaringan.";
  }
}

// Keep refineTaskAction as is
export async function refineTaskAction(ambiguousTask) {
    // ... (kode lama tetap sama, tidak perlu diubah)
    if (!process.env.MISTRAL_API_KEY) return ambiguousTask;
    try {
      const response = await mistral.chat.complete({
        model: "mistral-tiny",
        messages: [{ 
          role: "user", 
          content: `Ubah tugas ini menjadi format SMART. Input: "${ambiguousTask}"` 
        }],
      });
      return response.choices[0].message.content.trim().replace(/"/g, '');
    } catch (e) { return ambiguousTask; }
}

// --- [NEW] FEATURE 3: PROACTIVE INSIGHTS (Wellness x Productivity) ---
export async function generateWellnessInsightAction(uid) {
  if (!process.env.MISTRAL_API_KEY) return "AI Offline.";

  try {
    // Ambil data 14 hari terakhir untuk pola yang cukup
    const today = new Date();
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Fetch Wellness & Logs paralel
    const [wellnessSnap, logsSnap] = await Promise.all([
        getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'wellness'), limit(14))),
        getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'logs'), orderBy('createdAt', 'desc'), limit(50)))
    ]);

    let dataContext = "DATA 14 HARI TERAKHIR:\n";
    
    wellnessSnap.forEach(d => {
        const w = d.data();
        // ID dokumen wellness adalah tanggal (YYYY-MM-DD)
        dataContext += `- Tgl ${d.id}: Mood=${w.mood || '?'}, Air=${w.water || 0}/8\n`;
    });

    dataContext += "\nLOG AKTIVITAS TERBARU:\n";
    logsSnap.forEach(d => {
        const l = d.data();
        const date = l.createdAt?.toDate().toISOString().split('T')[0] || '?';
        dataContext += `- [${date}] ${l.message} (Tipe: ${l.type})\n`;
    });

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: "Anda adalah Analis Kesehatan & Produktivitas. Tugas: Temukan KORELASI antara Mood/Air dengan Produktivitas user. Berikan 1 Insight tajam dan 1 Saran konkret. Maksimal 3 kalimat." },
        { role: "user", content: dataContext }
      ]
    });

    return response.choices[0].message.content;

  } catch (e) {
    console.error("Insight Error:", e);
    return "Gagal menganalisis data.";
  }
}


// --- [NEW] FEATURE 4: AUTOMATED WEEKLY REVIEW ---
export async function generateWeeklyReviewAction(uid) {
  if (!process.env.MISTRAL_API_KEY) return "AI Offline.";

  try {
    // Hitung tanggal 7 hari lalu
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Fetch Logs 7 hari terakhir
    const q = query(
        collection(db, 'artifacts', appId, 'users', uid, 'logs'), 
        where('createdAt', '>=', sevenDaysAgo),
        orderBy('createdAt', 'desc')
    );
    
    const snap = await getDocs(q);
    
    if (snap.empty) return "Belum ada cukup data minggu ini untuk dianalisis.";

    let logText = "";
    let totalXP = 0;
    
    snap.forEach(d => {
        const l = d.data();
        const date = l.createdAt?.toDate().toLocaleDateString('id-ID', { weekday: 'long' });
        logText += `- [${date}] ${l.message}\n`;
        if (l.xpGained) totalXP += l.xpGained;
    });

    const prompt = `
    Buat "Weekly Review" profesional & inspiratif dari log ini.
    
    DATA MINGGU INI (Total XP: ${totalXP}):
    ${logText}
    
    FORMAT OUTPUT (Markdown):
    ## 📅 Laporan Mingguan
    **Pencapaian Utama:** (Point form)
    **Area Fokus:** (Apa yang paling sering dikerjakan)
    **Statistik:** Total XP diperoleh: ${totalXP}
    **Saran Minggu Depan:** (1 kalimat motivasi)
    `;

    const response = await mistral.chat.complete({
      model: "mistral-large-latest", // Model lebih pintar untuk summarizing
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices[0].message.content;

  } catch (e) {
    console.error("Review Error:", e);
    return "Gagal membuat laporan mingguan.";
  }
}

// --- [NEW] FEATURE 5: AUTO DAILY JOURNAL (The Scribe) ---
export async function generateDailyJournalAction(uid, manualReflection) {
  if (!process.env.MISTRAL_API_KEY) return "AI Offline.";

  try {
    // 1. Tentukan Rentang Waktu (Hari Ini 00:00 - Sekarang)
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 2. Fetch Data (Logs & Wellness)
    const [logsSnap, wellnessSnap] = await Promise.all([
        getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'logs'), where('createdAt', '>=', startOfDay), orderBy('createdAt', 'asc'))),
        getDoc(doc(db, 'artifacts', appId, 'users', uid, 'wellness', dateString))
    ]);

    // 3. Susun Konteks untuk AI
    let context = `TANGGAL: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;

    // Data Fisik & Mental
    if (wellnessSnap.exists()) {
        const w = wellnessSnap.data();
        context += `[KONDISI SAYA]\n- Mood: ${w.mood || 'Netral'}\n- Hidrasi: ${w.water || 0}/8 gelas\n\n`;
    }

    // Data Aktivitas (Log System)
    context += `[JEJAK AKTIVITAS]\n`;
    if (logsSnap.empty) context += "- Tidak ada aktivitas sistem yang tercatat.\n";
    else {
        logsSnap.forEach(d => {
            const l = d.data();
            const time = l.createdAt.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            // Filter log teknis, ambil yang bermakna
            context += `- [${time}] ${l.message}\n`;
        });
    }

    // Data Refleksi (Input User)
    context += `\n[REFLEKSI BATIN]\n`;
    context += `- Yang Berjalan Baik: ${manualReflection.good || '-'}\n`;
    context += `- Yang Perlu Diperbaiki: ${manualReflection.fix || '-'}\n`;
    context += `- Yang Perlu Ditinggalkan: ${manualReflection.leave || '-'}\n`;

    // 4. Prompt Engineering
    const prompt = `
    Bertindaklah sebagai Penulis Biografi Pribadi saya yang bijaksana dan empatik.
    Tugasmu: Tuliskan Jurnal Harian (Diary) berdasarkan data hari ini.
    
    DATA HARI INI:
    ${context}
    
    ATURAN PENULISAN:
    1. Gunakan sudut pandang "Aku" (First-person).
    2. Gabungkan fakta (log) dan perasaan (mood/refleksi) menjadi satu narasi yang mengalir (bukan listicle).
    3. Gaya bahasa: Reflektif, jujur, dan manusiawi (tidak kaku seperti robot).
    4. Berikan judul yang puitis atau menarik di baris pertama (Format Markdown H1: # Judul).
    5. Tutup dengan satu kalimat "Learning" atau "Affirmation" untuk besok.
    6. Panjang tulisan sekitar 3-4 paragraf pendek.
    `;

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }]
    });

    const journalContent = response.choices[0].message.content;

    // 5. Simpan ke Second Brain (Notes)
    // Ekstrak Judul
    const titleMatch = journalContent.match(/^#\s*(.+)/);
    const finalTitle = titleMatch ? titleMatch[1].replace(/\*/g, '') : `Jurnal ${new Date().toLocaleDateString('id-ID')}`;
    
    // Bersihkan konten dari judul ganda
    const cleanContent = journalContent.replace(/^#\s*.+\n/, '').trim();

    await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'notes'), {
        title: finalTitle,
        content: cleanContent,
        tags: ['journal', 'daily-recap', 'ai-scribe'],
        color: 'rose', // Warna spesial untuk Jurnal
        isPinned: false,
        deleted: false,
        createdAt: serverTimestamp()
    });

    return "Jurnal harian berhasil ditulis dan disimpan ke Notes!";

  } catch (e) {
    console.error("Journal Error:", e);
    return "Maaf, tinta pena AI habis (Error).";
  }
}