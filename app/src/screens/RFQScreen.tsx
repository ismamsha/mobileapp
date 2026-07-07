import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { ChevronLeft, Package, Hash, DollarSign, MapPin, FileText } from 'lucide-react';

export default function RFQScreen() {
  const { goBack, selectedFactoryId } = useApp();
  const { t } = useLang();
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const factoryId = selectedFactoryId ? parseInt(selectedFactoryId) : undefined;

  const utils = trpc.useUtils();
  const createRFQ = trpc.rfq.create.useMutation({
    onSuccess: () => {
      utils.rfq.myList.invalidate();
      setSubmitted(true);
    },
  });

  const handleSubmit = () => {
    if (!productName.trim() || !quantity.trim()) return;
    createRFQ.mutate({
      factoryId,
      productName,
      quantity,
      specifications: specifications || undefined,
      targetPrice: targetPrice || undefined,
      deliveryLocation: deliveryLocation || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center px-6 animate-fade-in" style={{ background: '#0A1628' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(102, 187, 106, 0.15)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{t('rfq.sent')}</h2>
        <p className="text-sm text-center mb-8" style={{ color: '#94A3B8' }}>
          {t('rfq.sentDesc')}
        </p>
        <button
          onClick={goBack}
          className="w-full h-14 rounded-2xl font-semibold text-white card-bounce"
          style={{ background: '#E53935' }}
        >
          {t('rfq.back')}
        </button>
        <button
          onClick={() => { setSubmitted(false); setProductName(''); setQuantity(''); setSpecifications(''); setTargetPrice(''); setDeliveryLocation(''); }}
          className="w-full h-12 rounded-2xl font-medium text-sm mt-3"
          style={{ background: '#1A2744', color: '#94A3B8', border: '1px solid #243352' }}
        >
          {t('rfq.another')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col animate-slide-up" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1A2744' }}>
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-white">{t('rfq.title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-4">
        <p className="text-xs" style={{ color: '#94A3B8' }}>{t('rfq.subtitle')}</p>

        <div className="relative">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input type="text" placeholder={t('rfq.productName') + ' *'} value={productName} onChange={e => setProductName(e.target.value)}
            className="w-full h-14 rounded-2xl pl-12 pr-4 text-white text-sm outline-none" style={{ background: '#1A2744', border: '1px solid #243352' }} />
        </div>

        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input type="text" placeholder={t('rfq.quantity') + ' *'} value={quantity} onChange={e => setQuantity(e.target.value)}
            className="w-full h-14 rounded-2xl pl-12 pr-4 text-white text-sm outline-none" style={{ background: '#1A2744', border: '1px solid #243352' }} />
        </div>

        <div className="relative">
          <FileText className="absolute left-4 top-4 w-5 h-5" style={{ color: '#94A3B8' }} />
          <textarea placeholder={t('rfq.specs')} value={specifications} onChange={e => setSpecifications(e.target.value)}
            className="w-full rounded-2xl pl-12 pr-4 pt-3 text-white text-sm outline-none resize-none" style={{ background: '#1A2744', border: '1px solid #243352', height: '100px' }} />
        </div>

        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input type="text" placeholder={t('rfq.targetPrice')} value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
            className="w-full h-14 rounded-2xl pl-12 pr-4 text-white text-sm outline-none" style={{ background: '#1A2744', border: '1px solid #243352' }} />
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input type="text" placeholder={t('rfq.delivery')} value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)}
            className="w-full h-14 rounded-2xl pl-12 pr-4 text-white text-sm outline-none" style={{ background: '#1A2744', border: '1px solid #243352' }} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!productName.trim() || !quantity.trim() || createRFQ.isPending}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base mt-2 card-bounce disabled:opacity-50"
          style={{ background: '#E53935' }}
        >
          {createRFQ.isPending ? t('rfq.sending') : t('rfq.send')}
        </button>
      </div>
    </div>
  );
}
