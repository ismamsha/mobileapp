import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { Search, Trash2, X, ArrowRight, Clock } from 'lucide-react';

export default function SavedSearchesScreen() {
  const { navigate, goBack } = useApp();
  const { t, isRTL } = useLang();

  const { data: searches, isLoading } = trpc.factory.searchHistory.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const deleteSearch = trpc.factory.deleteSearchHistory.useMutation({
    onSuccess: () => utils.factory.searchHistory.invalidate(),
  });
  const clearSearches = trpc.factory.clearSearchHistory.useMutation({
    onSuccess: () => utils.factory.searchHistory.invalidate(),
  });

  const runSearch = (query: string, filters?: Record<string, unknown> | null) => {
    sessionStorage.setItem('search_initial_query', query);
    if (filters && typeof filters.categoryId === 'number') {
      sessionStorage.setItem('search_initial_category', String(filters.categoryId));
    }
    navigate('search');
  };

  return (
    <div className="h-full w-full flex flex-col animate-fade-in" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goBack} style={{ color: '#94A3B8' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">{t('savedSearches.title')}</h1>
          </div>
          {searches && searches.length > 0 && (
            <button
              onClick={() => clearSearches.mutate()}
              disabled={clearSearches.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
              style={{ background: '#1A2744', color: '#E53935', border: '1px solid #243352' }}
            >
              <X className="w-3.5 h-3.5" />
              {t('savedSearches.clearAll')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="w-full h-[72px] rounded-2xl animate-shimmer" style={{ background: '#0F1D32' }} />)}
          </div>
        ) : searches && searches.length > 0 ? (
          <div className="flex flex-col gap-3">
            {searches.map((search) => (
              <div
                key={search.id}
                className="w-full rounded-2xl p-3 flex items-center gap-3"
                style={{ background: '#0F1D32', border: '1px solid #1A2744' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1A2744' }}>
                  <Search className="w-5 h-5" style={{ color: '#94A3B8' }} />
                </div>
                <button
                  onClick={() => runSearch(search.query, search.filters)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">{search.query}</p>
                  <div className="flex items-center gap-2 mt-0.5" style={{ color: '#6B7280' }}>
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px]">{new Date(search.createdAt).toLocaleDateString()}</span>
                    {search.resultCount ? (
                      <span className="text-[10px]">• {search.resultCount} {t('search.resultsFound')}</span>
                    ) : null}
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => runSearch(search.query, search.filters)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: '#1A2744' }}
                  >
                    <ArrowRight className="w-4 h-4" style={{ color: '#94A3B8', transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                  </button>
                  <button
                    onClick={() => deleteSearch.mutate({ id: search.id })}
                    disabled={deleteSearch.isPending}
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                    style={{ background: '#1A2744' }}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: '#E53935' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <img src="/images/empty-search.png" alt="No saved searches" className="w-32 h-32 opacity-50" />
            <p className="text-sm font-medium text-white">{t('savedSearches.empty')}</p>
            <p className="text-xs text-center max-w-[200px]" style={{ color: '#94A3B8' }}>{t('savedSearches.emptyDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
