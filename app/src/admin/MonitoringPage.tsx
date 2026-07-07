import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import {
  Activity, Database, Server, RefreshCw, AlertCircle, CheckCircle2, Clock,
  Terminal, Zap, Cpu, HardDrive, RotateCcw
} from 'lucide-react';

const LOG_LEVEL_COLORS: Record<string, string> = {
  error: '#EF5350',
  warn: '#F9A825',
  info: '#42A5F5',
  debug: '#94A3B8',
};

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

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = trpc.admin.health.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  });
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.logs.useQuery({ lines: 100 }, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const restart = trpc.admin.restartServer.useMutation({
    onSuccess: (data) => alert(data.message),
    onError: (err) => alert(err.message),
  });

  const refreshAll = () => {
    refetchHealth();
    refetchLogs();
  };

  const isProduction = health?.environment === 'production';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoring</h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Live system health, logs, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600"
            />
            Auto-refresh
          </label>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: '#0F1D32', border: '1px solid #1A2744', color: '#94A3B8' }}
          >
            <RefreshCw className={`w-4 h-4 ${healthLoading || logsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isProduction ? (
            <div className="px-4 py-2 rounded-xl text-xs" style={{ background: '#0F1D32', border: '1px solid #1A2744', color: '#94A3B8' }}>
              Restart is disabled in production. Stop the process and run <code className="text-white">npm run dev</code> to restart.
            </div>
          ) : (
            <button
              onClick={() => restart.mutate()}
              disabled={restart.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
              style={{ background: '#E53935', color: '#fff' }}
            >
              <RotateCcw className={`w-4 h-4 ${restart.isPending ? 'animate-spin' : ''}`} />
              {restart.isPending ? 'Restarting...' : 'Restart Server'}
            </button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: health?.db.status === 'healthy' ? 'rgba(102,187,106,0.1)' : 'rgba(239,83,80,0.1)', color: health?.db.status === 'healthy' ? '#66BB6A' : '#EF5350' }}>
              {health?.db.status === 'healthy' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>{health?.db.latencyMs ?? '--'}ms</span>
          </div>
          <p className="text-2xl font-bold text-white capitalize">{health?.db.status ?? '...'}</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Database</p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,168,37,0.1)', color: '#F9A825' }}>
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{health?.uptimeFormatted ?? '--'}</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Uptime</p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(66,165,245,0.1)', color: '#42A5F5' }}>
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{health?.loadAvg && health.loadAvg.some((v) => v > 0) ? health.loadAvg[0].toFixed(2) : 'N/A'}</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Load Average</p>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(171,71,188,0.1)', color: '#AB47BC' }}>
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{health?.memory ? `${health.memory.usedMB} MB` : '--'}</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Heap Memory</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Health Details */}
        <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health Details
          </h3>
          {health ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <Database className="w-4 h-4" /> DB Latency
                </div>
                <span className="text-sm font-medium text-white">{health.db.latencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <HardDrive className="w-4 h-4" /> Heap Memory
                </div>
                <span className="text-sm font-medium text-white">{health.memory.usedMB} / {health.memory.totalMB} MB</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <Cpu className="w-4 h-4" /> Load Average
                </div>
                <span className="text-sm font-medium text-white">{health.loadAvg.some((v) => v > 0) ? health.loadAvg.map((v) => v.toFixed(2)).join(' / ') : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <Server className="w-4 h-4" /> Uptime
                </div>
                <span className="text-sm font-medium text-white">{health.uptimeFormatted}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <Zap className="w-4 h-4" /> Version
                </div>
                <span className="text-sm font-medium text-white">v{health.version}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <Clock className="w-4 h-4" /> Started
                </div>
                <span className="text-sm font-medium text-white">{formatRelativeTime(health.startedAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <Terminal className="w-4 h-4" /> Environment
                </div>
                <span className="text-sm font-medium text-white capitalize">{health.environment}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#94A3B8' }}>Loading health data...</p>
          )}
        </div>

        {/* Counts Snapshot */}
        <div className="rounded-2xl p-6" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <h3 className="text-base font-semibold text-white mb-4">Counts Snapshot</h3>
          {health ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(health.counts).map(([key, value]) => (
                <div key={key} className="rounded-xl p-4 text-center" style={{ background: '#0A1628', border: '1px solid #1A2744' }}>
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#94A3B8' }}>{key}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#94A3B8' }}>Loading counts...</p>
          )}
        </div>

        {/* Recent Logs */}
        <div className="rounded-2xl p-6 flex flex-col col-span-1" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Recent Logs
            </h3>
            <span className="text-[10px]" style={{ color: '#64748B' }}>devserver.log</span>
          </div>
          <div className="flex-1 overflow-auto max-h-96 font-mono text-xs space-y-2">
            {logs && logs.length > 0 ? logs.map((log, idx) => (
              <div key={idx} className="p-2 rounded-lg" style={{ background: '#0A1628', border: '1px solid #1A2744' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{
                    background: `${LOG_LEVEL_COLORS[log.level] ?? '#94A3B8'}20`,
                    color: LOG_LEVEL_COLORS[log.level] ?? '#94A3B8',
                  }}>
                    {log.level}
                  </span>
                  <span style={{ color: '#64748B' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="break-all" style={{ color: '#CBD5E1' }}>{log.message}</p>
              </div>
            )) : (
              <p style={{ color: '#94A3B8' }}>No logs available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
