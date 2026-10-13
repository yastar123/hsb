import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAppPreferences, translate } from '@/components/app-preferences';

export const Route = createFileRoute('/live-chat')({
  component: LiveChatScreen,
});

function LiveChatScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [messages, setMessages] = useState<{ sender: 'user' | 'admin', text: string, read: boolean }[]>([
    { sender: 'admin', text: 'Halo! Ada yang bisa kami bantu?', read: true },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input, read: false }]);
    setInput('');
  };

  return <main className="home-page"><div className="home-shell acct-shell acct-plain">
    <header className="acct-header"><Button asChild variant="ghost" size="icon"><Link to="/profil" aria-label={tr('Kembali')}><ArrowLeft /></Link></Button><h1>{tr('Live Chat')}</h1></header>
    <div className="flex flex-col h-[60vh] p-4 bg-background">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded-lg ${m.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary'}`}>
            {m.text}
            {m.sender === 'user' && <span className="text-[10px] block opacity-70">{m.read ? tr('Dibaca') : tr('Belum dibaca')}</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 p-2 rounded-lg border border-border" value={input} onChange={e => setInput(e.target.value)} placeholder={tr('Ketik pesan...')} />
        <Button onClick={send}><Send /></Button>
      </div>
    </div>
  </div></main>;
}
