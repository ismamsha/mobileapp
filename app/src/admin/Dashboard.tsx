import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useMemo } from 'react';
import {
  Users, Factory, ClipboardList, Heart, MessageSquare, Star, TrendingUp, Clock,
  Activity, Server, Database, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F9A825',
  sent: '#42A5F5',
  responded: '#66BB6A',
  negotiating: '#AB47BC',
  accepted: '#26A69A',
  declined: '#EF5350',
};

const CHART_COLORS = ['#42A5F5', '#F9A825', '#66BB6A', '#E53935', '#AB47BC', '#26A69A', '#EF5350', '#EC407A'];

function formatRelativeTime(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function activityIcon(type: string) {
  switch (type) {
    case 'user_joined': return <Users className="w-4 h-4" />;
    case 'rfq_created': return <ClipboardList className="w-4 h-4" />;
    case 'factory_verified':
    case 'factory_created': return <Factory className="w-4 h-4" />;
    case 'chat_message': return <MessageSquare className="w-4 h-4" />;
    case 'favorite_added': return <Heart className="w-4 h-4" />;
    case 'review_posted': return <Star className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
}

function activityColor(type: string) {
  switch (type) {
    case 'user_joined': return '#42A5F5';
    case 'rfq_created': return '#66BB6A';
    case 'factory_verified': return '#26A69A';
    case 'factory_created': return '#F9A825';
    case 'chat_message': return '#AB47BC';
    case 'favorite_added': return '#E53935';
    case 'review_posted': return '#EC407A';
    default: return '#94A3B8';
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.stats.useQuery();
  const { data: feed, isLoading: feedLoading, refetch: refetchFeed } = trpc.admin.activityFeed.useQuery();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = trpc.admin.health.useQuery();

  const combinedLoading = statsLoading || feedLoading || healthLoading;

  const refreshAll = () => {
    refetchStats();
    refetchFeed();
    refetchHealth();
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    const usersTrend = stats.usersOverTime.length >= 2
      ? stats.usersOverTime[stats.usersOverTime.length - 1].count - stats.usersOverTime[stats.usersOverTime.length - 2].count
      : 0;
    const rfqsTrend = stats.rfqsOverTime.length >= 2
      ? stats.rfqsOverTime[stats.rfqsOverTime.length - 1].count - stats.rfqsOverTime[stats.rfqsOverTime.length - 2].count
      : 0;

    return [
      { icon: <Users className="w-6 h-6" />, label: 'Total Users', value: stats.counts.users, color: '#42A5F5', bg: 'rgba(66,165,245,0.1)', path: '/admin/users', trend: usersTrend },
      { icon: <Factory className="w-6 h-6" />, label: 'Factories', value: stats.counts.factories, color: '#F9A825', bg: 'rgba(249,168,37,0.1)', path: '/admin/factories', trend: 0 },
      { icon: <ClipboardList className="w-6 h-6" />, label: 'RFQs', value: stats.counts.rfqs, color: '#66BB6A', bg: 'rgba(102,187,106,0.1)', path: '/admin/rfqs', trend: rfqsTrend },
      { icon: <Heart className="w-6 h-6" />, label: 'Favorites', value: stats.counts.favorites, color: '#E53935', bg: 'rgba(229,57,53,0.1)', trend: 0 },
      { icon: <MessageSquare className="w-6 h-6" />, label: 'Chat Messages', value: stats.counts.chats, color: '#AB47BC', bg: 'rgba(171,71,188,0.1)', trend: 0 },
      { icon: <Star className="w-6 h-6" />, label: 'Avg Rating', value: stats.counts.avgRating, color: '#F9A825', bg: 'rgba(249,168,37,0.1)', path: '/admin/factories', trend: 0 },
      { icon: <TrendingUp className="w-6 h-6" />, label: 'Verified', value: stats.counts.verified, color: '#66BB6A', bg: 'rgba(102,187,106,0.1)', path: '/admin/factories', trend: 0 },
      { icon: <Clock className="w-6 h-6" />, label: 'Pending RFQs', value: stats.counts.pendingRFQs, color: '#EF5350', bg: 'rgba(239,83,80,0.1)', path: '/admin/rfqs', trend: 0 },
    ];
  }, [stats]);

  const chartLineData = useMemo(() => {
    if (!stats) return [];
    return stats.usersOverTime.map((u, i) => ({
      label: u.label,
      users: u.count,
      rfqs: stats.rfqsOverTime[i]?.count ?? 0,
    }));
  }, [stats]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return stats.rfqsByStatus.map((r) => ({ name: r.status, value: r.count }));
  }, [stats]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Overview of your platform</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={combinedLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: '#0F1D32', border: '1px solid #1A2744', color: '#94A3B8' }}
        >
          <RefreshCw className={`w-4 h-4 ${combinedLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {combinedLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#0F1D32' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map((card, i) => (
              <div
                key={i}
                onClick={() => card.path && navigate(card.path)}
                className={`rounded-2xl p-5 ${card.path ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                style={{ background: '#0F1D32', border: '1px solid #1A2744' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  {card.trend !== 0 && (
                    <div className="flex items-center gap-0.5 text-xs font-medium" style={{ color: card.trend > 0 ? '#66BB6A' : '#EF5350' }}>
                      {card.trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {Math.abs(card.trend)}
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <h3 className="text-base font-semibold text-white mb-4">Users & RFQs Over Time</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartLineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#1A2744" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickMargin={8} />
                    <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0F1D32', border: '1px solid #1A2744', borderRadius: '12px' }}
                      labelStyle={{ color: '#94A3B8' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ color: '#94A3B8' }} />
                    <Line type="monotone" dataKey="users" stroke="#42A5F5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="rfqs" stroke="#66BB6A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <h3 className="text-base font-semibold text-white mb-4">Factories by Category</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.factoriesByCategory ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#1A2744" strokeDasharray="3 3" />
                    <XAxis dataKey="nameEn" stroke="#94A3B8" fontSize={11} tickMargin={8} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0F1D32', border: '1px solid #1A2744', borderRadius: '12px' }}
                      labelStyle={{ color: '#94A3B8' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {(stats?.factoriesByCategory ?? []).map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <h3 className="text-base font-semibold text-white mb-4">RFQs by Status</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[entry.name] ?? CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0F1D32', border: '1px solid #1A2744', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ color: '#94A3B8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Health */}
            <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">System Health</h3>
                <button onClick={() => refetchHealth()} className="text-xs" style={{ color: '#94A3B8' }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              {health ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(66,165,245,0.1)', color: '#42A5F5' }}>
                        <Database className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-white">Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{health.db.latencyMs}ms</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                        background: health.db.status === 'healthy' ? 'rgba(102,187,106,0.1)' : 'rgba(239,83,80,0.1)',
                        color: health.db.status === 'healthy' ? '#66BB6A' : '#EF5350',
                      }}>
                        {health.db.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,168,37,0.1)', color: '#F9A825' }}>
                        <Server className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-white">Uptime</span>
                    </div>
                    <span className="text-sm font-medium text-white">{health.uptimeFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                    <span className="text-sm text-white">Version</span>
                    <span className="text-sm font-medium text-white">v{health.version}</span>
                  </div>
                  <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                    <span className="text-sm text-white">Environment</span>
                    <span className="text-sm font-medium text-white capitalize">{health.environment}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {Object.entries(health.counts).map(([key, value]) => (
                      <div key={key} className="rounded-xl p-2 text-center" style={{ background: '#0A1628' }}>
                        <p className="text-sm font-bold text-white">{value}</p>
                        <p className="text-[10px] capitalize" style={{ color: '#94A3B8' }}>{key}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#94A3B8' }}>Health data unavailable</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Recent RFQs */}
            <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <h3 className="text-base font-semibold text-white mb-4">Recent RFQs</h3>
              {stats?.recentRFQs && stats.recentRFQs.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {stats.recentRFQs.map((rfq) => (
                    <div key={rfq.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                      <div>
                        <p className="text-sm font-medium text-white">{rfq.productName}</p>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>by {rfq.userName || 'Unknown'} · Qty: {rfq.quantity}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                        background: rfq.status === 'pending' ? 'rgba(249,168,37,0.1)' : rfq.status === 'responded' ? 'rgba(102,187,106,0.1)' : 'rgba(66,165,245,0.1)',
                        color: rfq.status === 'pending' ? '#F9A825' : rfq.status === 'responded' ? '#66BB6A' : '#42A5F5',
                      }}>
                        {rfq.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#94A3B8' }}>No RFQs yet</p>
              )}
            </div>

            {/* Recent Users */}
            <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <h3 className="text-base font-semibold text-white mb-4">Recent Users</h3>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {stats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#E53935' }}>
                        {(user.name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user.name || 'Unknown'}</p>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>{user.email || 'No email'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                        background: user.role === 'admin' ? 'rgba(229,57,53,0.1)' : 'rgba(66,165,245,0.1)',
                        color: user.role === 'admin' ? '#E53935' : '#42A5F5',
                      }}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#94A3B8' }}>No users yet</p>
              )}
            </div>

            {/* Activity Feed */}
            <div className="rounded-2xl p-6 flex flex-col" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">Activity Feed</h3>
                <button onClick={() => refetchFeed()} className="text-xs" style={{ color: '#94A3B8' }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto max-h-80 flex flex-col gap-3">
                {feed && feed.length > 0 ? feed.map((event) => (
                  <div key={`${event.type}-${event.entityId}`} className="flex gap-3 py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `${activityColor(event.type)}20`, color: activityColor(event.type) }}>
                      {activityIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{event.title}</p>
                      <p className="text-[11px]" style={{ color: '#94A3B8' }}>{event.description}</p>
                      <p className="text-[10px] mt-1" style={{ color: '#64748B' }}>{formatRelativeTime(event.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: '#94A3B8' }}>No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
