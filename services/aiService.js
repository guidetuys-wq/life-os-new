// services/aiService.js
// [UPDATE] Import fungsi baru
import { chatWithNotesAction, generateWeeklyReviewAction, generateWellnessInsightAction, generateDailyJournalAction } from '@/app/actions/second-brain';

export const AiService = {
    // 1. Chat
    chatWithBrain: async (uid, message) => {
        try {
            return await chatWithNotesAction(uid, message);
        } catch (error) {
            console.error("AI Service Error:", error);
            throw new Error("Maaf, AI sedang gangguan.");
        }
    },

    // 2. Weekly Review
    generateWeeklyReview: async (uid) => {
        try {
            return await generateWeeklyReviewAction(uid);
        } catch (error) {
            throw new Error("Gagal generate review.");
        }
    },

    // 3. Wellness Insight
    generateWellnessInsight: async (uid) => {
        try {
            return await generateWellnessInsightAction(uid);
        } catch (error) {
            throw new Error("Gagal analisa wellness.");
        }
    },

    // 4. [NEW] Auto Journal
    createDailyJournal: async (uid, reflectionData) => {
        try {
            return await generateDailyJournalAction(uid, reflectionData);
        } catch (error) {
            throw new Error("Gagal menulis jurnal.");
        }
    }
};