import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '../providers/trpc';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

export default function SignUpScreen() {
  const { navigate } = useApp();
  const { t } = useLang();
  const utils = trpc.useUtils();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const devLogin = trpc.auth.devLogin.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      navigate('home');
    },
  });

  const handleSignUp = () => {
    if (!agreed) return;
    devLogin.mutate();
  };

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="pt-14 px-6 mb-6">
        <button onClick={() => navigate('signin')} className="mb-4" style={{ color: '#94A3B8' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-white">{t('auth.createAccount')}</h1>
        <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
          {t('auth.signupSubtitle')}
        </p>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder={t('auth.fullName')}
            className="w-full rounded-2xl pl-12 pr-4 text-white text-sm outline-none"
            style={{ background: '#1A2744', border: '1px solid #243352', height: '52px' }}
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type="email"
            placeholder={t('auth.email')}
            className="w-full rounded-2xl pl-12 pr-4 text-white text-sm outline-none"
            style={{ background: '#1A2744', border: '1px solid #243352', height: '52px' }}
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type="tel"
            placeholder={t('auth.phone')}
            className="w-full rounded-2xl pl-12 pr-4 text-white text-sm outline-none"
            style={{ background: '#1A2744', border: '1px solid #243352', height: '52px' }}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password')}
            className="w-full rounded-2xl pl-12 pr-12 text-white text-sm outline-none"
            style={{ background: '#1A2744', border: '1px solid #243352', height: '52px' }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: '#94A3B8' }}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type="password"
            placeholder={t('auth.confirmPassword')}
            className="w-full rounded-2xl pl-12 pr-4 text-white text-sm outline-none"
            style={{ background: '#1A2744', border: '1px solid #243352', height: '52px' }}
          />
        </div>

        <label className="flex items-start gap-3 mt-1 cursor-pointer">
          <button
            onClick={() => setAgreed(!agreed)}
            className="w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
            style={{
              background: agreed ? '#E53935' : '#1A2744',
              border: `1.5px solid ${agreed ? '#E53935' : '#243352'}`,
            }}
          >
            {agreed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            )}
          </button>
          <span className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
            {t('auth.terms')}{' '}
            <span style={{ color: '#42A5F5' }}>{t('auth.termsService')}</span> {t('auth.and')}{' '}
            <span style={{ color: '#42A5F5' }}>{t('auth.privacyPolicy')}</span>
          </span>
        </label>

        <button
          onClick={handleSignUp}
          disabled={devLogin.isPending}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base mt-2 card-bounce"
          style={{ background: '#E53935', opacity: agreed && !devLogin.isPending ? 1 : 0.5 }}
        >
          {devLogin.isPending ? '...' : t('auth.createBtn')}
        </button>
      </div>

      <div className="px-6 py-6 text-center">
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          {t('auth.hasAccount')}{' '}
          <button
            onClick={() => navigate('signin')}
            className="font-semibold"
            style={{ color: '#E53935' }}
          >
            {t('auth.signInLink')}
          </button>
        </p>
      </div>
    </div>
  );
}
