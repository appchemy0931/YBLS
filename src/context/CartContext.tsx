import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product, WeightVariant } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty?: number, weightVariant?: WeightVariant) => void;
  removeFromCart: (productId: string, weightLabel?: string) => void;
  updateQty: (productId: string, qty: number, weightLabel?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartItemKey = (productId: string, weightLabel?: string) =>
  weightLabel ? `${productId}::${weightLabel}` : productId;

const itemPrice = (item: CartItem) =>
  item.weightVariant ? item.weightVariant.price : item.product.price;

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loading persisted state from localStorage
        setCart(JSON.parse(stored));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, qty = 1, weightVariant?: WeightVariant) => {
    const wLabel = weightVariant?.label;
    setCart((prev) => {
      const existing = prev.find((item) => cartItemKey(item.product._id, item.weightVariant?.label) === cartItemKey(product._id, wLabel));
      if (existing) {
        return prev.map((item) =>
          cartItemKey(item.product._id, item.weightVariant?.label) === cartItemKey(product._id, wLabel) ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { product, qty, weightVariant }];
    });
  };

  const removeFromCart = (productId: string, weightLabel?: string) => {
    setCart((prev) => prev.filter((item) => cartItemKey(item.product._id, item.weightVariant?.label) !== cartItemKey(productId, weightLabel)));
  };

  const updateQty = (productId: string, qty: number, weightLabel?: string) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        cartItemKey(item.product._id, item.weightVariant?.label) === cartItemKey(productId, weightLabel) ? { ...item, qty } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + itemPrice(item) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export { itemPrice, cartItemKey };
