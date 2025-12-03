'use server';

import { Mistral } from "@mistralai/mistralai";
import { db, appId } from '@/lib/firebase';
import { 
  collection, query, getDocs, where, orderBy, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// --- TOOL HELPERS (Private Functions) ---

async function createQuickTask(uid, taskName) {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'tasks'), {
            text: taskName,
            completed: false,
            priority: 'normal',
            projectId: '',
            createdAt: serverTimestamp(),
            isAiGenerated: true
        });
        return JSON.stringify({ status: "success", message: `Task '${taskName}' berhasil dibuat di Inbox.` });
    } catch (e) {
        return JSON.stringify({ status: "error", message: e.message });
    }
}

async function logExpense(uid, amount, category, note) {
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', uid, 'transactions'), {
            amount: Number(amount),
            type: 'expense',
            category: category || 'General',
            note: note || 'AI Entry',
            createdAt: serverTimestamp()
        });
        return JSON.stringify({ status: "success", message: `Pengeluaran Rp${amount} (${category}) tercatat.` });
    } catch (e) {
        return JSON.stringify({ status: "error", message: e.message });
    }
}

// --- TOOL DEFINITIONS ---
const tools = [
    {
        type: "function",
        function: {
            name: "createQuickTask",
            description: "Membuat tugas/task baru di Inbox pengguna. Gunakan ini jika user menyuruh melakukan sesuatu nanti.",
            parameters: {
                type: "object",
                properties: {
                    taskName: { type: "string", description: "Isi tugas yang harus dilakukan" },
                },
                required: ["taskName"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "logExpense",
            description: "Mencatat pengeluaran keuangan (expense). Gunakan ini jika user melapor habis belanja atau keluar uang.",
            parameters: {
                type: "object",
                properties: {
                    amount: { type: "number", description: "Jumlah uang (angka saja)" },
                    category: { type: "string", description: "Kategori (Makan, Transport, Belanja, Tagihan, dll)" },
                    note: { type: "string", description: "Catatan detail transaksi" },
                },
                required: ["amount"],
            },
        },
    }
];

// --- PUBLIC ACTIONS ---

/**
 * 1. REFINE TASK
 * Memperbaiki kalimat task yang ambigu menjadi SMART.
 */
export async function refineTaskAction(ambiguousTask) {
  if (!process.env.MISTRAL_API_KEY) return ambiguousTask;

  try {
    const response = await mistral.chat.complete({
      model: "mistral-tiny",
      messages: [{ 
        role: "user", 
        content: `Ubah tugas ini menjadi format SMART (Specific, Measurable, Actionable, Relevant, Time-bound) dalam Bahasa Indonesia. 
        Buat singkat, padat, dan tambahkan satu #hashtag kategori yang relevan di akhir.
        Input: "${ambiguousTask}"` 
      }],
    });
    return response.choices[0].message.content.trim().replace(/"/g, '');
  } catch (e) {
    return ambiguousTask;
  }
}

/**
 * 2. CHAT WITH BRAIN (AGENT MODE)
 * Menjawab pertanyaan berdasarkan Notes/Projects/Goals ATAU menjalankan Tools.
 */
export async function chatWithNotesAction(uid, question) {
  if (!process.env.MISTRAL_API_KEY) return "AI System Offline.";

  try {
    // A. FETCH CONTEXT (Read Only Context)
    const [notesSnap, projectsSnap, goalsSnap] = await Promise.all([
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'notes'), orderBy('createdAt', 'desc'), limit(15))),
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'projects'), where('status', '!=', 'done'))),
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'goals')))
    ]);

    let contextText = "DATA PENGGUNA SAAT INI:\n";
    if (!notesSnap.empty) contextText += "--- NOTES (Terbaru) ---\n";
    notesSnap.forEach(d => contextText += `- ${d.data().title}: ${d.data().content.substring(0, 100)}...\n`);
    
    if (!projectsSnap.empty) contextText += "\n--- ACTIVE PROJECTS ---\n";
    projectsSnap.forEach(d => contextText += `- ${d.data().name}\n`);

    if (!goalsSnap.empty) contextText += "\n--- LIFE GOALS ---\n";
    goalsSnap.forEach(d => contextText += `- ${d.data().title} (${d.data().area})\n`);

    // B. FIRST CALL
    const messages = [
        { role: "system", content: `Anda adalah Asisten Life OS (Second Brain). 
        Tugas Anda:
        1. Menjawab pertanyaan user berdasarkan DATA PENGGUNA.
        2. Melakukan tindakan nyata (Tools) jika user meminta (misal: "ingatkan saya...", "catat pengeluaran...").
        
        DATA PENGGUNA:
        ${contextText}` },
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

    // C. TOOL EXECUTION
    if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        const funcName = toolCall.function.name;
        const funcArgs = JSON.parse(toolCall.function.arguments);
        
        let toolResult = "";

        if (funcName === 'createQuickTask') {
            toolResult = await createQuickTask(uid, funcArgs.taskName);
        } else if (funcName === 'logExpense') {
            toolResult = await logExpense(uid, funcArgs.amount, funcArgs.category, funcArgs.note);
        }

        // Kirim hasil balik ke AI
        messages.push(choice.message); 
        messages.push({
            role: "tool",
            name: funcName,
            content: toolResult,
            toolCallId: toolCall.id
        });

        const finalResponse = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: messages,
        });

        return finalResponse.choices[0].message.content;
    }

    return choice.message.content;

  } catch (e) {
    console.error("AI Agent Error:", e);
    return "Maaf, terjadi kesalahan pada Second Brain.";
  }
}