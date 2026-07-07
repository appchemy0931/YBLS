import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productAPI } from '../api';
import { useCart } from '../context/CartContext';
import { Spinner, Button, Badge } from '../components/ui';
import { imageUrl } from '../utils/image';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const product = data?.product;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    toast.success(t('productsPage.addedToCart', { name: product.name }));
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, qty);
    navigate('/cart');
  };

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-deep mb-6 transition-colors">
        <ChevronLeft size={16} /> {t('productsPage.backToProducts')}
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden card-shadow">
          <img
            src={imageUrl(product?.image) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'}
            alt={product?.name}
            className="w-full h-96 object-cover"
          />
        </div>

        <div className="flex flex-col">
          <Badge variant="info">{product?.category}</Badge>
          <h1 className="text-3xl font-bold text-gray-800 mt-3 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            {product?.name}
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">{product?.description}</p>

          <div className="text-3xl font-bold text-rose-deep mb-4">RM{product?.price}</div>

          <div className="flex items-center gap-3 mb-6">
            {product && product.stock > 0 ? (
              <Badge variant="success">{t('productsPage.inStock', { count: product.stock })}</Badge>
            ) : (
              <Badge variant="danger">{t('productsPage.outOfStock')}</Badge>
            )}
          </div>

          {product && product.stock > 0 && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">{t('productsPage.quantity')}</span>
                <div className="flex items-center gap-3 border border-gray-200 rounded-full px-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-gray-600 hover:text-rose-deep">
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 text-gray-600 hover:text-rose-deep">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleAddToCart} variant="outline" size="lg">
                  <ShoppingCart size={18} className="mr-2" /> {t('productsPage.addToCart')}
                </Button>
                <Button onClick={handleBuyNow} size="lg">
                  {t('productsPage.buyNow')}
                </Button>
              </div>
            </>
          )}

          <div className="mt-8 p-4 rounded-xl bg-blush-50">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Check size={16} className="text-green-500" /> {t('productsPage.authenticGuaranteed')}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Check size={16} className="text-green-500" /> {t('productsPage.securePayment')}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={16} className="text-green-500" /> {t('productsPage.fastDelivery')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
