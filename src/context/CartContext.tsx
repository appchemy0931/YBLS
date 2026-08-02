import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CartItem, Product, WeightVariant, User } from '../types';
import { useAuth } from './AuthContext';
import { cartAPI } from '../api';

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

const STORAGE_KEY = 'cart';

const cartItemKey = (productId: string, weightLabel?: string) =>
  weightLabel ? `${productId}::${weightLabel}` : productId;

const itemPrice = (item: CartItem) =>
  item.weightVariant ? item.weightVariant.price : item.product.price;

const itemsToPayload = (items: CartItem[]) =>
  items.map((item) => ({
    productId: item.product._id,
    qty: item.qty,
    weightLabel: item.weightVariant?.label,
  }));

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return [];
  });

  const hydrated = useRef(false);
  const hydratedForUser = useRef<string | null>(null);
  const previousUser = useRef<User | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: serverCart } = useQuery({
    queryKey: ['cart', user?._id],
    queryFn: () => cartAPI.getMy().then((res) => res.data.cart),
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Clear local cart and query cache when the user logs out.
  useEffect(() => {
    if (previousUser.current && !user) {
      setCart([]);
      localStorage.removeItem(STORAGE_KEY);
      queryClient.removeQueries({ queryKey: ['cart'] });
      hydrated.current = false;
      hydratedForUser.current = null;
    }
    previousUser.current = user ?? null;
  }, [user, queryClient]);

  // Hydrate cart from the database when a logged-in user is known.
  useEffect(() => {
    if (!user) {
      hydrated.current = false;
      hydratedForUser.current = null;
      return;
    }

    if (user._id !== hydratedForUser.current) {
      hydrated.current = false;
      hydratedForUser.current = user._id;
    }

    if (serverCart === undefined || hydrated.current) return;
    hydrated.current = true;

    if (serverCart.length > 0) {
      setCart(serverCart);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverCart));
    } else {
      // Server cart is empty: upload any locally stored items once.
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const localItems = JSON.parse(stored) as CartItem[];
          if (localItems.length > 0) {
            setCart(localItems);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems));
            cartAPI.save(itemsToPayload(localItems));
            return;
          }
        } catch {
          // ignore parse errors
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
  }, [user, serverCart]);

  // Clean up any pending sync timer on unmount.
  useEffect(() => {
    return () => {
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    };
  }, []);

  const scheduleSave = useCallback(
    (items: CartItem[]) => {
      if (!user) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        cartAPI.save(itemsToPayload(items));
      }, 300);
    },
    [user]
  );

  const addToCart = (product: Product, qty = 1, weightVariant?: WeightVariant) => {
    const wLabel = weightVariant?.label;
    setCart((prev) => {
      const key = cartItemKey(product._id, wLabel);
      const existing = prev.find(
        (item) => cartItemKey(item.product._id, item.weightVariant?.label) === key
      );
      const next = existing
        ? prev.map((item) =>
            cartItemKey(item.product._id, item.weightVariant?.label) === key
              ? { ...item, qty: item.qty + qty }
              : item
          )
        : [...prev, { product, qty, weightVariant }];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      scheduleSave(next);
      return next;
    });
  };

  const removeFromCart = (productId: string, weightLabel?: string) => {
    setCart((prev) => {
      const next = prev.filter(
        (item) =>
          cartItemKey(item.product._id, item.weightVariant?.label) !==
          cartItemKey(productId, weightLabel)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      scheduleSave(next);
      return next;
    });
  };

  const updateQty = (productId: string, qty: number, weightLabel?: string) => {
    if (qty < 1) return;
    setCart((prev) => {
      const next = prev.map((item) =>
        cartItemKey(item.product._id, item.weightVariant?.label) ===
        cartItemKey(productId, weightLabel)
          ? { ...item, qty }
          : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      scheduleSave(next);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(STORAGE_KEY);
    if (user) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        cartAPI.save([]);
      }, 300);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + itemPrice(item) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount }}
    >
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
