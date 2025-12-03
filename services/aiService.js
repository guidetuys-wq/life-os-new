// services/aiService.js
// [FIX] Import dari 'second-brain', bukan 'ai' lagi
import { chatWithNotesAction } from '@/app/actions/second-brain';

export const AiService = {
    // Wrapper untuk chat RAG & Agent
    chatWithBrain: async (uid, message) => {
        try {
            // Panggil Server Action baru
            const response = await chatWithNotesAction(uid, message);
            return response;
        } catch (error) {
            console.error("AI Service Error:", error);
            throw new Error("Maaf, AI sedang mengalami gangguan.");
        }
    }
};