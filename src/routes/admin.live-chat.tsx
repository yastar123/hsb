import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Headset, Send, CheckCheck, Check, Search, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { useAppPreferences, translate } from '@/components/app-preferences';
import { useLedger } from '@/components/ledger-content';

export const Route = createFileRoute('/admin/live-chat')({
  component: AdminLiveChatScreen,
});

type ChatUserItem = {
  userId: string;
  name: string;
  email: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: number;
  lastSender?: string;
};

type ChatMessage = {
  sender: 'user' | 'admin';
  text: string;
  read: boolean;
  timestamp?: number;
};

const QUICK_REPLIES = [
  'Halo! Ada yang bisa kami bantu?',
  'Permintaan Anda sedang kami verifikasi, mohon ditunggu sebentar ya.',
  'Deposit Anda telah berhasil diverifikasi dan masuk ke saldo.',
  'Penarikan dana Anda sedang diproses oleh tim keuangan kami.',
  'Terima kasih telah menghubungi layanan pelanggan WebullXAU.',
];

function AdminLiveChatScreen() {
  const { language } = useAppPreferences();
  const tr = (text: string) => translate(text, language);
  const { users } = useLedger();

  const [chatUsers, setChatUsers] = useState<ChatUserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  selectedUserIdRef.current = selectedUserId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch list of users with chat history
  const fetchChatUsers = async () => {
    try {
      const res = await fetch('/api/admin/chat/users', { cache: 'no-store' });
      if (res.ok) {
        const data: ChatUserItem[] = await res.json();
        setChatUsers(data);
        // Only set default if no user is currently selected
        if (!selectedUserIdRef.current && data.length > 0) {
          setSelectedUserId(data[0].userId);
        }
      }
    } catch {
      // ignore network errors on polling
    }
  };

  useEffect(() => {
    void fetchChatUsers();
    const interval = setInterval(fetchChatUsers, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for active user
  const fetchChat = async (targetId?: string) => {
    const activeId = targetId || selectedUserIdRef.current;
    if (!activeId) return;
    try {
      const res = await fetch(`/api/admin/chat/${encodeURIComponent(activeId)}`, { cache: 'no-store' });
      if (res.ok) {
        const chatData: ChatMessage[] = await res.json();
        setMessages(chatData);
      }
      await fetch(`/api/admin/chat/${encodeURIComponent(activeId)}/read`, { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    setSendError(null);
    void fetchChat(selectedUserId);
    const interval = setInterval(() => {
      if (selectedUserIdRef.current) {
        void fetchChat(selectedUserIdRef.current);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Combine chat users and general users list
  const combinedUsers = useMemo(() => {
    const userMap = new Map<string, ChatUserItem>();

    // Seed from all registered users
    users.forEach((u) => {
      userMap.set(u.id, {
        userId: u.id,
        name: u.name,
        email: u.email,
        unreadCount: 0,
        lastMessage: '',
        lastTimestamp: 0,
      });
    });

    // Merge with actual active chat data (includes unread counts and latest messages)
    chatUsers.forEach((cu) => {
      const existing = userMap.get(cu.userId);
      userMap.set(cu.userId, {
        userId: cu.userId,
        name: cu.name || existing?.name || 'Trader WebullXAU',
        email: cu.email || existing?.email || cu.userId,
        unreadCount: cu.unreadCount ?? 0,
        lastMessage: cu.lastMessage ?? '',
        lastTimestamp: cu.lastTimestamp ?? 0,
        lastSender: cu.lastSender,
      });
    });

    const list = Array.from(userMap.values());
    list.sort((a, b) => {
      if ((b.unreadCount || 0) !== (a.unreadCount || 0)) {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      }
      return (b.lastTimestamp || 0) - (a.lastTimestamp || 0);
    });

    return list;
  }, [users, chatUsers]);

  // Filtered by search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return combinedUsers;
    return combinedUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [combinedUsers, searchQuery]);

  // Current selected user object
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return combinedUsers.find((u) => u.userId === selectedUserId) || null;
  }, [combinedUsers, selectedUserId]);

  // Auto-select first available user if none is selected
  useEffect(() => {
    if (!selectedUserId && combinedUsers.length > 0) {
      setSelectedUserId(combinedUsers[0].userId);
    }
  }, [combinedUsers, selectedUserId]);

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedUserId || sending) return;

    const textToSend = input.trim();
    const currentTargetId = selectedUserId;
    setSending(true);
    setSendError(null);
    setInput('');

    // Optimistically add message to current thread
    const optimisticMessage: ChatMessage = {
      sender: 'admin',
      text: textToSend,
      read: false,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/admin/chat/${encodeURIComponent(currentTargetId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }),
      });

      if (res.ok) {
        await fetchChat(currentTargetId);
        void fetchChatUsers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setInput(textToSend); // Restore user text so it is not lost
        setSendError(errorData.error || 'Gagal mengirim pesan. Silakan coba lagi.');
      }
    } catch {
      setInput(textToSend); // Restore user text
      setSendError('Terjadi gangguan koneksi saat mengirim pesan.');
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
    <main className="min-w-0 bg-muted/60 p-3 text-foreground sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headset className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{tr('Live Chat Customer Support')}</h1>
            <p className="text-xs text-muted-foreground">{tr('Dukungan pelanggan dan balasan percakapan pengguna secara langsung')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void fetchChatUsers();
            if (selectedUserId) void fetchChat(selectedUserId);
          }}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="size-3.5" />
          {tr('Segarkan')}
        </Button>
      </header>

      {sendError && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{sendError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSendError(null)} className="h-6 px-2 text-xs">
            {tr('Tutup')}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left column: User List */}
        <section className="md:col-span-1 flex flex-col bg-card rounded-2xl border border-border h-[72vh] shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border bg-card">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {tr('Percakapan Pengguna')} ({combinedUsers.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <input
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={tr('Cari nama atau email...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searchQuery ? tr('Pengguna tidak ditemukan') : tr('Belum ada pengguna')}
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUserId === u.userId;
                const hasUnread = (u.unreadCount || 0) > 0;
                return (
                  <button
                    key={u.userId}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.userId);
                      selectedUserIdRef.current = u.userId;
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-sm'
                        : hasUnread
                        ? 'bg-primary/5 hover:bg-primary/10 border-primary/30 text-foreground'
                        : 'hover:bg-muted/80 border-transparent text-foreground'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">{u.name}</span>
                        {hasUnread && !isSelected && (
                          <span className="shrink-0 size-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {u.email}
                      </div>
                      {u.lastMessage && (
                        <div className={`text-[10px] truncate mt-1 ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground/80'}`}>
                          {u.lastSender === 'admin' ? 'Anda: ' : ''}{u.lastMessage}
                        </div>
                      )}
                    </div>
                    {hasUnread && !isSelected && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-xs">
                        {u.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right column: Chat conversation window */}
        <section className="md:col-span-3 flex flex-col bg-card rounded-2xl border border-border h-[72vh] shadow-sm overflow-hidden">
          {/* Chat Header */}
          <header className="p-3.5 border-b border-border bg-card flex items-center justify-between gap-2">
            {selectedUser ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-foreground truncate">{selectedUser.name}</h2>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
              </div>
            ) : (
              <h2 className="font-semibold text-sm text-muted-foreground">
                {tr('Pilih pengguna untuk mulai percakapan')}
              </h2>
            )}

            {selectedUser && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {tr('Live Support Aktif')}
                </span>
              </div>
            )}
          </header>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                <MessageSquare className="size-10 opacity-30" />
                <p className="text-sm">{tr('Silakan pilih salah satu pengguna dari panel kiri.')}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                <MessageSquare className="size-10 opacity-30" />
                <p className="text-sm font-medium">{tr('Belum ada pesan dalam percakapan ini.')}</p>
                <p className="text-xs opacity-75">{tr('Kirim pesan pertama untuk memulai obrolan dengan pengguna ini.')}</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isAdmin = m.sender === 'admin';
                return (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[78%] ${
                      isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-xs break-words whitespace-pre-wrap ${
                        isAdmin
                          ? 'bg-primary text-primary-foreground rounded-br-xs'
                          : 'bg-card border border-border text-foreground rounded-bl-xs'
                      }`}
                    >
                      <p>{m.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-muted-foreground">
                      {m.timestamp && <span>{formatTime(m.timestamp)}</span>}
                      {isAdmin && (
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

          {/* Canned Quick Replies */}
          {selectedUser && (
            <div className="px-3 py-1.5 border-t border-border/60 bg-card overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
                {tr('Template:')}
              </span>
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInput(reply)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/80 shrink-0 text-muted-foreground hover:border-primary/30"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          {selectedUser && (
            <form onSubmit={send} className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                ref={inputRef}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                value={input}
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={tr('Ketik balasan admin... (Tekan Enter untuk kirim)')}
              />
              <Button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-10 px-4 shrink-0 font-semibold gap-1.5"
              >
                {sending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" />
                    <span className="hidden sm:inline">{tr('Kirim')}</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
