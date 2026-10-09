import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LayoutDashboard, House, ExternalLink, ChartNoAxesColumn, Wallet, Handshake, CircleHelp, Users, ArrowUpFromLine, Bell, Newspaper, CalendarDays, Headset, ClipboardCheck, LogOut, TrendingUp } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLedger } from '@/components/ledger-content';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

const items = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Kelola Beranda', url: '/admin/beranda', icon: House },
  { title: 'Kelola Pasar', url: '/admin/pasar', icon: ChartNoAxesColumn },
  { title: 'Kelola Mitra', url: '/admin/mitra', icon: Handshake },
  { title: 'Kelola Deposit', url: '/admin/deposit', icon: Wallet },
  { title: 'Verifikasi Deposit', url: '/admin/deposit-verifikasi', icon: ClipboardCheck },
  { title: 'Kelola User', url: '/admin/user', icon: Users },
  { title: 'Compounding', url: '/admin/compounding', icon: TrendingUp },
  { title: 'Kelola Withdraw', url: '/admin/withdraw', icon: ArrowUpFromLine },
  { title: 'Kelola Berita', url: '/admin/berita', icon: Newspaper },
  { title: 'Kalender Ekonomi', url: '/admin/kalender', icon: CalendarDays },
  { title: 'Layanan Pelanggan', url: '/admin/layanan', icon: Headset },
  { title: 'Kelola Notifikasi', url: '/admin/notifikasi', icon: Bell },
] as const;

function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname.replace(/\/$/, '') || '/' });
  const navigate = useNavigate();
  const { logout } = useLedger();
  return <Sidebar collapsible="icon">
    <SidebarHeader><div className="flex items-center gap-2 px-1 py-1"><img src="/logo.jpg" alt="" width="24" height="24" className="rounded-full object-cover" /><span className="font-bold group-data-[collapsible=icon]:hidden">HSB Admin</span></div></SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent><SidebarMenu>
          {items.map((it) => <SidebarMenuItem key={it.url}><SidebarMenuButton asChild isActive={path === it.url} tooltip={it.title}><Link to={it.url}><it.icon /><span>{it.title}</span></Link></SidebarMenuButton></SidebarMenuItem>)}
        </SidebarMenu></SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Situs</SidebarGroupLabel>
        <SidebarGroupContent><SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton asChild tooltip="Lihat Beranda"><Link to="/beranda"><ExternalLink /><span>Lihat Beranda</span></Link></SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton tooltip="Keluar" onClick={async () => { await logout(); void navigate({ to: '/login' }); }}><LogOut /><span>Keluar</span></SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu></SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>;
}

function AdminLayout() {
  const { currentUser, loading } = useLedger();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser && currentUser.role !== 'admin' && !currentUser.isAdmin) {
      void navigate({ to: '/login' });
    }
  }, [currentUser, loading, navigate]);

  return <SidebarProvider>
    <div className="flex min-h-screen w-full bg-muted">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-border bg-background px-2"><SidebarTrigger /><span className="text-sm font-semibold">Panel Admin</span></header>
        <div className="flex-1"><Outlet /></div>
      </div>
    </div>
  </SidebarProvider>;
}
