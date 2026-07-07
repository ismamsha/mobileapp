import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { Heart, Star, MapPin, Trash2 } from 'lucide-react';

const categoryFilters = [
  { key: 'fav.all', value: null },
  { key: 'fav.electronics', value: 'electronics' },
  { key: 'fav.furniture', value: 'furniture' },
  { key: 'fav.textiles', value: 'textiles' },
];

export default function FavoritesScreen() {
  const { navigate } = useApp();
  const { t, isRTL } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string>('fav.all');

  const { data: favorites, isLoading } = trpc.favorite.list.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const removeFav = trpc.favorite.remove.useMutation({
    onSuccess: () => { utils.favorite.list.invalidate(); utils.favorite.ids.invalidate(); },
  });

  const filteredFavorites = favorites?.filter((item: any) => {
    const filter = categoryFilters.find(c => c.key === selectedCategory);
    if (!filter?.value) return true;
    return item.categoryName?.toLowerCase() === filter.value;
  });

  return (
    <div className="h-full w-full flex flex-col animate-fade-in" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">{t('fav.title')}</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categoryFilters.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className="px-4 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
              style={{
                background: cat.key === selectedCategory ? '#E53935' : '#1A2744',
                color: cat.key === selectedCategory ? '#fff' : '#94A3B8',
                border: cat.key === selectedCategory ? 'none' : '1px solid #243352',
              }}
            >
              {t(cat.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="w-full h-[100px] rounded-2xl animate-shimmer" style={{ background: '#0F1D32' }} />)}
          </div>
        ) : filteredFavorites && filteredFavorites.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredFavorites.map((item: any) => (
              <button
                key={item.id}
                onClick={() => navigate('factoryProfile', String(item.factoryId))}
                className="w-full rounded-2xl overflow-hidden text-start card-bounce"
                style={{ background: '#0F1D32', border: '1px solid #1A2744' }}
              >
                <div className="flex" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div className="w-[100px] h-[100px] flex-shrink-0 relative">
                    <img src={item.factoryImage || '/images/factory-electronics.jpg'} alt={item.factoryName} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <Heart className="w-4 h-4" style={{ color: '#E53935' }} fill="#E53935" />
                    </div>
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-white truncate pe-2">{item.factoryName}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!removeFav.isPending) removeFav.mutate({ factoryId: item.factoryId }); }}
                        disabled={removeFav.isPending}
                        className="flex-shrink-0 p-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#E53935' }} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" style={{ color: '#94A3B8' }} />
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{item.factoryLocation}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3" style={{ color: '#F9A825' }} />
                        <span className="text-xs font-medium text-white">{item.factoryRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <img src="/images/empty-search.png" alt="No favorites" className="w-32 h-32 opacity-50" />
            <p className="text-sm font-medium text-white">{t('fav.empty')}</p>
            <p className="text-xs text-center max-w-[200px]" style={{ color: '#94A3B8' }}>{t('fav.emptyDesc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
