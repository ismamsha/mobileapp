import { Routes, Route, useLocation } from 'react-router';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLang } from './context/LanguageContext';
import GlobeBackground from './components/GlobeBackground';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import FactoryProfileScreen from './screens/FactoryProfileScreen';
import AIChatScreen from './screens/AIChatScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import RFQScreen from './screens/RFQScreen';
import MyRFQsScreen from './screens/MyRFQsScreen';
import SavedSearchesScreen from './screens/SavedSearchesScreen';
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';
import AboutScreen from './screens/AboutScreen';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import FactoriesPage from './admin/FactoriesPage';
import UsersPage from './admin/UsersPage';
import RFQsPage from './admin/RFQsPage';
import MonitoringPage from './admin/MonitoringPage';
import AdminGuard from './admin/AdminGuard';

function ScreenRouter() {
  const { currentScreen } = useApp();
  switch (currentScreen) {
    case 'splash': return <SplashScreen />;
    case 'onboarding': return <OnboardingScreen />;
    case 'signin': return <SignInScreen />;
    case 'signup': return <SignUpScreen />;
    case 'home': return <HomeScreen />;
    case 'search': return <SearchScreen />;
    case 'factoryProfile': return <FactoryProfileScreen />;
    case 'aiChat': return <AIChatScreen />;
    case 'favorites': return <FavoritesScreen />;
    case 'notifications': return <NotificationsScreen />;
    case 'profile': return <ProfileScreen />;
    case 'rfq': return <RFQScreen />;
    case 'myRFQs': return <MyRFQsScreen />;
    case 'savedSearches': return <SavedSearchesScreen />;
    case 'settings': return <SettingsScreen />;
    case 'help': return <HelpScreen />;
    case 'about': return <AboutScreen />;
    default: return <HomeScreen />;
  }
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
      style={{
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      )}
    </button>
  );
}

function MobileApp() {
  const { isDarkMode, toggleTheme } = useApp();
  const { isRTL } = useLang();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at center, #0F1D32 0%, #0A1628 50%, #060E1A 100%)'
          : 'radial-gradient(ellipse at center, #F8FAFC 0%, #F0F2F5 50%, #E8ECF0 100%)',
      }}
    >
      <GlobeBackground isDarkMode={isDarkMode} />
      <div className="fixed top-4 z-50 flex gap-2" style={{ [isRTL ? 'left' : 'right']: '16px' }}>
        <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
      </div>

      <div className="relative z-10" style={{ width: 'min(393px, 100vw - 32px)', height: 'min(852px, 100vh - 32px)' }}>
        <div className="absolute inset-0 rounded-[47px]" style={{
          background: isDarkMode ? '#1A1A1E' : '#E8E8ED',
          padding: '12px',
          boxShadow: isDarkMode
            ? '0 50px 100px -20px rgba(0,0,0,0.7), 0 30px 60px -30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 50px 100px -20px rgba(0,0,0,0.25), 0 30px 60px -30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
          <div className="w-full h-full rounded-[40px] overflow-hidden relative" style={{ background: '#0A1628', border: isDarkMode ? '2px solid rgba(255,255,255,0.06)' : '2px solid rgba(0,0,0,0.04)' }}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50" style={{ width: '126px', height: '37px', background: '#000000', borderRadius: '20px' }} />
            <div className="w-full h-full overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
              <ScreenRouter />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50" style={{ width: '134px', height: '5px', background: 'rgba(255,255,255,0.3)', borderRadius: '3px' }} />
          </div>
        </div>
        <div className="absolute left-0 top-[120px] w-[3px] h-[30px] rounded-l" style={{ background: isDarkMode ? '#2A2A2E' : '#C8C8CC', transform: 'translateX(-100%)' }} />
        <div className="absolute left-0 top-[160px] w-[3px] h-[60px] rounded-l" style={{ background: isDarkMode ? '#2A2A2E' : '#C8C8CC', transform: 'translateX(-100%)' }} />
        <div className="absolute left-0 top-[230px] w-[3px] h-[60px] rounded-l" style={{ background: isDarkMode ? '#2A2A2E' : '#C8C8CC', transform: 'translateX(-100%)' }} />
        <div className="absolute right-0 top-[160px] w-[3px] h-[90px] rounded-r" style={{ background: isDarkMode ? '#2A2A2E' : '#C8C8CC', transform: 'translateX(100%)' }} />
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <LanguageProvider>
        <Routes>
          <Route path="/admin" element={<AdminGuard><AdminLayout><Dashboard /></AdminLayout></AdminGuard>} />
          <Route path="/admin/factories" element={<AdminGuard><AdminLayout><FactoriesPage /></AdminLayout></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard><AdminLayout><UsersPage /></AdminLayout></AdminGuard>} />
          <Route path="/admin/rfqs" element={<AdminGuard><AdminLayout><RFQsPage /></AdminLayout></AdminGuard>} />
          <Route path="/admin/monitoring" element={<AdminGuard><AdminLayout><MonitoringPage /></AdminLayout></AdminGuard>} />
        </Routes>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <AppProvider>
        <MobileApp />
      </AppProvider>
    </LanguageProvider>
  );
}
