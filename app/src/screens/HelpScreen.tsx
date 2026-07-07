import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { ChevronLeft, ChevronDown, Phone, Mail } from 'lucide-react';

const faqs = [
  { q: 'How do I find a factory?', a: 'Use the search bar on the Home screen or ask our AI assistant. You can filter by category, location, MOQ, and certifications.' },
  { q: 'How do I request a quotation?', a: 'Navigate to any factory profile and tap "Request Quotation". Fill in your product details, quantity, and specifications.' },
  { q: 'What does "Verified" mean?', a: 'Verified factories have been physically inspected by our team and have valid certifications (ISO, BSCI, etc.).' },
  { q: 'How does the AI assistant work?', a: 'Our AI understands your product requirements and matches you with the most suitable verified factories from our database.' },
  { q: 'Is my data secure?', a: 'Yes. We use industry-standard encryption for all communications and never share your contact details without permission.' },
  { q: 'Can I change the language?', a: 'Yes! Go to Profile > Language and switch between English and Arabic. The entire app will adapt including RTL layout.' },
];

export default function HelpScreen() {
  const { goBack } = useApp();
  const { t } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1A2744' }}>
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-white">{t('prof.help')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        <div className="flex flex-col gap-2 mb-6">
          {faqs.map((faq, i) => (
            <button key={i} onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full text-left rounded-xl overflow-hidden" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ color: '#94A3B8', transform: openIndex === i ? 'rotate(180deg)' : 'none' }} />
              </div>
              {openIndex === i && (
                <div className="px-4 pb-3">
                  <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{faq.a}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-white mb-3">Contact Us</h3>
        <div className="flex flex-col gap-2">
          <a href="https://wa.me/79888016699" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl card-press" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37, 211, 102, 0.1)' }}>
              <Phone className="w-4 h-4" style={{ color: '#25D366' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">WhatsApp</p>
              <p className="text-[11px]" style={{ color: '#94A3B8' }}>+7 988 801-66-99</p>
            </div>
          </a>
          <a href="mailto:info@chinafastlane.com" className="flex items-center gap-3 px-4 py-3 rounded-xl card-press" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(66, 165, 245, 0.1)' }}>
              <Mail className="w-4 h-4" style={{ color: '#42A5F5' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Email</p>
              <p className="text-[11px]" style={{ color: '#94A3B8' }}>info@chinafastlane.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
