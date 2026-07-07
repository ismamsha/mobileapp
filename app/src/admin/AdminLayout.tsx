import { Link, useLocation } from 'react-router';
import { LayoutDashboard, Factory, Users, ClipboardList, Settings, LogOut, Activity } from 'lucide-react';
import { trpc } from '@/providers/trpc';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/admin/factories', label: 'Factories', icon: <Factory className="w-5 h-5" /> },
  { path: '/admin/rfqs', label: 'RFQs', icon: <ClipboardList className="w-5 h-5" /> },
  { path: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { path: '/admin/monitoring', label: 'Monitoring', icon: <Activity className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = '/'; },
  });

  return (
    <div className="flex h-screen w-screen" style={{ background: '#0A1628' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#0F1D32', borderRight: '1px solid #1A2744' }}>
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid #1A2744' }}>
          <img src="/images/logo.png" alt="CFL" className="w-8 h-8" />
          <div>
            <h1 className="text-sm font-bold text-white">ChinaFastLane</h1>
            <p className="text-[10px]" style={{ color: '#94A3B8' }}>Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? '#E53935' : 'transparent',
                  color: isActive ? '#fff' : '#94A3B8',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid #1A2744' }}>
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2" style={{ color: '#94A3B8' }}>
            <Settings className="w-5 h-5" />
            Back to App
          </a>
          <button onClick={() => logout.mutate()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all" style={{ color: '#E53935' }}>
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
