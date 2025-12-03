'use server';

import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

/**
 * ACTION PLANNER
 * Memecah Goal/Ide Besar menjadi langkah-langkah kecil yang konkret.
 */
export async function generateActionPlanAction(goalTitle, context = '') {
  // 1. Cek API Key
  if (!process.env.MISTRAL_API_KEY) {
    console.error("❌ AI Error: MISTRAL_API_KEY tidak ditemukan di .env.local");
    return ["API Key Missing. Cek konfigurasi .env Anda."];
  }
  
  try {
    console.log(`🤖 AI Planner Start: "${goalTitle}"`);

    const response = await mistral.chat.complete({
      model: "mistral-large-latest", // [UBAH] Gunakan model 'Large' yang lebih pintar ikut instruksi JSON
      messages: [
        { 
          role: "system", 
          content: `Anda adalah 'Strategic Life Planner'. Tugas: Pecah GOAL menjadi 3-7 LANGKAH KONKRET.
          
          ATURAN WAJIB:
          1. Output HANYA JSON valid: { "tasks": ["Langkah 1", "Langkah 2"] }
          2. Jangan ada teks pembuka/penutup lain.
          3. Gunakan Bahasa Indonesia.` 
        },
        { role: "user", content: `GOAL: "${goalTitle}".\nKONTEKS: ${context}` },
      ],
      responseFormat: { type: "json_object" }, // Paksa mode JSON
    });

    // 2. Log Raw Response untuk Debugging
    const rawContent = response.choices[0].message.content;
    console.log("🤖 AI Raw Response:", rawContent);

    const parsed = JSON.parse(rawContent);
    
    // 3. Validasi Hasil
    if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
        console.warn("⚠️ AI Warning: Mengembalikan array kosong.");
        return [`Definisikan langkah pertama untuk: ${goalTitle}`, `Jadwalkan waktu pengerjaan`];
    }

    return parsed.tasks;

  } catch (e) {
    console.error("❌ AI Planner Exception:", e);
    
    // Fallback Manual jika AI Gagal Total
    return [
        `Riset awal tentang: ${goalTitle}`,
        `Buat rencana kasar`,
        `Tentukan deadline pertama`
    ];
  }
}