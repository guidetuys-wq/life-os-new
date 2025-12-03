'use server';

import { Mistral } from "@mistralai/mistralai";
import { db, appId } from '@/lib/firebase'; // Menggunakan config firebase yang sama
import { collection, query, getDocs, where } from 'firebase/firestore';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY, // Pastikan ini ada di .env (bukan NEXT_PUBLIC)
});

// 1. Generate Subtasks (Magic Plan)
export async function generateSubtasksAction(topic) {
  if (!process.env.MISTRAL_API_KEY) return [];
  
  try {
    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: "Pecah proyek menjadi langkah-langkah konkret dalam format JSON: { steps: [] }." },
        { role: "user", content: `Proyek: ${topic}` },
      ],
      responseFormat: { type: "json_object" },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(content).steps || [];
  } catch (e) {
    console.error("AI Error:", e);
    return ["Gagal generate langkah otomatis."];
  }
}

// 2. Refine Task (Memperjelas Task)
export async function refineTaskAction(ambiguousTask) {
  if (!process.env.MISTRAL_API_KEY) return ambiguousTask;

  try {
    const response = await mistral.chat.complete({
      model: "mistral-tiny",
      messages: [{ 
        role: "user", 
        content: `Ubah task ini menjadi lebih spesifik & actionable (SMART) dalam satu kalimat bahasa Indonesia: "${ambiguousTask}"` 
      }],
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    return ambiguousTask;
  }
}

// 3. Chat with Notes (RAG Sederhana di Server)
export async function chatWithNotesAction(uid, question) {
  if (!process.env.MISTRAL_API_KEY) return "AI tidak aktif.";

  try {
    // Fetch Notes di Server (Lebih aman & cepat daripada kirim semua ke client)
    const qNotes = query(collection(db, 'artifacts', appId, 'users', uid, 'notes'));
    const snap = await getDocs(qNotes);
    
    // Filter manual sederhana di server
    const notesContent = [];
    const questionLower = question.toLowerCase().split(' ').filter(w => w.length > 3);

    snap.forEach(d => {
        const data = d.data();
        const contentLower = (data.content + ' ' + data.title).toLowerCase();
        // Cek relevansi keyword
        const matches = questionLower.filter(word => contentLower.includes(word)).length;
        if (matches >= 1) { // Ambang batas relevansi
            notesContent.push(`[NOTE: ${data.title}] - ${data.content.substring(0, 500)}...`);
        }
    });

    if (notesContent.length === 0) return "Tidak ditemukan catatan yang relevan dengan pertanyaan Anda.";

    // Kirim ke AI
    const context = notesContent.slice(0, 5).join('\n---\n'); // Batasi konteks
    const prompt = `
      Jawab pertanyaan pengguna berdasarkan KONTEKS CATATAN berikut.
      
      KONTEKS:
      ${context}
      
      PERTANYAAN: "${question}"
      
      JAWABAN (Bahasa Indonesia):
    `;

    const response = await mistral.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
    });
    
    return response.choices[0].message.content;

  } catch (e) {
    console.error("Chat Error:", e);
    return "Maaf, terjadi kesalahan saat memproses catatan.";
  }
}