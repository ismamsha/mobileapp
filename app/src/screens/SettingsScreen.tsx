import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { ChevronLeft, Shield, Bell, Globe, Moon, Smartphone, CircleHelp, Trash2 } from 'lucide-react';

export default function SettingsScreen() {
  const { goBack, navigate, isDarkMode, toggleTheme } = useApp();
  const { lang, setLang, t } = useLang();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.reload(); },
  });

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: <Shield className="w-5 h-5" style={{ color: '#94A3B8' }} />, label: 'Privacy & Security', action: () => navigate('about') },
        { icon: <Bell className="w-5 h-5" style={{ color: '#94A3B8' }} />, label: 'Notifications', action: () => navigate('notifications') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: <Globe className="w-5 h-5" style={{ color: '#94A3B8' }} />, label: `Language: ${lang.toUpperCase()}`, action: () => setLang(lang === 'en' ? 'ar' : 'en') },
        { icon: <Moon className="w-5 h-5" style={{ color: '#94A3B8' }} />, label: `Dark Mode: ${isDarkMode ? 'On' : 'Off'}`, action: toggleTheme },
        { icon: <Smartphone className="w-5 h-5" style={{ color: '#94A3B8' }} />, label: 'App Version: 1.0.0', action: () => window.alert('App Version: 1.0.0') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: <CircleHelp className="w-5 h-5" style={{ color: '#94A3B8' }} />, label: 'Help Center', action: () => navigate('help') },
      ],
    },
  ];

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1A2744' }}>
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-white">{t('prof.settings')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {settingsGroups.map((group, gi) => (
          <div key={gi} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>{group.title}</h3>
            <div className="flex flex-col rounded-xl overflow-hidden" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              {group.items.map((item, ii) => (
                <button key={ii} onClick={item.action} className="flex items-center justify-between px-3 py-3.5 text-left card-press" style={{ borderBottom: ii < group.items.length - 1 ? '1px solid #1A2744' : 'none' }}>
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => logout.mutate()}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold mb-4 card-bounce"
          style={{ border: '1.5px solid #E53935', color: '#E53935' }}
        >
          <Trash2 className="w-4 h-4" />
          {t('prof.signOut')}
        </button>
      </div>
    </div>
  );
}
