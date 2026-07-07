import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { Star, MapPin, Heart, SlidersHorizontal, X } from 'lucide-react';

type SortBy = 'relevance' | 'rating' | 'reviews' | 'newest';

const PAGE_SIZE = 10;

export default function SearchScreen() {
  const { navigate, goBack } = useApp();
  const { t, isRTL } = useLang();

  const initialCategory = typeof window !== 'undefined' ? sessionStorage.getItem('search_initial_category') : null;
  const initialQuery = typeof window !== 'undefined' ? sessionStorage.getItem('search_initial_query') : null;

  const [query, setQuery] = useState(initialQuery ?? '');
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? '');
  const [categoryId, setCategoryId] = useState<number | undefined>(() => initialCategory ? Number(initialCategory) : undefined);
  const [city, setCity] = useState<string>('');
  const [moqMax, setMoqMax] = useState<number | undefined>();
  const [verified, setVerified] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const pendingSaveQueryRef = useRef<string | null>(null);
  const lastSavedQueryRef = useRef<string>('');

  const { data: categories } = trpc.factory.categories.useQuery();
  const { data: cities } = trpc.factory.cities.useQuery();
  const { data: favoriteIds } = trpc.favorite.ids.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const toggleFav = trpc.favorite.toggle.useMutation({
    onSuccess: () => {
      utils.favorite.ids.invalidate();
      utils.favorite.list.invalidate();
    },
  });
  const saveSearch = trpc.factory.saveSearch.useMutation({
    onSuccess: () => utils.factory.searchHistory.invalidate(),
  });

  const filterParams = useMemo(() => ({
    query: searchQuery,
    categoryId,
    city: city || undefined,
    verified: verified || undefined,
    moqMax,
    sortBy,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [searchQuery, categoryId, city, verified, moqMax, sortBy, page]);

  const hasActiveFilters = categoryId !== undefined || !!city || verified || moqMax !== undefined;

  const { data: searchResults, isLoading } = trpc.factory.search.useQuery(
    filterParams,
    { enabled: searchQuery.length > 0 || hasActiveFilters }
  );

  const results = searchResults?.items ?? [];
  const total = searchResults?.total ?? 0;

  useEffect(() => {
    if (initialCategory) {
      sessionStorage.removeItem('search_initial_category');
    }
    if (initialQuery) {
      sessionStorage.removeItem('search_initial_query');
    }
  }, []);

  const setCategoryIdAndReset = useCallback((value: number | undefined) => {
    setCategoryId(value);
    setPage(0);
  }, []);
  const setCityAndReset = useCallback((value: string) => {
    setCity(value);
    setPage(0);
  }, []);
  const setVerifiedAndReset = useCallback((value: boolean) => {
    setVerified(value);
    setPage(0);
  }, []);
  const setMoqMaxAndReset = useCallback((value: number | undefined) => {
    setMoqMax(value);
    setPage(0);
  }, []);
  const setSortByAndReset = useCallback((value: SortBy) => {
    setSortBy(value);
    setPage(0);
  }, []);

  const handleSearch = () => {
    const q = query.trim();
    setSearchQuery(q);
    setPage(0);
    if (q) {
      pendingSaveQueryRef.current = q;
    }
  };

  useEffect(() => {
    if (
      pendingSaveQueryRef.current &&
      pendingSaveQueryRef.current === searchQuery &&
      searchQuery !== lastSavedQueryRef.current &&
      searchResults &&
      !saveSearch.isPending
    ) {
      lastSavedQueryRef.current = searchQuery;
      pendingSaveQueryRef.current = null;
      saveSearch.mutate({
        query: searchQuery,
        filters: { categoryId, city, verified, moqMax, sortBy },
        resultCount: searchResults.total,
      });
    }
  }, [searchResults, searchQuery, saveSearch, categoryId, city, verified, moqMax, sortBy]);

  const clearFilters = () => {
    setCategoryId(undefined);
    setCity('');
    setMoqMax(undefined);
    setVerified(false);
    setPage(0);
  };

  const isFav = (id: number) => favoriteIds?.has(id) ?? false;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="h-full w-full flex flex-col animate-fade-in" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-3 flex items-center gap-3">
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className="flex-1 relative">
          <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94A3B8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full h-11 rounded-xl ps-10 pe-4 text-sm text-white outline-none"
            style={{ background: '#1A2744', border: '1px solid #243352' }}
            autoFocus
          />
        </div>
        <button onClick={handleSearch} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E53935' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </button>
      </div>

      <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar items-center">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
          style={{
            background: showFilters || hasActiveFilters ? '#E53935' : '#1A2744',
            color: '#fff',
            border: '1px solid #243352',
          }}
        >
          <SlidersHorizontal className="w-3 h-3" />
          {t('search.filter.category')}
        </button>

        <select
          value={sortBy}
          onChange={e => setSortByAndReset(e.target.value as SortBy)}
          className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 outline-none appearance-none bg-transparent"
          style={{ background: '#1A2744', color: '#94A3B8', border: '1px solid #243352' }}
        >
          <option value="relevance">{t('search.sort.relevance')}</option>
          <option value="rating">{t('search.sort.rating')}</option>
          <option value="reviews">{t('search.sort.reviews')}</option>
          <option value="newest">{t('search.sort.newest')}</option>
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0" style={{ background: '#1A2744', color: '#94A3B8', border: '1px solid #243352' }}>
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mx-5 mb-3 p-3 rounded-2xl" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
          <div className="flex flex-col gap-3">
            <select
              value={categoryId ?? ''}
              onChange={e => setCategoryIdAndReset(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-10 px-3 rounded-xl text-xs text-white outline-none bg-transparent"
              style={{ background: '#1A2744', border: '1px solid #243352' }}
            >
              <option value="">{t('search.filter.category')}</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{t(`cat.${cat.icon}`) || cat.nameEn}</option>
              ))}
            </select>

            <select
              value={city}
              onChange={e => setCityAndReset(e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-xs text-white outline-none bg-transparent"
              style={{ background: '#1A2744', border: '1px solid #243352' }}
            >
              <option value="">{t('search.filter.location')}</option>
              {cities?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs" style={{ color: '#94A3B8' }}>
                <span>Max MOQ</span>
                <span>{moqMax ? `≤ ${moqMax}` : 'Any'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="500"
                value={moqMax ?? 0}
                onChange={e => {
                  const val = Number(e.target.value);
                  setMoqMaxAndReset(val > 0 ? val : undefined);
                }}
                className="w-full"
              />
            </div>

            <button
              onClick={() => setVerifiedAndReset(!verified)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
              style={{ background: verified ? 'rgba(66, 165, 245, 0.15)' : '#1A2744', color: verified ? '#42A5F5' : '#94A3B8', border: '1px solid #243352' }}
            >
              <span>{t('search.filter.certification')}</span>
              {verified && <CheckIcon />}
            </button>
          </div>
        </div>
      )}

      {searchResults && (
        <div className="px-5 pb-2 flex items-center justify-between">
          <span className="text-xs" style={{ color: '#94A3B8' }}>{total} {t('search.resultsFound')}</span>
          {totalPages > 1 && (
            <span className="text-xs" style={{ color: '#94A3B8' }}>Page {page + 1} / {totalPages}</span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-[100px] rounded-2xl animate-shimmer" style={{ background: '#0F1D32' }} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-3">
            {results.map((factory) => (
              <button
                key={factory.id}
                onClick={() => navigate('factoryProfile', String(factory.id))}
                className="w-full rounded-2xl overflow-hidden text-start card-bounce"
                style={{ background: '#0F1D32', border: '1px solid #1A2744' }}
              >
                <div className="flex" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div className="w-[100px] h-[100px] flex-shrink-0 relative">
                    <img src={factory.heroImage || '/images/factory-electronics.jpg'} alt={factory.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-white truncate pe-2">{factory.name}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!toggleFav.isPending) toggleFav.mutate({ factoryId: factory.id }); }}
                        disabled={toggleFav.isPending}
                        className="flex-shrink-0 disabled:opacity-50"
                      >
                        <Heart className="w-4 h-4" style={{ color: isFav(factory.id) ? '#E53935' : '#94A3B8' }} fill={isFav(factory.id) ? '#E53935' : 'none'} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" style={{ color: '#94A3B8' }} />
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{factory.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3" style={{ color: '#F9A825' }} />
                        <span className="text-xs font-medium text-white">{factory.rating}</span>
                      </div>
                      {factory.isVerified && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(249, 168, 37, 0.15)', color: '#F9A825' }}>
                          {t('profile.verified')}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#1A2744', color: '#94A3B8' }}>
                        {t('profile.moq')}: {factory.moq}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
                  style={{ background: '#1A2744', color: '#fff' }}
                >
                  Previous
                </button>
                <span className="text-xs" style={{ color: '#94A3B8' }}>{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
                  style={{ background: '#1A2744', color: '#fff' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : searchQuery || hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <img src="/images/empty-search.png" alt="No results" className="w-24 h-24 opacity-50" />
            <p className="text-sm font-medium text-white">No factories found</p>
            <p className="text-xs text-center max-w-[200px]" style={{ color: '#94A3B8' }}>Try different keywords or filters</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
