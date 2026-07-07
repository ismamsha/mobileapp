import { useEffect, useState } from 'react';
import { trpc } from '@/providers/trpc';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../api/router';
import { ClipboardList, Search, Send, Clock, CheckCircle, XCircle, MessageSquare, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';

type AdminOutputs = inferRouterOutputs<AppRouter>['admin'];
type RFQListItem = AdminOutputs['rfqList']['items'][number];
type RFQStatus = RFQListItem['status'];
type StatusFilter = 'all' | RFQStatus;

const PAGE_SIZE = 10;

const statusConfig: Record<RFQStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: '#F9A825', bg: 'rgba(249,168,37,0.1)', icon: <Clock className="w-3 h-3" /> },
  sent: { label: 'Sent', color: '#42A5F5', bg: 'rgba(66,165,245,0.1)', icon: <MessageSquare className="w-3 h-3" /> },
  responded: { label: 'Responded', color: '#66BB6A', bg: 'rgba(102,187,106,0.1)', icon: <CheckCircle className="w-3 h-3" /> },
  negotiating: { label: 'Negotiating', color: '#F9A825', bg: 'rgba(249,168,37,0.1)', icon: <MessageSquare className="w-3 h-3" /> },
  accepted: { label: 'Accepted', color: '#66BB6A', bg: 'rgba(102,187,106,0.1)', icon: <CheckCircle className="w-3 h-3" /> },
  declined: { label: 'Declined', color: '#E53935', bg: 'rgba(229,57,53,0.1)', icon: <XCircle className="w-3 h-3" /> },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'responded', label: 'Responded' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

function Select({ label, value, onChange, options }: { label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color: '#94A3B8' }}>{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none appearance-none"
        style={{ background: '#1A2744', border: '1px solid #243352' }}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl p-6 m-4" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: '#1A2744' }}><X className="w-4 h-4" style={{ color: '#94A3B8' }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function RFQsPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [responding, setResponding] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responsePrice, setResponsePrice] = useState('');
  const [responseLeadTime, setResponseLeadTime] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: rfqsData, isLoading } = trpc.admin.rfqList.useQuery({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    sortOrder,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: detail } = trpc.admin.rfqDetail.useQuery(
    { id: detailId! },
    { enabled: !!detailId }
  );

  const respond = trpc.admin.rfqRespond.useMutation({
    onSuccess: () => {
      utils.admin.rfqList.invalidate();
      utils.admin.stats.invalidate();
      setResponding(null);
      setResponseText('');
      setResponsePrice('');
      setResponseLeadTime('');
    },
  });
  const updateStatus = trpc.admin.rfqUpdateStatus.useMutation({
    onSuccess: () => { utils.admin.rfqList.invalidate(); utils.admin.stats.invalidate(); },
  });
  const bulkUpdate = trpc.admin.rfqBulkUpdateStatus.useMutation({
    onSuccess: () => { utils.admin.rfqList.invalidate(); utils.admin.stats.invalidate(); setSelected([]); },
  });

  const toggleSelectAll = () => {
    const ids = rfqsData?.items.map((r) => r.id) ?? [];
    setSelected(selected.length === ids.length ? [] : ids);
  };

  const toggleSelect = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const handleBulkStatus = (newStatus: RFQStatus) => {
    if (selected.length === 0) return;
    bulkUpdate.mutate({ ids: selected, status: newStatus });
  };

  const openRespond = (rfq: RFQListItem) => {
    setResponding(rfq.id);
    setResponseText(rfq.response || '');
    setResponsePrice(rfq.responsePrice || '');
    setResponseLeadTime(rfq.responseLeadTime || '');
  };

  const totalPages = Math.max(1, Math.ceil((rfqsData?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">RFQs</h2>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Manage quotation requests</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <ClipboardList className="w-4 h-4" style={{ color: '#94A3B8' }} />
          <span className="text-sm font-medium text-white">{rfqsData?.total ?? 0} total</span>
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl pl-10 pr-4 text-sm text-white outline-none"
              style={{ background: '#1A2744', border: '1px solid #243352' }}
            />
          </div>
          <Select label="Status" value={status} onChange={(v) => { setStatus(v as StatusFilter); setPage(1); }} options={STATUS_OPTIONS} />
          <Select label="Sort" value={sortOrder} onChange={(v) => setSortOrder(v as 'asc' | 'desc')} options={[{ value: 'desc', label: 'Newest First' }, { value: 'asc', label: 'Oldest First' }]} />
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: '#1A2744', border: '1px solid #243352' }}>
          <span className="text-sm text-white">{selected.length} selected</span>
          {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((s) => (
            <button key={s.value} onClick={() => handleBulkStatus(s.value as RFQStatus)} disabled={bulkUpdate.isPending} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: statusConfig[s.value as RFQStatus].color }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl p-6" style={{ background: '#0F1D32' }}>
          <div className="h-64 animate-shimmer rounded-xl" style={{ background: '#1A2744' }} />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1A2744' }}>
                <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: '#94A3B8' }}>
                  <input
                    type="checkbox"
                    checked={rfqsData?.items.length ? selected.length === rfqsData.items.length : false}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                {['Product', 'User', 'Qty', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: '#94A3B8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rfqsData?.items.map((rfq) => {
                const s = statusConfig[rfq.status] || statusConfig.pending;
                return (
                  <tr key={rfq.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid #1A2744' }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(rfq.id)} onChange={() => toggleSelect(rfq.id)} className="w-4 h-4 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{rfq.productName}</p>
                      {rfq.targetPrice && <p className="text-[10px]" style={{ color: '#94A3B8' }}>Target: {rfq.targetPrice}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{rfq.userName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#94A3B8' }}>{rfq.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit" style={{ color: s.color, background: s.bg }}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94A3B8' }}>{rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button title="View details" onClick={() => setDetailId(rfq.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                          <Eye className="w-3.5 h-3.5" style={{ color: '#42A5F5' }} />
                        </button>
                        <button onClick={() => openRespond(rfq)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1A2744' }}>
                          <Send className="w-3.5 h-3.5" style={{ color: '#66BB6A' }} />
                        </button>
                        {rfq.status !== 'accepted' && (
                          <button onClick={() => updateStatus.mutate({ id: rfq.id, status: 'accepted' })} disabled={updateStatus.isPending}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: '#66BB6A' }}>Accept</button>
                        )}
                        {rfq.status !== 'declined' && (
                          <button onClick={() => updateStatus.mutate({ id: rfq.id, status: 'declined' })} disabled={updateStatus.isPending}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: '#E53935' }}>Decline</button>
                        )}
                        {rfq.status !== 'negotiating' && (
                          <button onClick={() => updateStatus.mutate({ id: rfq.id, status: 'negotiating' })} disabled={updateStatus.isPending}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: '#AB47BC' }}>Negotiate</button>
                        )}
                        {rfq.status !== 'pending' && (
                          <button onClick={() => updateStatus.mutate({ id: rfq.id, status: 'pending' })} disabled={updateStatus.isPending}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: '#6B7280' }}>Reset</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1A2744' }}>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Showing {rfqsData?.items.length ?? 0} of {rfqsData?.total ?? 0} RFQs</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ background: '#1A2744' }}>
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-sm text-white">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ background: '#1A2744' }}>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {rfqsData?.items.length === 0 && (
            <div className="text-center py-12"><p className="text-sm" style={{ color: '#94A3B8' }}>No RFQs found</p></div>
          )}
        </div>
      )}

      {responding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setResponding(null)} />
          <div className="relative w-full max-w-lg rounded-2xl p-6 m-4" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
            <h3 className="text-base font-semibold text-white mb-4">Respond to RFQ</h3>
            <textarea placeholder="Write your response..." value={responseText} onChange={(e) => setResponseText(e.target.value)}
              className="w-full h-24 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none mb-3" style={{ background: '#1A2744', border: '1px solid #243352' }} />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Price offer" value={responsePrice} onChange={(e) => setResponsePrice(e.target.value)}
                className="h-10 rounded-xl px-3 text-sm text-white outline-none" style={{ background: '#1A2744', border: '1px solid #243352' }} />
              <input placeholder="Lead time" value={responseLeadTime} onChange={(e) => setResponseLeadTime(e.target.value)}
                className="h-10 rounded-xl px-3 text-sm text-white outline-none" style={{ background: '#1A2744', border: '1px solid #243352' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (responseText.trim()) respond.mutate({ id: responding, response: responseText, responsePrice: responsePrice || undefined, responseLeadTime: responseLeadTime || undefined, status: 'responded' }); }}
                disabled={respond.isPending} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#66BB6A' }}>
                {respond.isPending ? 'Sending...' : 'Send Response'}
              </button>
              <button onClick={() => setResponding(null)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#1A2744', color: '#94A3B8' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="RFQ Detail">
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white">{detail.productName}</h4>
                <p className="text-sm" style={{ color: '#94A3B8' }}>By {detail.userName || 'Unknown'} · {detail.userEmail || 'No email'}</p>
                {detail.factoryName && <p className="text-sm mt-1" style={{ color: '#F9A825' }}>Factory: {detail.factoryName}</p>}
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: statusConfig[detail.status]?.color, background: statusConfig[detail.status]?.bg }}>
                {statusConfig[detail.status]?.icon} {statusConfig[detail.status]?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <p className="text-xs" style={{ color: '#94A3B8' }}>Quantity</p>
                <p className="text-sm font-medium text-white">{detail.quantity}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <p className="text-xs" style={{ color: '#94A3B8' }}>Target Price</p>
                <p className="text-sm font-medium text-white">{detail.targetPrice || '-'}</p>
              </div>
            </div>
            {detail.specifications && (
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <p className="text-xs" style={{ color: '#94A3B8' }}>Specifications</p>
                <p className="text-sm text-white mt-1">{detail.specifications}</p>
              </div>
            )}
            {detail.deliveryLocation && (
              <div className="rounded-xl p-3" style={{ background: '#1A2744' }}>
                <p className="text-xs" style={{ color: '#94A3B8' }}>Delivery Location</p>
                <p className="text-sm text-white mt-1">{detail.deliveryLocation}</p>
              </div>
            )}
            {detail.response && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(102,187,106,0.1)', border: '1px solid rgba(102,187,106,0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#66BB6A' }}>Response</p>
                <p className="text-sm text-white">{detail.response}</p>
                <div className="flex gap-4 mt-2">
                  {detail.responsePrice && <p className="text-xs" style={{ color: '#F9A825' }}>Price: {detail.responsePrice}</p>}
                  {detail.responseLeadTime && <p className="text-xs" style={{ color: '#42A5F5' }}>Lead time: {detail.responseLeadTime}</p>}
                </div>
              </div>
            )}
            <p className="text-xs" style={{ color: '#6B7280' }}>Created {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '-'}</p>
          </div>
        ) : (
          <div className="h-40 animate-shimmer rounded-xl" style={{ background: '#1A2744' }} />
        )}
      </Modal>
    </div>
  );
}
