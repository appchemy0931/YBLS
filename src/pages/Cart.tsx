import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart, itemPrice } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState } from '../components/ui';
import { imageUrl } from '../utils/image';

export default function Cart() {
  const { cart, removeFromCart, updateQty, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState icon={ShoppingBag} title={t('cart.empty')} message={t('cart.emptyMsg')} />
        <div className="text-center mt-4">
          <Link to="/products" className="text-rose-deep font-medium hover:underline">{t('cart.shopProducts')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>{t('cart.pageTitle')}</h1>
      <p className="text-gray-500 mb-8">{t('cart.itemsInCart', { count: cart.length })}</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => {
            const wLabel = item.weightVariant?.label;
            const price = itemPrice(item);
            return (
              <div key={`${item.product._id}-${wLabel || 'default'}`} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-4">
                <img src={imageUrl(item.product.image)} alt={item.product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{item.product.name}</h3>
                  <p className="text-sm text-gray-400">{item.product.category}</p>
                  {wLabel && (
                    <span className="inline-block mt-0.5 text-xs bg-blush-50 text-gray-700 px-2 py-0.5 rounded-full">{wLabel}</span>
                  )}
                  {item.weightVariant && (
                    <span className={`inline-block mt-0.5 ml-1 text-xs ${item.weightVariant.stock > 0 ? 'text-green-600' : 'text-red-400'}`}>
                      Stock: {item.weightVariant.stock}
                    </span>
                  )}
                  <p className="text-lg font-bold text-rose-deep mt-1">RM{price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product._id, item.qty - 1, wLabel)} className="w-8 h-8 rounded-lg bg-blush-50 flex items-center justify-center hover:bg-rose-soft transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{item.qty}</span>
                  <button onClick={() => updateQty(item.product._id, item.qty + 1, wLabel)} className="w-8 h-8 rounded-lg bg-blush-50 flex items-center justify-center hover:bg-rose-soft transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.product._id, wLabel)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 transition-colors">{t('cart.clearAll')}</button>
        </div>

        <div className="bg-white rounded-2xl p-6 card-shadow h-fit sticky top-24">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('cart.orderSummary')}</h2>
          <div className="space-y-2 mb-4">
            {cart.map((item) => {
              const wLabel = item.weightVariant?.label;
              const price = itemPrice(item);
              return (
                <div key={`${item.product._id}-${wLabel || 'default'}`} className="flex justify-between text-sm text-gray-500">
                  <span className="truncate mr-2">{item.product.name}{wLabel ? ` (${wLabel})` : ''} × {item.qty}</span>
                  <span>RM{(price * item.qty).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 pt-4 mb-5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">{t('cart.total')}</span>
              <span className="text-2xl font-bold text-rose-deep">RM{cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <Button onClick={() => navigate('/checkout')} className="w-full" size="lg">
            {t('cart.proceedToCheckout')} <ArrowRight size={18} className="inline ml-1" />
          </Button>
          <Link to="/products" className="block text-center text-sm text-gray-400 hover:text-rose-deep mt-3">{t('cart.continueShopping')}</Link>
        </div>
      </div>
    </div>
  );
}
