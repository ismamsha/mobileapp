import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { Star, MapPin, Heart, Share2, ChevronLeft, CheckCircle2, Globe, Calendar, Package, FileText } from 'lucide-react';

export default function FactoryProfileScreen() {
  const { goBack, navigate, selectedFactoryId } = useApp();
  const { t } = useLang();
  const [activeImage, setActiveImage] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const factoryId = selectedFactoryId ? parseInt(selectedFactoryId) : 1;

  const { data: factory, isLoading } = trpc.factory.byId.useQuery({ id: factoryId });
  const { data: favoriteIds } = trpc.favorite.ids.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const toggleFav = trpc.favorite.toggle.useMutation({
    onSuccess: () => {
      utils.favorite.ids.invalidate();
      utils.favorite.list.invalidate();
    },
  });

  const isFav = favoriteIds?.has(factoryId) ?? false;

  if (isLoading || !factory) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: '#0A1628' }}>
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const gallery = (factory.gallery as string[]) || [factory.heroImage || '/images/factory-electronics.jpg'];
  const products = factory.products ?? [];
  const certificates = factory.certificates ?? [];
  const exportMarkets = (factory.exportMarkets as string[]) || [];
  const factoryReviews = factory.reviews ?? [];

  const badges = [];
  if (factory.isVerified) badges.push({ label: t('profile.verified'), color: '#F9A825' });
  if (factory.isComplianceCertified) badges.push({ label: t('profile.compliance'), color: '#42A5F5' });
  if (factory.isLeadTimeCertified) badges.push({ label: t('profile.leadTime'), color: '#66BB6A' });

  return (
    <div className="h-full w-full flex flex-col animate-slide-in-right" style={{ background: '#0A1628' }}>
      <div className="h-[280px] relative flex-shrink-0">
        <div className="h-full overflow-hidden">
          <img src={gallery[activeImage] || factory.heroImage || '/images/factory-electronics.jpg'} alt={factory.name} className="w-full h-full object-cover transition-opacity duration-300" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.3) 0%, transparent 40%, rgba(10,22,40,0.8) 100%)' }} />

        <div className="absolute top-12 left-5 right-5 flex items-center justify-between">
          <button onClick={goBack} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => !toggleFav.isPending && toggleFav.mutate({ factoryId: factory.id })} disabled={toggleFav.isPending} className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md disabled:opacity-60" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <Heart className="w-5 h-5" style={{ color: isFav ? '#E53935' : '#fff' }} fill={isFav ? '#E53935' : 'none'} />
            </button>
            <button
              onClick={async () => {
                const url = window.location.href;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: factory.name, text: factory.description, url });
                  } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard');
                  }
                } catch {
                  // user cancelled or share unsupported
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {gallery.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {gallery.map((_, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className="rounded-full transition-all duration-300" style={{ width: i === activeImage ? 20 : 6, height: 6, background: i === activeImage ? '#E53935' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar -mt-4 relative z-10">
        <div className="rounded-t-3xl px-5 pt-6 pb-8" style={{ background: '#0A1628' }}>
          <h1 className="text-xl font-bold text-white">{factory.name}</h1>
          <div className="flex items-center gap-1.5 mt-2">
            <MapPin className="w-4 h-4" style={{ color: '#94A3B8' }} />
            <span className="text-sm" style={{ color: '#94A3B8' }}>{factory.location}</span>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {badges.map((badge) => (
              <span key={badge.label} className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1" style={{ background: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}30` }}>
                <CheckCircle2 className="w-3 h-3" />
                {badge.label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4" style={{ color: star <= Math.floor(factory.rating) ? '#F9A825' : '#243352' }} fill={star <= Math.floor(factory.rating) ? '#F9A825' : 'none'} />
              ))}
            </div>
            <span className="text-sm font-semibold text-white">{factory.rating}</span>
            <span className="text-xs" style={{ color: '#94A3B8' }}>({factory.reviewCount} {t('profile.reviews')})</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { icon: <Calendar className="w-4 h-4" />, label: 'profile.years', value: `${factory.yearsInBusiness}+` },
              { icon: <Package className="w-4 h-4" />, label: 'profile.capacity', value: factory.capacity || '-' },
              { icon: <FileText className="w-4 h-4" />, label: 'profile.moq', value: factory.moq || '-' },
              { icon: <Globe className="w-4 h-4" />, label: 'profile.exports', value: `${exportMarkets.length}+` },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 py-3 rounded-xl" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
                <span style={{ color: '#42A5F5' }}>{stat.icon}</span>
                <span className="text-xs font-bold text-white">{stat.value}</span>
                <span className="text-[10px]" style={{ color: '#94A3B8' }}>{t(stat.label)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-white mb-2">{t('profile.about')}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              {showFullDesc ? factory.description : factory.description.slice(0, 150) + '...'}
            </p>
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs font-medium mt-1" style={{ color: '#42A5F5' }}>
              {showFullDesc ? t('profile.showLess') : t('profile.readMore')}
            </button>
          </div>

          {products.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white mb-3">{t('profile.products')}</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
                {products.map((product: any) => (
                  <div key={product.id} className="flex-shrink-0 w-[120px] rounded-xl overflow-hidden snap-start" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
                    <div className="h-[80px]">
                      <img src={product.imageUrl || '/images/product-electronics.jpg'} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-white p-2 truncate">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certificates.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white mb-3">{t('profile.certificates')}</h3>
              <div className="flex flex-col gap-2">
                {certificates.map((cert: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249, 168, 37, 0.1)' }}>
                      <FileText className="w-4 h-4" style={{ color: '#F9A825' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{cert.name}</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>{cert.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exportMarkets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white mb-3">{t('profile.exportMarkets')}</h3>
              <div className="flex gap-2 flex-wrap">
                {exportMarkets.map((market: string) => (
                  <span key={market} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: '#1A2744', color: '#F9A825', border: '1px solid #243352' }}>
                    {market}
                  </span>
                ))}
              </div>
            </div>
          )}

          {factoryReviews.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-white mb-3">{t('profile.reviews')}</h3>
              <div className="flex flex-col gap-3">
                {factoryReviews.map((review: any) => (
                  <div key={review.id} className="p-3 rounded-xl" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{review.userName || 'Buyer'}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-3 h-3" style={{ color: star <= review.rating ? '#F9A825' : '#243352' }} fill={star <= review.rating ? '#F9A825' : 'none'} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => navigate('rfq')}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base card-bounce"
              style={{ background: '#E53935' }}
            >
              {t('profile.requestQuote')}
            </button>
            {factory.whatsapp && (
              <a
                href={`https://wa.me/${factory.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 card-bounce"
                style={{ background: '#1A2744', color: '#25D366', border: '1px solid #243352' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('profile.whatsapp')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
