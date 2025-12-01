// lib/ai.js

import { Mistral } from "@mistralai/mistralai";

// Inisialisasi client sekali
export const mistral = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY ?? "",
});

/**
 * FUNGSI UTAMA: Generate Subtasks (Hybrid Engine)
 */
export async function generateSubtasks(topic) {
  try {
    // Pastikan client siap
    if (!mistral) {
      throw new Error("AI Client tidak terinisialisasi atau API Key tidak ada.");
    }

    // Coba panggil Mistral AI
    return await askMistral(topic);
  } catch (error) {
    console.warn("AI Error/Offline, beralih ke mode simulasi:", error);
    return generateSimulatedSubtasks(topic);
  }
}

// --- LOGIC 1: REAL AI (MISTRAL) ---
async function askMistral(topic) {
  const prompt = `
    You are an expert productivity assistant. Break down the project: "${topic}" menjadi 5 sampai 8 langkah konkret, dapat ditindaklanjuti, dan ringkas.
    You MUST return the result as a single JSON object with one key named "steps". The value must be a JSON array of strings. 
    Do not include any other explanatory text or markdown formatting (e.g., \`\`\`\`). Use Indonesian.
    
    Example output: {"steps": ["Riset bahan", "Buat outline", "Tulis draft"]}
  `;

  const messages = [{ role: "user", content: prompt }];

  // Perhatikan: metode resmi adalah chat.complete
  const response = await mistral.chat.complete({
    model: "mistral-small-latest", // atau model lain yang kamu mau
    messages,
  });

  const content = response.choices[0].message.content;
  const cleanContent = content.replace(/``````/g, "").trim();
  const data = JSON.parse(cleanContent);

  if (data && Array.isArray(data.steps)) {
    return data.steps;
  }

  throw new Error("Mistral returned data in an unexpected format.");
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
