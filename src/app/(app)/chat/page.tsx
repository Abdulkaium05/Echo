import { MessageSquareText } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-background md:bg-secondary">
       <MessageSquareText className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Echo</h2>
      <p className="text-muted-foreground">Select a chat to start messaging.</p>
    </div>
  );
}
