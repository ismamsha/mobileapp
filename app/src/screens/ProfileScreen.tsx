import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { FileText, Search, Globe, HelpCircle, Info, LogOut, ChevronRight, Bell, Settings } from 'lucide-react';

const menuSections = [
  {
    items: [
      { icon: 'fileText', labelKey: 'prof.myRFQs', badge: null, screen: 'myRFQs' as const },
      { icon: 'search', labelKey: 'prof.savedSearches', badge: null, screen: 'savedSearches' as const },
    ],
  },
  {
    items: [
      { icon: 'bell', labelKey: 'prof.notifications', badge: null, screen: 'notifications' as const },
      { icon: 'settings', labelKey: 'prof.settings', badge: null, screen: 'settings' as const },
    ],
  },
  {
    items: [
      { icon: 'help', labelKey: 'prof.help', badge: null, screen: 'help' as const },
      { icon: 'info', labelKey: 'prof.about', badge: null, screen: 'about' as const },
    ],
  },
];

export default function ProfileScreen() {
  const { navigate, isDarkMode, toggleTheme } = useApp();
  const { lang, isRTL, setLang, t } = useLang();

  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data: stats } = trpc.auth.stats.useQuery(undefined, { retry: false });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.reload(); },
  });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2025';

  const getIcon = (name: string) => {
    const props = { className: 'w-5 h-5' as const, style: { color: '#94A3B8' } };
    switch (name) {
      case 'fileText': return <FileText {...props} />;
      case 'search': return <Search {...props} />;
      case 'globe': return <Globe {...props} />;
      case 'bell': return <Bell {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'help': return <HelpCircle {...props} />;
      case 'info': return <Info {...props} />;
      default: return null;
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-fade-in" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-6 flex flex-col items-center" style={{ borderBottom: '1px solid #1A2744' }}>
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3" style={{ border: '3px solid #E53935' }}>
          <img src={user?.avatar || '/images/user-avatar.jpg'} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg font-bold text-white">{user?.name || 'Ahmed Al-Rashid'}</h2>
        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{user?.email || 'ahmed.alrashid@email.com'}</p>
        <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{t('prof.memberSince')} {memberSince}</p>

        <div className="flex gap-6 mt-4">
          {[
            { labelKey: 'prof.stat.viewed', value: String(stats?.viewedCount ?? 0) },
            { labelKey: 'prof.stat.rfqs', value: String(stats?.rfqCount ?? 0) },
            { labelKey: 'prof.stat.saved', value: String(stats?.favoriteCount ?? 0) },
          ].map((stat) => (
            <div key={stat.labelKey} className="flex flex-col items-center">
              <span className="text-lg font-bold text-white">{stat.value}</span>
              <span className="text-[10px]" style={{ color: '#94A3B8' }}>{t(stat.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
        {/* Language Toggle */}
        <div className="flex items-center justify-between px-3 py-3 rounded-xl mb-2" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: '#94A3B8' }} />
            <span className="text-sm text-white">{t('prof.language')}</span>
          </div>
          <div className="flex rounded-lg overflow-hidden" style={{ background: '#1A2744' }}>
            <button onClick={() => setLang('en')} className="px-3 py-1 text-xs font-medium transition-all" style={{ background: lang === 'en' ? '#E53935' : 'transparent', color: '#fff' }}>EN</button>
            <button onClick={() => setLang('ar')} className="px-3 py-1 text-xs font-medium transition-all" style={{ background: lang === 'ar' ? '#E53935' : 'transparent', color: '#fff' }}>AR</button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between px-3 py-3 rounded-xl mb-4" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" style={{ color: '#94A3B8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            <span className="text-sm text-white">{t('prof.darkMode')}</span>
          </div>
          <button onClick={toggleTheme} className="w-11 h-6 rounded-full relative transition-all" style={{ background: isDarkMode ? '#E53935' : '#243352' }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: isDarkMode ? '22px' : '2px' }} />
          </button>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <div key={si} className="mb-4">
            <div className="flex flex-col rounded-xl overflow-hidden" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
              {section.items.map((item, ii) => (
                <button
                  key={item.labelKey}
                  onClick={() => item.screen && navigate(item.screen)}
                  className="flex items-center justify-between px-3 py-3.5 text-left card-press"
                  style={{ borderBottom: ii < section.items.length - 1 ? '1px solid #1A2744' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    {getIcon(item.icon)}
                    <span className="text-sm text-white">{t(item.labelKey)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#E53935' }}>{item.badge}</span>
                    )}
                    <ChevronRight className="w-4 h-4" style={{ color: '#6B7280', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Admin Link (only for admins) */}
        {user?.role === 'admin' && (
          <a href="/admin" className="flex items-center justify-between px-3 py-3.5 rounded-xl mb-4 text-left" style={{ background: '#0F1D32', border: '1px solid #E53935' }}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" style={{ color: '#E53935' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#E53935' }}>Admin Panel</span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: '#E53935' }} />
          </a>
        )}

        {/* Sign Out */}
        <button onClick={() => logout.mutate()} className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold mb-6 card-bounce" style={{ border: '1.5px solid #E53935', color: '#E53935' }}>
          <LogOut className="w-4 h-4" />
          {t('prof.signOut')}
        </button>

        <p className="text-center text-[10px] mb-4" style={{ color: '#6B7280' }}>{t('prof.version')}</p>
      </div>
    </div>
  );
}
