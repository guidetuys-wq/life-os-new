'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AiService } from '@/services/aiService'; // [NEW] Gunakan Service
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
            // Gunakan Service, bukan Action langsung
            const aiResponse = await AiService.chatWithBrain(user.uid, userMessage.content);
            
            const aiMessage = { role: 'ai', content: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            toast.error(error.message);
            const errorMessage = { role: 'ai', content: "⚠️ Error: Gagal terhubung ke Second Brain." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Sub-component Bubble Chat
    const MessageBubble = ({ message }) => (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 animate-enter`}>
            <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm whitespace-pre-wrap text-sm leading-relaxed ${
                message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
            }`}>
                {message.content}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span className="material-symbols-rounded text-white">psychology</span>
                </div>
                <div>
                    <h3 className="font-bold text-white">Second Brain AI</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] text-slate-400">Online & Connected to Notes</p>
                    </div>
                </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 space-y-4 bg-slate-900/30">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <span className="material-symbols-rounded text-6xl mb-4">forum</span>
                        <p className="text-sm">Tanyakan sesuatu tentang catatanmu.</p>
                        <p className="text-xs mt-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Contoh: "Apa ide proyek minggu lalu?"</p>
                    </div>
                )}
                
                {messages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
                
                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-sm border border-slate-700 flex gap-2 items-center">
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 md:p-5 bg-slate-950 border-t border-slate-800">
                <div className="relative flex gap-3 items-end">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ketik pertanyaan..."
                        className="w-full bg-slate-900 text-white text-sm rounded-xl border border-slate-800 px-4 py-3.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-slate-600"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()} 
                        className="h-[46px] w-[56px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-rounded">{isLoading ? 'stop' : 'send'}</span>
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-600 mt-2">
                    AI menggunakan konteks dari 5 catatan paling relevan.
                </p>
            </form>
        </div>
    );
}