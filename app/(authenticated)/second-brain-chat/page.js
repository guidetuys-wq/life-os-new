// app/(authenticated)/second-brain-chat/page.js
import NotesChat from '@/components/NotesChat';

export default function SecondBrainChatPage() {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-100px)]"> 
            <NotesChat />
        </div>
    );
}