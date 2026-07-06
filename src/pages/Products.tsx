import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productAPI } from '../api';
import { ProductCard, Spinner } from '../components/ui';

export default function Products() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('All');
  const { data, isLoading } = useQuery({
    queryKey: ['products', category],
    queryFn: () => productAPI.getAll(category).then((r) => r.data),
  });

  const categories = ['All', ...(data?.categories || [])];

  return (
    <div>
      <div className="bg-linear-to-br from-blush-50 to-rose-soft py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('productsPage.pageTitle')}
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            {t('productsPage.pageIntro')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {data?.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
