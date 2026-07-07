import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import type { ReactNode } from 'react';
import { ChevronLeft, Package, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: ReactNode }> = {
  pending: { label: 'Pending', color: '#F9A825', bg: 'rgba(249,168,37,0.1)', icon: <Clock className="w-3 h-3" /> },
  sent: { label: 'Sent', color: '#42A5F5', bg: 'rgba(66,165,245,0.1)', icon: <MessageSquare className="w-3 h-3" /> },
  responded: { label: 'Responded', color: '#66BB6A', bg: 'rgba(102,187,106,0.1)', icon: <CheckCircle className="w-3 h-3" /> },
  negotiating: { label: 'Negotiating', color: '#F9A825', bg: 'rgba(249,168,37,0.1)', icon: <MessageSquare className="w-3 h-3" /> },
  accepted: { label: 'Accepted', color: '#66BB6A', bg: 'rgba(102,187,106,0.1)', icon: <CheckCircle className="w-3 h-3" /> },
  declined: { label: 'Declined', color: '#E53935', bg: 'rgba(229,57,53,0.1)', icon: <XCircle className="w-3 h-3" /> },
};

export default function MyRFQsScreen() {
  const { goBack } = useApp();
  const { t } = useLang();
  const { data: rfqs, isLoading } = trpc.rfq.myList.useQuery(undefined, { retry: false });

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1A2744' }}>
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-white">{t('prof.myRFQs')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="w-full h-24 rounded-2xl animate-shimmer" style={{background:'#0F1D32'}}/>)}</div>
        ) : rfqs && rfqs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {rfqs.map((rfq: any) => {
              const s = statusConfig[rfq.status] || statusConfig.pending;
              return (
                <div key={rfq.id} className="w-full rounded-2xl p-4" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" style={{ color: '#42A5F5' }} />
                      <span className="text-sm font-semibold text-white">{rfq.productName}</span>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: s.color, background: s.bg }}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Qty: {rfq.quantity}</p>
                  {rfq.specifications && <p className="text-xs mb-1 line-clamp-2" style={{ color: '#94A3B8' }}>{rfq.specifications}</p>}
                  {rfq.response && (
                    <div className="mt-2 p-2 rounded-lg" style={{ background: '#1A2744' }}>
                      <p className="text-xs font-medium" style={{ color: '#66BB6A' }}>Factory Response:</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{rfq.response}</p>
                      <div className="flex gap-3 mt-1.5">
                        {rfq.responsePrice && <p className="text-[10px]" style={{ color: '#F9A825' }}>Price: {rfq.responsePrice}</p>}
                        {rfq.responseLeadTime && <p className="text-[10px]" style={{ color: '#42A5F5' }}>Lead time: {rfq.responseLeadTime}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#0F1D32' }}>
              <Package className="w-7 h-7" style={{ color: '#94A3B8' }} />
            </div>
            <p className="text-sm font-medium text-white">No RFQs yet</p>
            <p className="text-xs text-center max-w-[200px]" style={{ color: '#94A3B8' }}>Send a quotation request to any factory and track it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
