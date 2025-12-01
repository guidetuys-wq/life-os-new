// lib/ai.js
import { Mistral } from "@mistralai/mistralai";

// Inisialisasi client sekali
export const mistral = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY ?? "",
});

/** * FUNGSI UTAMA: Generate Subtasks (Hybrid Engine) 
 * Memecah proyek menjadi langkah-langkah.
 */
export async function generateSubtasks(topic) {
  try {
    // Cek inisialisasi yang sudah diexport
    // Cek mistral.apiKey untuk memastikan key terisi (jika tidak, klien akan gagal)
    if (!mistral || mistral.apiKey === "") {
      throw new Error("AI Client tidak terinisialisasi atau API Key tidak ada.");
    }
    
    // Coba Panggil Mistral AI
    return await askMistral(topic);
  } catch (error) {
    console.warn("AI Error/Offline, beralih ke mode simulasi:", error);
    return generateSimulatedSubtasks(topic);
  }
}

// --- LOGIC 1A: REAL AI (MISTRAL) - Task Breakdown ---
async function askMistral(topic) {
  const systemPrompt = `
    Anda adalah seorang konsultan produktivitas yang cermat dan detail. Tugas Anda adalah memecah tujuan menjadi langkah-langkah yang jelas.
    Gunakan Bahasa Indonesia formal dan mudah dipahami.
  `;
  const userPrompt = `
    Pecah proyek: "${topic}" menjadi 5 sampai 8 langkah konkret, terukur, dan dapat ditindaklanjuti.
    Aturan Output Wajib:
    1. Jawab HANYA dengan objek JSON.
    2. Objek JSON HANYA boleh memiliki satu kunci: "steps".
    3. Nilai "steps" harus berupa array string (langkah-langkah).
  `;
  
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  
  // Menggunakan instance mistral yang sudah diexport
  const response = await mistral.chat.complete({
    model: "mistral-small-latest",
    messages,
    responseFormat: { type: "json_object" },
  });
  
  const content = response.choices[0].message.content;
  
  try {
    const data = JSON.parse(content);
    if (data && Array.isArray(data.steps)) {
      return data.steps;
    }
  } catch (e) {
    throw new Error("Gagal parse JSON dari AI.");
  }
  
  throw new Error("Format output AI tidak sesuai.");
}

// --- LOGIC 1B: REAL AI (MISTRAL) - Task Refinement ---
export async function refineTask(ambiguousTask) {
  // Cek instance mistral yang sudah diexport
  if (!mistral || mistral.apiKey === "") return ambiguousTask; 
  
  const prompt = `
    Anda adalah asisten yang mengubah task ambigu menjadi task yang spesifik dan dapat ditindaklanjuti.
    Input task: "${ambiguousTask}"
    Output: Ubah task tersebut menjadi kalimat tunggal yang memenuhi kriteria SMART (Spesifik, Terukur, Dapat dicapai, Relevan, Batasan waktu). Jangan tambahkan kutipan atau penjelasan.
  `;
  
  try {
    // Menggunakan instance mistral yang sudah diexport
    const response = await mistral.chat.complete({
      model: "mistral-tiny",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    console.error("Gagal refine task:", e);
    return ambiguousTask; // Kembalikan task awal jika ada error
  }
}

// --- LOGIC 2: SIMULASI MANUAL (FALLBACK) ---
async function generateSimulatedSubtasks(topic) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const lowerTopic = topic.toLowerCase();
  let steps = [];

  if (lowerTopic.includes("website") || lowerTopic.includes("app") || lowerTopic.includes("coding")) {
    steps = [
      "Riset & Kumpulkan Referensi Desain",
      "Buat Sketsa/Wireframe UI",
      "Setup Repository & Environment",
      "Coding Fitur Utama (MVP)",
      "Testing & Bug Fixing",
      "Deploy ke Production",
    ];
  } else if (lowerTopic.includes("buku") || lowerTopic.includes("nulis") || lowerTopic.includes("artikel")) {
    steps = [
      "Tentukan Topik & Target Pembaca",
      "Buat Outline/Daftar Isi",
      "Riset Bahan & Data Pendukung",
      "Tulis Draft Kasar (Bab 1-3)",
      "Review & Edit Draft",
      "Finalisasi & Publish",
    ];
  } else if (lowerTopic.includes("jalan") || lowerTopic.includes("liburan") || lowerTopic.includes("trip")) {
    steps = [
      "Tentukan Destinasi & Tanggal",
      "Cek Tiket Transportasi",
      "Booking Penginapan",
      "Buat Itinerary Harian",
      "Packing Barang Bawaan",
      "Siapkan Dokumen Perjalanan",
    ];
  } else if (lowerTopic.includes("belajar") || lowerTopic.includes("kursus")) {
    steps = [
      "Cari Silabus/Roadmap Belajar",
      "Tentukan Jadwal Belajar Harian",
      "Siapkan Catatan & Alat Tulis",
      "Pelajari Konsep Dasar",
      "Praktek/Latihan Soal",
      "Review & Evaluasi Pemahaman",
    ];
  } else {
    steps = [
      `Definisikan Tujuan Akhir "${topic}"`,
      "Pecah Menjadi Milestone Kecil",
      "Kerjakan Bagian Tersulit Dulu",
      "Review Progress Mingguan",
      "Finalisasi & Selesaikan",
    ];
  }

  return steps;
}

// --- NEW FUNCTION: Chat with Notes (Simulasi RAG) ---
export async function chatWithNotes(uid, question) {
    if (!mistral || mistral.apiKey === "") {
        return "AI tidak aktif atau API key kosong. Tidak dapat memproses notes.";
    }
    
    // Asumsi: db dan appId diimpor dari './firebase'
    const { db, appId } = await import('./firebase'); 
    const { collection, query, getDocs } = await import('firebase/firestore');

    // 1. Ambil Notes yang mungkin relevan (Simulasi RAG)
    const qNotes = query(collection(db, 'artifacts', appId, 'users', uid, 'notes'));
    const snap = await getDocs(qNotes);
    
    const notesContent = [];
    const questionLower = question.toLowerCase().split(' ').filter(word => word.length > 3);
    
    snap.forEach(d => {
        const data = d.data();
        const contentLower = (data.content + ' ' + data.title).toLowerCase();
        
        // Cek jika title/content mengandung minimal 2 kata dari pertanyaan
        const matches = questionLower.filter(word => contentLower.includes(word)).length;
        
        if (matches >= 2) {
            notesContent.push(`[NOTE: ${data.title}] - ${data.content.substring(0, 300)}...`);
        }
    });

    if (notesContent.length === 0) {
        return "Saya tidak menemukan catatan yang relevan untuk pertanyaan tersebut di Second Brain Anda.";
    }

    // 2. Buat Prompt dengan konteks (Top 3 notes)
    const context = notesContent.slice(0, 3).join('\n---\n');

    const prompt = `
        Anda adalah asisten pencarian cerdas. Jawab pertanyaan pengguna berdasarkan HANYA konteks catatan yang diberikan di bawah ini.
        Jika jawaban tidak ada dalam konteks, jawab bahwa Anda tidak memiliki informasi yang relevan.

        --- KONTEKS CATATAN PENGGUNA ---
        ${context}
        --- AKHIR KONTEKS ---

        Pertanyaan Pengguna: "${question}"
        Jawaban Anda:
    `;

    // 3. Panggil Mistral
    const response = await mistral.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
    });
    
    return response.choices[0].message.content.trim();
}