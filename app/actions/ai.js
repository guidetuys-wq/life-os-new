'use server';

import { Mistral } from "@mistralai/mistralai";
import { db, appId } from '@/lib/firebase';
import { 
  collection, query, getDocs, where, orderBy, limit, addDoc, serverTimestamp 
} from 'firebase/firestore';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// --- 1. MAGIC PLAN: Generate Subtasks ---
export async function generateSubtasksAction(topic) {
  if (!process.env.MISTRAL_API_KEY) return [];
  
  try {
    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { 
          role: "system", 
          content: `Anda adalah manajer proyek ahli. Pecah proyek pengguna menjadi 3-7 langkah konkret, berurutan, dan dapat ditindaklanjuti (actionable).
          Output WAJIB JSON format: { "steps": ["Langkah 1 (est. 30m)", "Langkah 2 (est. 1h)", ...] }` 
        },
        { role: "user", content: `Proyek: ${topic}` },
      ],
      responseFormat: { type: "json_object" },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(content).steps || [];
  } catch (e) {
    console.error("AI Magic Plan Error:", e);
    return ["Gagal generate langkah otomatis. Coba lagi nanti."];
  }
}

// --- 2. REFINE TASK: Memperjelas Task ---
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

// --- HELPER FUNCTIONS UNTUK AI AGENT (TOOLS) ---

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
        return JSON.stringify({ status: "success", message: `Task '${taskName}' berhasil dibuat.` });
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
        return JSON.stringify({ status: "success", message: `Pengeluaran Rp${amount} untuk ${category} tercatat.` });
    } catch (e) {
        return JSON.stringify({ status: "error", message: e.message });
    }
}

// Definisi Tools
const tools = [
    {
        type: "function",
        function: {
            name: "createQuickTask",
            description: "Membuat tugas/task baru di Inbox pengguna.",
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
            description: "Mencatat pengeluaran keuangan (expense).",
            parameters: {
                type: "object",
                properties: {
                    amount: { type: "number", description: "Jumlah uang (angka saja)" },
                    category: { type: "string", description: "Kategori (Makan, Transport, Belanja, dll)" },
                    note: { type: "string", description: "Catatan detail transaksi" },
                },
                required: ["amount"],
            },
        },
    }
];

// --- 3. CHAT WITH BRAIN (AGENT MODE) ---
export async function chatWithNotesAction(uid, question) {
  if (!process.env.MISTRAL_API_KEY) return "AI System Offline.";

  try {
    // A. FETCH CONTEXT (Read Only Context)
    const [notesSnap, projectsSnap] = await Promise.all([
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'notes'), orderBy('createdAt', 'desc'), limit(10))),
      getDocs(query(collection(db, 'artifacts', appId, 'users', uid, 'projects'), where('status', '!=', 'done')))
    ]);

    let contextText = "DATA PENGGUNA:\n";
    notesSnap.forEach(d => contextText += `- Note: ${d.data().title}\n`);
    projectsSnap.forEach(d => contextText += `- Project: ${d.data().name}\n`);

    // B. FIRST CALL: AI Memutuskan apakah perlu "Tool" atau "Jawab Biasa"
    const messages = [
        { role: "system", content: `Anda adalah Asisten Life OS. Anda bisa menjawab pertanyaan berdasarkan data, ATAU melakukan tindakan nyata (buat task, catat uang) menggunakan tools yang tersedia. Data Context: ${contextText}` },
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

    // C. JIKA AI INGIN PAKAI TOOLS
    if (toolCalls && toolCalls.length > 0) {
        // 1. Eksekusi Tool yang diminta AI
        const toolCall = toolCalls[0];
        const funcName = toolCall.function.name;
        const funcArgs = JSON.parse(toolCall.function.arguments);
        
        let toolResult = "";

        if (funcName === 'createQuickTask') {
            toolResult = await createQuickTask(uid, funcArgs.taskName);
        } else if (funcName === 'logExpense') {
            toolResult = await logExpense(uid, funcArgs.amount, funcArgs.category, funcArgs.note);
        }

        // 2. Kirim hasil eksekusi kembali ke AI
        messages.push(choice.message); 
        messages.push({
            role: "tool",
            name: funcName,
            content: toolResult,
            toolCallId: toolCall.id
        });

        // 3. Final Call
        const finalResponse = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: messages,
        });

        return finalResponse.choices[0].message.content;
    }

    // D. JIKA TIDAK ADA TOOL CALL
    return choice.message.content;

  } catch (e) {
    console.error("AI Agent Error:", e);
    return "Maaf, AI sedang error.";
  }
}