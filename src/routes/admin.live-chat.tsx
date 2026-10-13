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

  const fetchChatUsers = async () => {
    const res = await fetch('/api/admin/chat/users');
    if (res.ok) {
      const data = await res.json();
      setChatUsers(data);
      if (!selectedUser && data.length > 0) {
        setSelectedUser(data[0]);
      }
    }
  };

  useEffect(() => {
    fetchChatUsers();
    const interval = setInterval(fetchChatUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchChat = async () => {
    if (!selectedUser) return;
    const res = await fetch(`/api/admin/chat/${selectedUser.userId}`);
    if (res.ok) {
      setMessages(await res.json());
    }
    await fetch(`/api/admin/chat/${selectedUser.userId}/read`, { method: 'POST' });
  };

  useEffect(() => {
    if (!selectedUser) return;
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [selectedUser?.userId]);

  const send = async () => {
    if (!input.trim() || !selectedUser) return;
    const text = input;
    setInput('');
    const res = await fetch(`/api/admin/chat/${selectedUser.userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    if (res.ok) {
      await fetchChat();
    }
  };

  // Combine chat users and all users so admin can select anyone
  const allUserMap = new Map();
  users.forEach(u => allUserMap.set(u.id, { userId: u.id, name: u.name, email: u.email }));
  chatUsers.forEach(u => allUserMap.set(u.userId, u));
  const combinedUsers = Array.from(allUserMap.values());

  return <main className="min-w-0 bg-muted p-3 text-foreground sm:p-6">
    <header className="mb-4 flex flex-wrap items-center gap-3">
      <Headset className="size-5" /><h1 className="text-xl font-bold">{tr('Live Chat Admin')}</h1>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <section className="md:col-span-1 bg-background rounded-xl p-4 border border-border max-h-[70vh] overflow-y-auto">
        <h2 className="font-bold mb-3 text-sm">{tr('Daftar Pengguna')}</h2>
        <div className="space-y-1">
          {combinedUsers.map(u => (
            <button key={u.userId} onClick={() => setSelectedUser(u)} className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors ${selectedUser?.userId === u.userId ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted'}`}>
              <div className="font-semibold">{u.name}</div>
              <div className="text-[10px] opacity-70 truncate">{u.email}</div>
            </button>
          ))}
        </div>
      </section>
      <section className="md:col-span-3 bg-background rounded-xl p-4 border border-border flex flex-col h-[70vh]">
        <h2 className="font-bold mb-3 border-b pb-2 text-sm flex items-center justify-between">
          <span>{selectedUser ? selectedUser.name : tr('Pilih pengguna untuk mulai chat')}</span>
          {selectedUser && <span className="text-xs font-normal opacity-70">{selectedUser.email}</span>}
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{tr('Pilih salah satu user di panel kiri.')}</div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">{tr('Belum ada pesan. Mulai percakapan sekarang.')}</div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-2xl max-w-[80%] ${m.sender === 'admin' ? 'bg-primary text-primary-foreground ml-auto rounded-br-xs' : 'bg-secondary text-foreground mr-auto rounded-bl-xs'}`}>
                <p className="text-sm">{m.text}</p>
                {m.sender === 'admin' && <span className="text-[10px] block opacity-70 mt-1 text-right">{m.read ? tr('Dibaca ✓✓') : tr('Belum dibaca ✓')}</span>}
                {m.sender === 'user' && <span className="text-[10px] block opacity-70 mt-1">{m.read ? tr('Dibaca ✓✓') : tr('Belum dibaca ✓')}</span>}
              </div>
            ))
          )}
        </div>
        {selectedUser && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <input className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={tr('Ketik balasan admin...')} />
            <Button onClick={send} size="icon" className="h-10 w-10 shrink-0"><Send className="h-4 w-4" /></Button>
          </div>
        )}
      </section>
    </div>
  </main>;
}
