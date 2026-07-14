import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Tag, ArrowRight } from 'lucide-react';
import { serviceAPI, promotionAPI } from '../api';
import { ServiceCard, Spinner, PromotionIndicator } from '../components/ui';
import { imageUrl } from '../utils/image';

export default function Services() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('All');
  const { data, isLoading } = useQuery({
    queryKey: ['services', category],
    queryFn: () => serviceAPI.getAll(category).then((r) => r.data),
  });
  const { data: promoData, isLoading: promosLoading } = useQuery({
    queryKey: ['promotions-services'],
    queryFn: () => promotionAPI.getAll().then((r) => r.data),
  });

  const promotions = (promoData?.promotions || [])
    .filter((p) => p.status === 'active' && new Date(p.endDate) >= new Date())
    .slice(0, 3);

  const navigate = useNavigate();
  const handlePurchasePromo = (promoId: string) => navigate(`/promotions/${promoId}`);

  const categories = ['All', ...(data?.categories || [])];

  return (
    <div>
      <div className="bg-linear-to-br from-blush-50 to-rose-soft py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('servicesPage.pageTitle')}
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            {t('servicesPage.pageIntro')}
          </p>
        </div>
      </div>

      {/* Promotions */}
      <section className="bg-blush-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-gold-500 text-sm font-medium tracking-wider uppercase">
              <Tag size={16} /> {t('servicesPage.promotions.eyebrow')}
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('servicesPage.promotions.title')}
            </h2>
          </div>
          {promosLoading ? (
            <Spinner className="py-10" />
          ) : promotions.length === 0 ? (
            <p className="text-center text-gray-500">{t('servicesPage.promotions.empty')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((p) => {
                const discounted = p.originalPrice * (1 - p.discount / 100);
                return (
                  <div key={p._id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
                    <div className="overflow-hidden bg-blush-50">
                      <img src={imageUrl(p.image)} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                      {p.discount > 0 && (
                        <span className="absolute top-3 right-3 bg-rose-deep text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                          {p.discount}% {t('servicesPage.promotions.off')}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-2"><PromotionIndicator /></div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{p.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-rose-deep">RM{discounted.toFixed(2)}</span>
                        {p.discount > 0 && <span className="text-sm text-gray-400 line-through">RM{p.originalPrice}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-4">{t('servicesPage.promotions.validUntil')} {new Date(p.endDate).toLocaleDateString()}</p>
                      <button onClick={() => handlePurchasePromo(p._id)} className="w-full bg-linear-to-r from-rose-deep to-rose-medium text-white px-6 py-2.5 rounded-full font-medium hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        {t('servicesPage.promotions.purchase')} <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div id="services-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-rose-deep text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-rose-soft card-shadow'
              }`}
            >
                {cat === 'All' ? t('common.all') : cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner className="py-20" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data?.services || []).map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
