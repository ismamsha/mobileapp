import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { trpc } from '@/providers/trpc';

type Lang = 'en' | 'ar';

interface LangContextType {
  lang: Lang;
  isRTL: boolean;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Splash
    'splash.tagline': "Your Bridge to China's Best Factories",

    // Onboarding
    'onboard.skip': 'Skip',
    'onboard.continue': 'Continue',
    'onboard.getStarted': 'Get Started',
    'onboard.slide1.title': 'Discover Verified Factories',
    'onboard.slide1.desc': 'Access our network of 500+ verified Chinese manufacturers across every major industry.',
    'onboard.slide2.title': 'AI-Powered Assistance',
    'onboard.slide2.desc': 'Our intelligent sourcing AI helps you find the perfect factory match in seconds.',
    'onboard.slide3.title': 'Request Quotations',
    'onboard.slide3.desc': 'Submit structured RFQs and get competitive quotes directly from factories.',

    // Auth
    'auth.welcomeBack': 'Welcome Back',
    'auth.signinSubtitle': 'Sign in to access your sourcing dashboard',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.signIn': 'Sign In',
    'auth.orContinueWith': 'or continue with',
    'auth.noAccount': "Don't have an account?",
    'auth.signUp': 'Sign Up',
    'auth.hasAccount': 'Already have an account?',
    'auth.signInLink': 'Sign In',
    'auth.createAccount': 'Create Account',
    'auth.signupSubtitle': 'Join thousands of global buyers sourcing from China',
    'auth.fullName': 'Full name',
    'auth.phone': 'Phone number',
    'auth.confirmPassword': 'Confirm password',
    'auth.terms': 'I agree to the',
    'auth.termsService': 'Terms of Service',
    'auth.and': 'and',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.createBtn': 'Create Account',
    'auth.guestLogin': 'Guest Login',
    'auth.kimiLogin': 'Sign in with Kimi',

    // Home
    'home.goodMorning': 'Good Morning',
    'home.goodAfternoon': 'Good Afternoon',
    'home.goodEvening': 'Good Evening',
    'home.searchPlaceholder': 'Search factories, products...',
    'home.askAI': 'Ask AI to Find Factories',
    'home.aiSubtitle': 'Describe what you need, AI will match you',
    'home.categories': 'Categories',
    'home.featuredFactories': 'Featured Factories',
    'home.seeAll': 'See All',
    'home.recentSearches': 'Recent Searches',

    // Categories
    'cat.electronics': 'Electronics',
    'cat.textiles': 'Textiles',
    'cat.machinery': 'Machinery',
    'cat.furniture': 'Furniture',
    'cat.autoParts': 'Auto Parts',
    'cat.cosmetics': 'Cosmetics',
    'cat.food': 'Food',
    'cat.construction': 'Construction',

    // Search
    'search.resultsFound': 'factories found',
    'search.filter.category': 'Category',
    'search.filter.location': 'Location',
    'search.filter.moq': 'MOQ',
    'search.filter.certification': 'Certification',
    'search.sort.relevance': 'Relevance',
    'search.sort.rating': 'Top Rated',
    'search.sort.reviews': 'Most Reviews',
    'search.sort.newest': 'Newest',

    // Factory Profile
    'profile.verified': 'Verified',
    'profile.compliance': 'Compliance',
    'profile.leadTime': 'Lead Time',
    'profile.reviews': 'reviews',
    'profile.years': 'Years',
    'profile.capacity': 'Capacity',
    'profile.moq': 'MOQ',
    'profile.exports': 'Exports',
    'profile.about': 'About',
    'profile.readMore': 'Read More',
    'profile.showLess': 'Show Less',
    'profile.products': 'Products',
    'profile.certificates': 'Certificates',
    'profile.exportMarkets': 'Export Markets',
    'profile.requestQuote': 'Request Quotation',
    'profile.whatsapp': 'Contact via WhatsApp',

    // AI Chat
    'ai.title': 'Sourcing AI',
    'ai.online': 'Online',
    'ai.assistant': 'AI Assistant',
    'ai.welcome': "Hello! I'm your AI sourcing assistant. Tell me what you're looking for and I'll find the best verified factories for you.",
    'ai.suggestion1': 'I need furniture factories',
    'ai.suggestion2': 'Electronics in Shenzhen',
    'ai.suggestion3': 'Textile suppliers with low MOQ',
    'ai.inputPlaceholder': 'Describe what you need...',
    'ai.typing': 'Typing',

    // Saved Searches
    'savedSearches.title': 'Saved Searches',
    'savedSearches.empty': 'No saved searches yet',
    'savedSearches.emptyDesc': 'Your recent factory searches will appear here.',
    'savedSearches.clearAll': 'Clear All',

    // Favorites
    'fav.title': 'My Favorites',
    'fav.all': 'All',
    'fav.electronics': 'Electronics',
    'fav.furniture': 'Furniture',
    'fav.textiles': 'Textiles',
    'fav.empty': 'No favorites yet',
    'fav.emptyDesc': 'Start exploring factories and tap the heart icon to save them here.',

    // Notifications
    'notif.title': 'Notifications',
    'notif.markAllRead': 'Mark all read',
    'notif.empty': 'No notifications yet',
    'notif.tab.all': 'All',
    'notif.tab.messages': 'Messages',
    'notif.tab.updates': 'Updates',
    'notif.tab.recommendations': 'For You',

    // Profile Screen
    'prof.title': 'Profile',
    'prof.memberSince': 'Member since',
    'prof.stat.viewed': 'Viewed',
    'prof.stat.rfqs': 'RFQs',
    'prof.stat.saved': 'Saved',
    'prof.language': 'Language',
    'prof.darkMode': 'Dark Mode',
    'prof.myRFQs': 'My RFQs',
    'prof.savedSearches': 'Saved Searches',
    'prof.notifications': 'Notifications',
    'prof.settings': 'Settings',
    'prof.help': 'Help & Support',
    'prof.about': 'About ChinaFastLane',
    'prof.signOut': 'Sign Out',
    'prof.version': 'ChinaFastLane v1.0.0',

    // RFQ
    'rfq.title': 'Request Quotation',
    'rfq.subtitle': 'Fill in the details below and we will forward your request to the factory.',
    'rfq.productName': 'Product Name',
    'rfq.quantity': 'Quantity (e.g. 1000 units)',
    'rfq.specs': 'Specifications (size, color, material, packaging...)',
    'rfq.targetPrice': 'Target Price (optional)',
    'rfq.delivery': 'Delivery Location (optional)',
    'rfq.send': 'Send RFQ',
    'rfq.sending': 'Sending...',
    'rfq.sent': 'RFQ Sent!',
    'rfq.sentDesc': 'Your quotation request has been sent to the factory. You will receive a response within 24-48 hours.',
    'rfq.back': 'Back to Factory',
    'rfq.another': 'Send Another RFQ',

    // Bottom Nav
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.ai': 'AI',
    'nav.saved': 'Saved',
    'nav.profile': 'Profile',
  },
  ar: {
    // Splash
    'splash.tagline': 'جسرك إلى أفضل مصانع الصين',

    // Onboarding
    'onboard.skip': 'تخطي',
    'onboard.continue': 'متابعة',
    'onboard.getStarted': 'البدء',
    'onboard.slide1.title': 'اكتشف المصانع الموثقة',
    'onboard.slide1.desc': 'الوصول إلى شبكتنا من أكثر من 500 مصنع صيني موثق في جميع الصناعات الرئيسية.',
    'onboard.slide2.title': 'مساعد بالذكاء الاصطناعي',
    'onboard.slide2.desc': 'يساعدك ذكاؤنا الاصطناعي في العثور على أفضل تطابق للمصنع في ثوانٍ.',
    'onboard.slide3.title': 'اطلب عروض أسعار',
    'onboard.slide3.desc': 'أرسل طلبات عروض أسعار منظمة واحصل على عروض تنافسية مباشرة من المصانع.',

    // Auth
    'auth.welcomeBack': 'مرحباً بعودتك',
    'auth.signinSubtitle': 'سجل الدخول للوصول إلى لوحة التحكم',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.signIn': 'تسجيل الدخول',
    'auth.orContinueWith': 'أو تابع باستخدام',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.signUp': 'إنشاء حساب',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.signInLink': 'تسجيل الدخول',
    'auth.createAccount': 'إنشاء حساب',
    'auth.signupSubtitle': 'انضم إلى آلاف المشترين العالميين من الصين',
    'auth.fullName': 'الاسم الكامل',
    'auth.phone': 'رقم الهاتف',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.terms': 'أوافق على',
    'auth.termsService': 'شروط الخدمة',
    'auth.and': 'و',
    'auth.privacyPolicy': 'سياسة الخصوصية',
    'auth.createBtn': 'إنشاء حساب',
    'auth.guestLogin': 'تسجيل الدخول كضيف',
    'auth.kimiLogin': 'تسجيل الدخول بكيمي',

    // Home
    'home.goodMorning': 'صباح الخير',
    'home.goodAfternoon': 'مساء الخير',
    'home.goodEvening': 'مساء الخير',
    'home.searchPlaceholder': 'ابحث عن المصانع والمنتجات...',
    'home.askAI': 'اسأل الذكاء الاصطناعي',
    'home.aiSubtitle': 'صف ما تحتاجه، وسيجده لك الذكاء الاصطناعي',
    'home.categories': 'الفئات',
    'home.featuredFactories': 'مصانع مميزة',
    'home.seeAll': 'عرض الكل',
    'home.recentSearches': 'عمليات البحث الأخيرة',

    // Categories
    'cat.electronics': 'إلكترونيات',
    'cat.textiles': 'منسوجات',
    'cat.machinery': 'آلات',
    'cat.furniture': 'أثاث',
    'cat.autoParts': 'قطع سيارات',
    'cat.cosmetics': 'مستحضرات',
    'cat.food': 'أغذية',
    'cat.construction': 'بناء',

    // Search
    'search.resultsFound': 'مصنع تم العثور عليه',
    'search.filter.category': 'الفئة',
    'search.filter.location': 'الموقع',
    'search.filter.moq': 'الحد الأدنى',
    'search.filter.certification': 'الشهادات',
    'search.sort.relevance': 'الصلة',
    'search.sort.rating': 'الأعلى تقييماً',
    'search.sort.reviews': 'الأكثر تقييماً',
    'search.sort.newest': 'الأحدث',

    // Factory Profile
    'profile.verified': 'موثق',
    'profile.compliance': 'مطابق',
    'profile.leadTime': 'الوقت',
    'profile.reviews': 'تقييم',
    'profile.years': 'سنوات',
    'profile.capacity': 'القدرة',
    'profile.moq': 'الحد الأدنى',
    'profile.exports': 'الصادرات',
    'profile.about': 'نبذة',
    'profile.readMore': 'اقرأ المزيد',
    'profile.showLess': 'عرض أقل',
    'profile.products': 'المنتجات',
    'profile.certificates': 'الشهادات',
    'profile.exportMarkets': 'أسواق التصدير',
    'profile.requestQuote': 'طلب عرض سعر',
    'profile.whatsapp': 'تواصل عبر واتساب',

    // AI Chat
    'ai.title': 'مساعد الذكاء الاصطناعي',
    'ai.online': 'متصل',
    'ai.assistant': 'المساعد',
    'ai.welcome': 'مرحباً! أنا مساعدك الذكي للتوريد. أخبرني بما تبحث عنه وسأجد أفضل المصانع الموثقة لك.',
    'ai.suggestion1': 'أحتاج مصانع أثاث',
    'ai.suggestion2': 'إلكترونيات في شنتشن',
    'ai.suggestion3': 'موردي منسوجات بحد أدنى منخفض',
    'ai.inputPlaceholder': 'صف ما تحتاجه...',
    'ai.typing': 'يكتب',

    // Saved Searches
    'savedSearches.title': 'بحوث محفوظة',
    'savedSearches.empty': 'لا توجد بحوث محفوظة',
    'savedSearches.emptyDesc': 'ستظهر عمليات البحث الأخيرة عن المصانع هنا.',
    'savedSearches.clearAll': 'مسح الكل',

    // Favorites
    'fav.title': 'المفضلة',
    'fav.all': 'الكل',
    'fav.electronics': 'إلكترونيات',
    'fav.furniture': 'أثاث',
    'fav.textiles': 'منسوجات',
    'fav.empty': 'لا توجد مفضلات',
    'fav.emptyDesc': 'ابدأ باستكشاف المصانع واضغط على أيقونة القلب لحفظها هنا.',

    // Notifications
    'notif.title': 'الإشعارات',
    'notif.markAllRead': 'تحديد الكل مقروء',
    'notif.empty': 'لا توجد إشعارات',
    'notif.tab.all': 'الكل',
    'notif.tab.messages': 'رسائل',
    'notif.tab.updates': 'تحديثات',
    'notif.tab.recommendations': 'لك',

    // Profile Screen
    'prof.title': 'الملف الشخصي',
    'prof.memberSince': 'عضو منذ',
    'prof.stat.viewed': 'تمت المشاهدة',
    'prof.stat.rfqs': 'طلبات عروض',
    'prof.stat.saved': 'محفوظ',
    'prof.language': 'اللغة',
    'prof.darkMode': 'الوضع المظلم',
    'prof.myRFQs': 'طلباتي',
    'prof.savedSearches': 'بحوث محفوظة',
    'prof.notifications': 'الإشعارات',
    'prof.settings': 'الإعدادات',
    'prof.help': 'المساعدة والدعم',
    'prof.about': 'عن ChinaFastLane',
    'prof.signOut': 'تسجيل الخروج',
    'prof.version': 'ChinaFastLane الإصدار ١.٠.٠',

    // RFQ
    'rfq.title': 'طلب عرض سعر',
    'rfq.subtitle': 'املأ التفاصيل أدناه وسنقوم بإعادة توجيه طلبك إلى المصنع.',
    'rfq.productName': 'اسم المنتج',
    'rfq.quantity': 'الكمية (مثال: 1000 وحدة)',
    'rfq.specs': 'المواصفات (الحجم، اللون، المادة، التعبئة...)',
    'rfq.targetPrice': 'السعر المستهدف (اختياري)',
    'rfq.delivery': 'موقع التسليم (اختياري)',
    'rfq.send': 'إرسال الطلب',
    'rfq.sending': 'جاري الإرسال...',
    'rfq.sent': 'تم إرسال الطلب!',
    'rfq.sentDesc': 'تم إرسال طلب عرض السعر إلى المصنع. ستتلقى رداً خلال 24-48 ساعة.',
    'rfq.back': 'العودة للمصنع',
    'rfq.another': 'إرسال طلب آخر',

    // Bottom Nav
    'nav.home': 'الرئيسية',
    'nav.search': 'بحث',
    'nav.ai': 'ذكاء',
    'nav.saved': 'محفوظ',
    'nav.profile': 'حسابي',
  },
};

const LanguageContext = createContext<LangContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langState, setLangState] = useState<Lang>('ar');
  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });

  const lang = (user?.lang as Lang | undefined) ?? langState;

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    updateProfile.mutate({ lang: l });
  }, [updateProfile]);

  const t = useCallback(
    (key: string) => {
      return translations[lang][key] || key;
    },
    [lang]
  );

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, isRTL: lang === 'ar', setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
