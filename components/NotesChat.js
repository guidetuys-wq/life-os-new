'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatWithNotes } from '@/lib/ai';
import toast from 'react-hot-toast';

export default function NotesChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !user) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await chatWithNotes(user.uid, input);
            const aiMessage = { role: 'ai', content: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            toast.error("Gagal terhubung dengan AI. Cek koneksi atau API Key.");
            const errorMessage = { role: 'ai', content: "Error: Maaf, terjadi masalah saat memproses catatan Anda." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }; // <-- Penutup fungsi handleSubmit

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const MessageBubble = ({ message }) => (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-lg whitespace-pre-wrap ${
                message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
            }`}>
                {message.content}
            </div>
        </div>
    ); // <-- Penutup definisi MessageBubble

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white border-b border-slate-700/50 pb-3 mb-4">
                Chat dengan Second Brain 🧠
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 py-10">
                        <p>Tanyakan sesuatu tentang catatan Anda. Contoh: "Apa prioritas minggu ini dari meeting note saya?"</p>
                    </div>
                )}
                {messages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-slate-700 text-slate-100 p-3 rounded-xl rounded-bl-none">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="animate-pulse">AI sedang mencari...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4 pt-4 border-t border-slate-700/50">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tanyakan sesuatu..."
                    className="input-glass w-full py-3"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="btn-primary w-16 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-rounded">{isLoading ? 'sync' : 'send'}</span>
                </button>
            </form>
        </div>
    );
}