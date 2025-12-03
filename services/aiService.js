// services/aiService.js
import { chatWithNotesAction } from '@/app/actions/ai';

export const AiService = {
    // Wrapper untuk chat RAG
    chatWithBrain: async (uid, message) => {
        try {
            // Panggil Server Action
            const response = await chatWithNotesAction(uid, message);
            return response;
        } catch (error) {
            console.error("AI Service Error:", error);
            throw new Error("Maaf, AI sedang mengalami gangguan.");
        }
    }
};