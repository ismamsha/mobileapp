import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { ChevronLeft, Globe, Users, Factory, Award, TrendingUp } from 'lucide-react';

export default function AboutScreen() {
  const { goBack } = useApp();
  const { t } = useLang();

  const stats = [
    { icon: <Factory className="w-5 h-5" style={{ color: '#E53935' }} />, value: '500+', label: 'Verified Factories' },
    { icon: <Users className="w-5 h-5" style={{ color: '#42A5F5' }} />, value: '50+', label: 'Countries Served' },
    { icon: <Award className="w-5 h-5" style={{ color: '#F9A825' }} />, value: '98%', label: 'Satisfaction Rate' },
    { icon: <TrendingUp className="w-5 h-5" style={{ color: '#66BB6A' }} />, value: '10+', label: 'Years Experience' },
  ];

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1A2744' }}>
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-white">{t('prof.about')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="flex flex-col items-center mb-6">
          <img src="/images/logo.png" alt="ChinaFastLane" className="w-20 h-20 mb-3" />
          <h2 className="text-xl font-bold text-white">ChinaFastLane</h2>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Your Bridge to China's Best Factories</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>v1.0.0</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-4 rounded-2xl" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              {s.icon}
              <span className="text-lg font-bold text-white">{s.value}</span>
              <span className="text-[10px] text-center px-2" style={{ color: '#94A3B8' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">About Us</h3>
          <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
            ChinaFastLane is an AI-powered factory discovery platform connecting global buyers with verified Chinese manufacturers. With over 10 years of sourcing expertise, we help businesses find reliable suppliers, manage procurement, inspect quality, and deliver worldwide.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">Our Services</h3>
          <div className="flex flex-col gap-2">
            {['Factory Discovery', 'Quality Inspection', 'Logistics & Shipping', 'Customs Clearance', 'AI Sourcing Assistant'].map((service, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#0F1D32' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#E53935' }} />
                <span className="text-sm text-white">{service}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">Contact</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: '#0F1D32' }}>
              <Globe className="w-4 h-4" style={{ color: '#42A5F5' }} />
              <span className="text-xs" style={{ color: '#94A3B8' }}>www.chinafastlane.com</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-center mb-4" style={{ color: '#6B7280' }}> ChinaFastLane. All rights reserved.</p>
      </div>
    </div>
  );
}
