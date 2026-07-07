import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Service, Product } from '../types';
import { imageUrl } from '../utils/image';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-rose-deep text-white hover:bg-rose-medium',
    outline: 'border-2 border-rose-deep text-rose-deep hover:bg-rose-soft',
    ghost: 'text-rose-deep hover:bg-rose-soft',
    gold: 'bg-linear-to-r from-gold-500 to-gold-400 text-white hover:from-gold-600 hover:to-gold-500',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };
  return (
    <button
      className={`rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover animate-[scale-in_0.3s_ease-out]">
      <Link to={`/services/${service._id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-blush-50">
          <img
            src={imageUrl(service.image) || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
        </div>
      </Link>
      <div className="p-5">
        <span className="inline-block text-xs font-medium text-gold-600 bg-gold-50 px-3 py-1 rounded-full mb-2">
          {service.category}
        </span>
        <Link to={`/services/${service._id}`}>
          <h3 className="text-lg font-semibold text-gray-800 mb-1 hover:text-rose-deep transition-colors">
            {service.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-rose-deep">RM{service.price}</span>
            {service.duration ? (
              <span className="flex items-center text-xs text-gray-400">
                <Clock size={14} className="mr-1" /> {service.duration}min
              </span>
            ) : null}
          </div>
          <Link
            to={`/services/${service._id}`}
            className="text-sm font-medium text-rose-deep hover:text-gold-500 transition-colors"
          >
            {t('ui.bookNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover animate-[scale-in_0.3s_ease-out]">
      <Link to={`/products/${product._id}`}>
        <div className="aspect-square overflow-hidden bg-blush-50">
          <img
            src={imageUrl(product.image) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
        </div>
      </Link>
      <div className="p-4">
        <span className="inline-block text-xs font-medium text-gold-600 bg-gold-50 px-2.5 py-0.5 rounded-full mb-2">
          {product.category}
        </span>
        <Link to={`/products/${product._id}`}>
          <h3 className="text-base font-semibold text-gray-800 mb-1 hover:text-rose-deep transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-rose-deep">RM{product.price}</span>
          <span className="text-xs text-gray-400">
            {product.stock > 0 ? t('ui.inStock', { count: product.stock }) : t('ui.outOfStock')}
          </span>
        </div>
        <div className="flex items-center mt-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className="text-gold-400 fill-gold-400" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-10 h-10 border-4 border-rose-soft border-t-rose-deep rounded-full animate-spin" />
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function PromotionIndicator({ label = 'Promotion', className = '' }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 ${className}`}>
      <Sparkles size={12} className="text-blue-500 animate-blink" />
      <span className="text-blue-600 font-bold text-xs animate-blink">{label}</span>
    </span>
  );
}

export function EmptyState({ icon: Icon, title, message }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-rose-soft flex items-center justify-center mb-4">
        <Icon size={32} className="text-rose-deep" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md">{message}</p>
    </div>
  );
}
