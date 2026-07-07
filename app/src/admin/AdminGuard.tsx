import { trpc } from '@/providers/trpc';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0A1628' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E53935', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#94A3B8' }}>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0A1628' }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
            You need to sign in as an administrator to view this page.
          </p>
          <a
            href="/?admin=1"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#E53935' }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
