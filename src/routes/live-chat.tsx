import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, CheckCheck, Check, Headset, RefreshCw } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAppPreferences, translate } from '@/components/app-preferences';

export const Route = createFileRoute('/live-chat')({
  component: LiveChatScreen,
});

type Message = {
  sender: 'user' | 'admin';
  text: string;
  read: boolean;
  timestamp?: number;
};

function LiveChatScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchChat = async () => {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' });
      if (res.ok) setMessages(await res.json());
      await fetch('/api/chat/read', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchChat();
    const interval = setInterval(fetchChat, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const textToSend = input.trim();
    setSending(true);
    setInput('');

    // Optimistic UI update
    const optimisticMessage: Message = {
      sender: 'user',
      text: textToSend,
      read: false,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }),
      });
      if (res.ok) {
        await fetchChat();
      } else {
        setInput(textToSend); // restore if failed
      }
    } catch {
      setInput(textToSend); // restore if error
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return '';
    }
  };

  return (
    <main className="home-page">
      <div className="home-shell acct-shell acct-plain">
        <header className="acct-header">
          <Button asChild variant="ghost" size="icon">
            <Link to="/profil" aria-label={tr('Kembali')}>
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <h1 className="font-bold text-base">{tr('Live Chat')}</h1>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </header>

        <div className="flex flex-col h-[65vh] p-4 bg-background rounded-2xl border border-border shadow-xs">
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 p-4">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Headset className="size-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">{tr('Layanan Pelanggan WebullXAU')}</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  {tr('Ada pertanyaan tentang deposit, penarikan, atau compounding? Tim support kami siap membantu Anda 24/7.')}
                </p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[82%] ${
                      isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {!isUser && (
                      <span className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
                        <Headset className="size-3" /> Customer Support
                      </span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-xs break-words whitespace-pre-wrap ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-br-xs'
                          : 'bg-card border border-border text-foreground rounded-bl-xs'
                      }`}
                    >
                      <p>{m.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground">
                      {m.timestamp && <span>{formatTime(m.timestamp)}</span>}
                      {isUser && (
                        <span className="inline-flex items-center gap-0.5">
                          {m.read ? (
                            <span className="text-emerald-500 flex items-center font-medium">
                              <CheckCheck className="size-3" /> {tr('Dibaca')}
                            </span>
                          ) : (
                            <span className="opacity-70 flex items-center">
                              <Check className="size-3" /> {tr('Terkirim')}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 pt-2 border-t border-border">
            <input
              ref={inputRef}
              className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={tr('Ketik pesan untuk support...')}
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 font-bold"
            >
              {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
