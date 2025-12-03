// app/(authenticated)/second-brain-chat/page.js
import NotesChat from '@/components/NotesChat';

export default function SecondBrainChatPage() {
    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto h-[calc(100vh-80px)] md:h-screen pt-4 md:pt-8 pb-20 md:pb-8"> 
            <NotesChat />
        </div>
    );
}