import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { Bell, Star, MapPin, User } from 'lucide-react';

const CategoryIcon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    smartphone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
    shirt: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>,
    cog: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>,
    armchair: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>,
    car: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
    sparkles: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    coffee: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>,
    hammer: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l.243.243a6 6 0 0 0 1.757 4.114L9 10h.5a2 2 0 0 1 1.414.586L12.5 12.5"/></svg>,
  };
  return icons[name] || null;
};

export default function HomeScreen() {
  const { navigate } = useApp();
  const { t } = useLang();

  const { data: featuredFactories, isLoading: factoriesLoading } = trpc.factory.featured.useQuery({ limit: 8 });
  const { data: allCategories } = trpc.factory.categories.useQuery();
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, { retry: false });
  const { data: recentSearches } = trpc.factory.searchHistory.useQuery(undefined, { retry: false });
  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false });

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? 'home.goodMorning' : hour < 17 ? 'home.goodAfternoon' : 'home.goodEvening';

  const goToSearch = (params?: { categoryId?: number; query?: string }) => {
    navigate('search');
    // Store intent in sessionStorage for SearchScreen to pick up
    if (params?.categoryId !== undefined) {
      sessionStorage.setItem('search_initial_category', String(params.categoryId));
    }
    if (params?.query) {
      sessionStorage.setItem('search_initial_query', params.query);
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-fade-scale-in" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: '#1A2744' }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </button>
        <span className="text-base font-semibold text-white">ChinaFastLane</span>
        <button
          onClick={() => navigate('notifications')}
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{ background: '#1A2744' }}
        >
          <Bell className="w-5 h-5 text-white" />
          {unreadCount ? (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        <div className="px-5 mb-5">
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94A3B8' }}>
            {t(greetingKey)}
          </p>
          <h2 className="text-xl font-bold text-white">{user?.name || 'Ahmed Al-Rashid'}</h2>
        </div>

        <div className="px-5 mb-5">
          <button
            onClick={() => goToSearch()}
            className="w-full h-14 rounded-2xl flex items-center gap-3 px-4 text-left card-bounce"
            style={{ background: '#1A2744', border: '1px solid #243352' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <span className="text-sm" style={{ color: '#94A3B8' }}>
              {t('home.searchPlaceholder')}
            </span>
          </button>
        </div>

        <div className="px-5 mb-5">
          <button
            onClick={() => navigate('aiChat')}
            className="w-full rounded-2xl p-4 flex items-center gap-4 text-left card-bounce relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1A2744 0%, #243352 100%)',
              border: '1px solid rgba(66, 165, 245, 0.2)',
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 animate-ai-pulse" style={{ background: 'rgba(66, 165, 245, 0.15)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{t('home.askAI')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{t('home.aiSubtitle')}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="mb-5">
          <div className="px-5 flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">{t('home.categories')}</h3>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
            {allCategories?.map((cat) => (
              <button key={cat.id} onClick={() => goToSearch({ categoryId: cat.id })} className="flex flex-col items-center gap-2 flex-shrink-0 snap-start card-press">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#1A2744', border: '1px solid #243352', color: '#F9A825' }}>
                  <CategoryIcon name={cat.icon} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: '#94A3B8' }}>
                  {t(`cat.${cat.icon}`) || cat.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="px-5 flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">{t('home.featuredFactories')}</h3>
            <button onClick={() => goToSearch()} className="text-xs font-medium" style={{ color: '#E53935' }}>{t('home.seeAll')}</button>
          </div>
          {factoriesLoading ? (
            <div className="flex gap-4 px-5">
              {[1, 2].map(i => (
                <div key={i} className="flex-shrink-0 w-[280px] h-[200px] rounded-2xl animate-shimmer" style={{ background: '#0F1D32' }} />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 px-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
              {featuredFactories?.map((factory) => (
                <button
                  key={factory.id}
                  onClick={() => navigate('factoryProfile', String(factory.id))}
                  className="flex-shrink-0 w-[280px] rounded-2xl overflow-hidden text-left snap-start card-bounce"
                  style={{ background: '#0F1D32', border: '1px solid #1A2744' }}
                >
                  <div className="h-[140px] relative">
                    <img src={factory.heroImage || '/images/factory-electronics.jpg'} alt={factory.name} className="w-full h-full object-cover" />
                    {factory.isVerified && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(249, 168, 37, 0.9)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                        <span className="text-[10px] font-bold" style={{ color: '#0A1628' }}>{t('profile.verified')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-white truncate">{factory.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" style={{ color: '#94A3B8' }} />
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{factory.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" style={{ color: '#F9A825' }} />
                        <span className="text-xs font-medium text-white">{factory.rating}</span>
                        <span className="text-xs" style={{ color: '#94A3B8' }}>({factory.reviewCount})</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#1A2744', color: '#F9A825' }}>
                        {t('profile.moq')}: {factory.moq}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5">
          <h3 className="text-base font-semibold text-white mb-3">{t('home.recentSearches')}</h3>
          <div className="flex flex-col gap-2">
            {recentSearches && recentSearches.length > 0 ? (
              recentSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => goToSearch({ query: search.query })}
                  className="flex items-center gap-3 h-11 px-3 rounded-xl text-left card-press"
                  style={{ background: '#0F1D32' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-sm text-white flex-1">{search.query}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              ))
            ) : (
              ['Wireless earbuds', 'Cotton fabric', 'LED displays', 'Wooden furniture'].map((term, i) => (
                <button
                  key={i}
                  onClick={() => goToSearch({ query: term })}
                  className="flex items-center gap-3 h-11 px-3 rounded-xl text-left card-press"
                  style={{ background: '#0F1D32' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="text-sm text-white flex-1">{term}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
