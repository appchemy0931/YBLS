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
import type { WeightVariant } from '../types';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<WeightVariant | undefined>(undefined);
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const product = data?.product;

  const hasWeights = !!(product && product.weights && product.weights.length > 0);
  const hideBasePrice = hasWeights && (product?.price === 0 || product?.price == null);
  const displayPrice = selectedWeight ? selectedWeight.price : (hideBasePrice ? null : product?.price);
  const effectiveStock = selectedWeight ? selectedWeight.stock : (hasWeights ? null : product?.stock);
  const inStock = selectedWeight ? selectedWeight.stock > 0 : (hasWeights ? true : (product?.stock ?? 0) > 0);

  const handleSelectWeight = (w: WeightVariant) => {
    setSelectedWeight(w);
    setQty(1);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (hasWeights && !selectedWeight) {
      toast.error('Please select a weight variant');
      return;
    }
    addToCart(product, qty, selectedWeight);
    toast.success(t('productsPage.addedToCart', { name: product.name }));
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (hasWeights && !selectedWeight) {
      toast.error('Please select a weight variant');
      return;
    }
    addToCart(product, qty, selectedWeight);
    navigate('/cart');
  };

  if (isLoading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-deep mb-6 transition-colors">
        <ChevronLeft size={16} /> {t('productsPage.backToProducts')}
      </Link>

      <div className="grid lg:grid-cols-1.5 gap-4">
        <div className="rounded-2xl overflow-hidden card-shadow">
          <img
            src={imageUrl(product?.image) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'}
            alt={product?.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <Badge variant="info">{product?.category}</Badge>
          <h1 className="text-3xl font-bold text-gray-800 mt-3 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            {product?.name}
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">{product?.description}</p>

          {displayPrice != null ? (
            <div className="text-3xl font-bold text-rose-deep mb-4">RM{displayPrice.toFixed(2)}</div>
          ) : (
            <div className="text-lg text-gray-400 mb-4">Select a variant to see price</div>
          )}

          {hasWeights && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Select Weight Variant</label>
              <div className="flex flex-wrap gap-2">
                {product!.weights!.map((w, i) => {
                  const wInStock = w.stock > 0;
                  const isSelected = selectedWeight?.label === w.label;
                  return (
                    <button
                      key={i}
                      onClick={() => wInStock && handleSelectWeight(w)}
                      disabled={!wInStock}
                      className={`px-4 py-2.5 rounded-xl border-2 text-xl font-medium transition-all ${
                        isSelected
                          ? 'border-rose-deep bg-rose-soft text-rose-deep'
                          : wInStock
                            ? 'border-gray-200 bg-white text-gray-600 hover:border-rose-soft'
                            : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <span>{w.label}</span>
                      <span className="ml-2 text-rose-deep font-bold">RM{w.price.toFixed(2)}</span>
                      <span className={`ml-2 text-xs ${wInStock ? 'text-green-600' : 'text-red-400'}`}>
                        {wInStock ? `Stock: ${w.stock}` : 'Out of stock'}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!selectedWeight && (
                <p className="text-xs text-gray-400 mt-2">Please select a variant to continue.</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            {hasWeights ? (
              selectedWeight ? (
                inStock ? (
                  <Badge variant="success">{t('productsPage.inStock', { count: effectiveStock })}</Badge>
                ) : (
                  <Badge variant="danger">{t('productsPage.outOfStock')}</Badge>
                )
              ) : (
                <Badge variant="blue">See variants for stock</Badge>
              )
            ) : inStock ? (
              <Badge variant="success">{t('productsPage.inStock', { count: effectiveStock })}</Badge>
            ) : (
              <Badge variant="danger">{t('productsPage.outOfStock')}</Badge>
            )}
          </div>

          {inStock && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">{t('productsPage.quantity')}</span>
                <div className="flex items-center gap-3 border border-gray-200 rounded-full px-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-gray-600 hover:text-rose-deep">
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(Math.min(effectiveStock ?? 99, qty + 1))} className="p-2 text-gray-600 hover:text-rose-deep">
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
