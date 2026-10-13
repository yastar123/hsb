import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Headset, Send, Check } from 'lucide-react';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { useLedger } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/live-chat')({
  component: AdminLiveChatScreen,
});

function AdminLiveChatScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const { users } = useLedger();
  const [chatUsers, setChatUsers] = useState<{ userId: string, name: string, email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ userId: string, name: string, email: string } | null>(null);
  const [messages, setMessages] = useState<{ sender: 'user' | 'admin', text: string, read: boolean }[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch('/api/admin/chat/users').then(res => res.ok && res.json().then(setChatUsers));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchChat = async () => {
      const res = await fetch(`/api/admin/chat/${selectedUser.userId}`);
      if (res.ok) setMessages(await res.json());
    };
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  const send = async () => {
    if (!input.trim() || !selectedUser) return;
    const text = input;
    setInput('');
    await fetch(`/api/admin/chat/${selectedUser.userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  };

  return <main className="min-w-0 bg-muted p-3 text-foreground sm:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <Headset className="size-5" /><h1 className="text-xl font-bold">{tr('Live Chat')}</h1>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <section className="md:col-span-1 bg-background rounded-xl p-4 border border-border">
        <h2 className="font-bold mb-3">{tr('Cari user')}</h2>
        {users.map(u => (
          <button key={u.id} onClick={() => setSelectedUser({ userId: u.id, name: u.name, email: u.email })} className={`w-full text-left p-2 rounded-lg ${selectedUser?.userId === u.id ? 'bg-primary/10' : ''}`}>
            {u.name}
          </button>
        ))}
      </section>
      <section className="md:col-span-3 bg-background rounded-xl p-4 border border-border flex flex-col h-[60vh]">
        <h2 className="font-bold mb-3 border-b pb-2">{selectedUser?.name}</h2>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`p-2 rounded-lg ${m.sender === 'admin' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary'}`}>
              {m.text}
              <span className="text-[10px] block opacity-70">{m.read ? tr('Dibaca') : tr('Belum dibaca')} <Check size={10} className="inline"/></span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 p-2 rounded-lg border border-border" value={input} onChange={e => setInput(e.target.value)} placeholder={tr('Ketik pesan...')} />
          <Button onClick={send}><Send /></Button>
        </div>
      </section>
    </div>
  </main>;
}
