import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

export default function SplashScreen() {
  const { navigate } = useApp();
  const { t } = useLang();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center animate-fade-in" style={{ background: '#0A1628' }}>
      <div className="flex flex-col items-center gap-6">
        <img
          src="/images/logo.png"
          alt="ChinaFastLane"
          className="w-28 h-28 object-contain animate-float"
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">ChinaFastLane</h1>
          <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
            {t('splash.tagline')}
          </p>
        </div>
      </div>
      <div className="absolute bottom-32 flex gap-2">
        <div className="w-2.5 h-2.5 rounded-full animate-loading-dot-1" style={{ background: '#E53935' }} />
        <div className="w-2.5 h-2.5 rounded-full animate-loading-dot-2" style={{ background: '#E53935' }} />
        <div className="w-2.5 h-2.5 rounded-full animate-loading-dot-3" style={{ background: '#E53935' }} />
      </div>
    </div>
  );
}
