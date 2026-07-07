import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { useState } from 'react';
import { Bell, Factory, MessageCircle, Sparkles, CheckCheck } from 'lucide-react';

type TabKey = 'all' | 'message' | 'update' | 'recommendation';

const tabs: { key: TabKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'notif.tab.all' },
  { key: 'message', labelKey: 'notif.tab.messages' },
  { key: 'update', labelKey: 'notif.tab.updates' },
  { key: 'recommendation', labelKey: 'notif.tab.recommendations' },
];

export default function NotificationsScreen() {
  const { goBack } = useApp();
  const { lang, t } = useLang();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const { data: notifications, isLoading } = trpc.notification.list.useQuery(
    activeTab === 'all' ? undefined : { type: activeTab }
  );

  const utils = trpc.useUtils();
  const markRead = trpc.notification.markRead.useMutation({ onSuccess: () => { utils.notification.list.invalidate(); utils.notification.unreadCount.invalidate(); } });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => { utils.notification.list.invalidate(); utils.notification.unreadCount.invalidate(); } });

  const getIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Sparkles className="w-4 h-4" style={{ color: '#42A5F5' }} />;
      case 'message': return <MessageCircle className="w-4 h-4" style={{ color: '#66BB6A' }} />;
      case 'update': return <Factory className="w-4 h-4" style={{ color: '#F9A825' }} />;
      default: return <Bell className="w-4 h-4" style={{ color: '#94A3B8' }} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={goBack} style={{ color: '#94A3B8' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">{t('notif.title')}</h1>
        </div>
        <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="flex items-center gap-1 text-xs font-medium disabled:opacity-50" style={{ color: '#94A3B8' }}>
          <CheckCheck className="w-4 h-4" />
          {t('notif.markAllRead')}
        </button>
      </div>

      <div className="flex gap-1 px-5 pb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
            style={{
              background: activeTab === tab.key ? '#E53935' : '#1A2744',
              color: activeTab === tab.key ? '#fff' : '#94A3B8',
            }}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="w-full h-16 rounded-xl animate-shimmer" style={{ background: '#0F1D32' }} />)}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="flex flex-col">
            {notifications.map((notif: any) => (
              <button
                key={notif.id}
                onClick={() => !notif.isRead && !markRead.isPending && markRead.mutate({ id: notif.id })}
                disabled={markRead.isPending}
                className="flex items-start gap-3 py-4 text-left disabled:opacity-50"
                style={{ borderBottom: '1px solid #1A2744' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#0F1D32' }}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{lang === 'ar' && notif.titleAr ? notif.titleAr : notif.title}</h4>
                    {!notif.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#E53935' }} />}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#94A3B8' }}>
                    {lang === 'ar' && notif.descriptionAr ? notif.descriptionAr : notif.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#0F1D32' }}>
              <Bell className="w-8 h-8" style={{ color: '#94A3B8' }} />
            </div>
            <p className="text-sm font-medium text-white">{t('notif.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
