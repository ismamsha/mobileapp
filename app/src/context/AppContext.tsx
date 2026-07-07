import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLang } from './LanguageContext';

const THEME_KEY = 'theme';

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : true;
  } catch {
    return true;
  }
}

export type ScreenName =
  | 'splash'
  | 'onboarding'
  | 'signin'
  | 'signup'
  | 'home'
  | 'search'
  | 'factoryProfile'
  | 'aiChat'
  | 'favorites'
  | 'notifications'
  | 'profile'
  | 'rfq'
  | 'myRFQs'
  | 'savedSearches'
  | 'settings'
  | 'help'
  | 'about';

export type TabName = 'home' | 'search' | 'aiChat' | 'favorites' | 'profile';

interface AppState {
  currentScreen: ScreenName;
  previousScreen: ScreenName | null;
  activeTab: TabName;
  isDarkMode: boolean;
  selectedFactoryId: string | null;
  navDirection: 'push' | 'pop' | 'none';
}

interface AppContextType extends AppState {
  navigate: (screen: ScreenName, factoryId?: string) => void;
  goBack: () => void;
  setActiveTab: (tab: TabName) => void;
  toggleTheme: () => void;
  setSelectedFactoryId: (id: string | null) => void;
}

const tabRoots: Record<TabName, ScreenName> = {
  home: 'home',
  search: 'search',
  aiChat: 'aiChat',
  favorites: 'favorites',
  profile: 'profile',
};

const tabScreens: ScreenName[] = ['home', 'search', 'aiChat', 'favorites', 'profile', 'notifications'];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentScreen: 'splash',
    previousScreen: null,
    activeTab: 'home',
    isDarkMode: getInitialTheme(),
    selectedFactoryId: null,
    navDirection: 'none',
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, state.isDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', state.isDarkMode);
    } catch {
      // ignore storage errors
    }
  }, [state.isDarkMode]);

  const navigate = useCallback((screen: ScreenName, factoryId?: string) => {
    setState(prev => {
      const updates: Partial<AppState> = {
        previousScreen: prev.currentScreen,
        currentScreen: screen,
        navDirection: 'push',
      };
      if (factoryId !== undefined) {
        updates.selectedFactoryId = factoryId;
      }
      const tabKey = Object.entries(tabRoots).find(([, v]) => v === screen)?.[0] as TabName | undefined;
      if (tabKey) {
        updates.activeTab = tabKey;
      }
      return { ...prev, ...updates };
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      const target = prev.previousScreen ?? tabRoots[prev.activeTab];
      const tabKey = Object.entries(tabRoots).find(([, v]) => v === target)?.[0] as TabName | undefined;
      return {
        ...prev,
        currentScreen: target,
        previousScreen: null,
        activeTab: tabKey ?? prev.activeTab,
        navDirection: 'pop',
      };
    });
  }, []);

  const setActiveTab = useCallback((tab: TabName) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      previousScreen: prev.currentScreen,
      currentScreen: tabRoots[tab],
      navDirection: 'none',
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  const setSelectedFactoryId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedFactoryId: id }));
  }, []);

  const showNav = tabScreens.includes(state.currentScreen);

  return (
    <AppContext.Provider
      value={{
        ...state,
        navigate,
        goBack,
        setActiveTab,
        toggleTheme,
        setSelectedFactoryId,
      }}
    >
      {children}
      {showNav && <BottomNav />}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function BottomNav() {
  const { activeTab, setActiveTab, navigate } = useApp();
  const { t } = useLang();

  const tabs: { key: TabName; label: string; icon: string }[] = [
    { key: 'home', label: t('nav.home'), icon: 'Home' },
    { key: 'search', label: t('nav.search'), icon: 'Search' },
    { key: 'aiChat', label: t('nav.ai'), icon: 'Sparkles' },
    { key: 'favorites', label: t('nav.saved'), icon: 'Heart' },
    { key: 'profile', label: t('nav.profile'), icon: 'User' },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Home': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      );
      case 'Search': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      );
      case 'Sparkles': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
        </svg>
      );
      case 'Heart': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      );
      case 'User': return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      );
      default: return null;
    }
  };

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-[72px] z-50" style={{
      background: 'rgba(15, 29, 50, 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="flex items-center justify-around h-full pb-1 max-w-[393px] mx-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'aiChat') {
                  navigate('aiChat');
                } else {
                  setActiveTab(tab.key);
                }
              }}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 select-none"
              style={{
                color: isActive ? '#E53935' : '#94A3B8',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {getIcon(tab.icon)}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
