import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';

const slides = [
  {
    image: '/images/onboard-discover.png',
    titleKey: 'onboard.slide1.title',
    descKey: 'onboard.slide1.desc',
  },
  {
    image: '/images/onboard-ai.png',
    titleKey: 'onboard.slide2.title',
    descKey: 'onboard.slide2.desc',
  },
  {
    image: '/images/onboard-quote.png',
    titleKey: 'onboard.slide3.title',
    descKey: 'onboard.slide3.desc',
  },
];

export default function OnboardingScreen() {
  const { navigate } = useApp();
  const { t } = useLang();
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate('signin');
    }
  };

  const skip = () => navigate('signin');

  return (
    <div className="h-full w-full flex flex-col animate-fade-in" style={{ background: '#0A1628' }}>
      <button
        onClick={skip}
        className="absolute top-4 z-10 px-4 py-2 text-sm font-medium rounded-full"
        style={{ color: '#94A3B8', [t('onboard.skip') === 'تخطي' ? 'left' : 'right']: '16px' }}
      >
        {t('onboard.skip')}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16">
        <div className="w-full h-[280px] flex items-center justify-center mb-8">
          <img
            src={slides[current].image}
            alt={t(slides[current].titleKey)}
            className="w-full h-full object-contain transition-all duration-350"
          />
        </div>
        <h2 className="text-2xl font-bold text-white text-center">{t(slides[current].titleKey)}</h2>
        <p className="text-sm text-center leading-relaxed max-w-[280px] mt-3" style={{ color: '#94A3B8' }}>
          {t(slides[current].descKey)}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              background: i === current ? '#E53935' : '#243352',
            }}
          />
        ))}
      </div>

      <div className="px-6 pb-10">
        <button
          onClick={next}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base transition-all duration-200 card-bounce"
          style={{ background: '#E53935' }}
        >
          {current < slides.length - 1 ? t('onboard.continue') : t('onboard.getStarted')}
        </button>
      </div>
    </div>
  );
}
