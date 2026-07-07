import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '../providers/trpc';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function SignInScreen() {
  const { navigate } = useApp();
  const { t } = useLang();
  const utils = trpc.useUtils();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const devLogin = trpc.auth.devLogin.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      navigate('home');
    },
  });

  const devLoginAdmin = trpc.auth.devLoginAdmin.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      window.location.href = '/admin';
    },
  });

  const isAdminMode = window.location.search.includes('admin=1');

  const handleGuestLogin = () => {
    devLogin.mutate();
  };

  const handleAdminLogin = () => {
    devLoginAdmin.mutate();
  };

  const handleKimiLogin = () => {
    window.location.href = '/api/oauth/authorize';
  };

  const handleEmailLogin = () => {
    // For demo/testing, any non-empty input logs in as the test user.
    if (email.trim() && password.trim()) {
      if (isAdminMode) {
        devLoginAdmin.mutate();
      } else {
        devLogin.mutate();
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-slide-up" style={{ background: '#0A1628' }}>
      <div className="pt-14 px-6 mb-8">
        <img src="/images/logo.png" alt="ChinaFastLane" className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold text-white">{t('auth.welcomeBack')}</h1>
        <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
          {t('auth.signinSubtitle')}
        </p>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-4">
        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full h-14 rounded-2xl pl-12 pr-4 text-white text-sm outline-none transition-all"
            style={{ background: '#1A2744', border: '1px solid #243352' }}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94A3B8' }} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full h-14 rounded-2xl pl-12 pr-12 text-white text-sm outline-none transition-all"
            style={{ background: '#1A2744', border: '1px solid #243352' }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: '#94A3B8' }}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <button className="self-end text-sm font-medium" style={{ color: '#42A5F5' }}>
          {t('auth.forgotPassword')}
        </button>

        {/* Sign In Button */}
        <button
          onClick={handleEmailLogin}
          disabled={devLogin.isPending}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base mt-2 card-bounce"
          style={{ background: '#E53935', opacity: devLogin.isPending ? 0.7 : 1 }}
        >
          {devLogin.isPending ? '...' : t('auth.signIn')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: '#1A2744' }} />
          <span className="text-xs" style={{ color: '#94A3B8' }}>{t('auth.orContinueWith')}</span>
          <div className="flex-1 h-px" style={{ background: '#1A2744' }} />
        </div>

        {/* Kimi OAuth */}
        <button
          onClick={handleKimiLogin}
          disabled={devLogin.isPending}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold text-white card-bounce"
          style={{ background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)', border: '1px solid rgba(66, 165, 245, 0.3)', opacity: devLogin.isPending ? 0.7 : 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" x2="3" y1="12" y2="12"/>
          </svg>
          {t('auth.kimiLogin') || 'Sign in with Kimi'}
        </button>

        {/* Guest Login */}
        <button
          onClick={handleGuestLogin}
          disabled={devLogin.isPending}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold text-white card-bounce"
          style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', border: '1px solid rgba(229,57,53,0.3)', opacity: devLogin.isPending ? 0.7 : 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          {t('auth.guestLogin') || 'تسجيل الدخول كضيف'}
        </button>

        {/* Google */}
        <button
          onClick={handleGuestLogin}
          disabled={devLogin.isPending}
          className="flex-1 w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-white card-bounce"
          style={{ background: '#1A2744', border: '1px solid #243352', opacity: devLogin.isPending ? 0.7 : 1 }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        {/* Admin Login */}
        <button
          onClick={handleAdminLogin}
          disabled={devLoginAdmin.isPending}
          className="flex-1 w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-white card-bounce"
          style={{ background: '#0F1D32', border: '1px solid #1A2744', opacity: devLoginAdmin.isPending ? 0.7 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Admin Login
        </button>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          {t('auth.noAccount')}{' '}
          <button
            onClick={() => navigate('signup')}
            className="font-semibold"
            style={{ color: '#E53935' }}
          >
            {t('auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
}
