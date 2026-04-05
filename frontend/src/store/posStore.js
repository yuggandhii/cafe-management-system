import { create } from 'zustand';

const usePosStore = create((set, get) => ({
  currentSession: null,
  currentConfig: null,
  currentFloor: null,
  currentTable: null,
  currentOrder: null,
  cart: [],

  setSession: (session) => set({ currentSession: session }),
  setConfig: (config) => set({ currentConfig: config }),
  setFloor: (floor) => set({ currentFloor: floor }),
  setTable: (table) => set({ currentTable: table }),
  setOrder: (order) => set({ currentOrder: order }),

  // Cart helpers (local before saving to backend)
  addToCart: (product, variant = null) => {
    const cart = get().cart;
    const key = `${product.id}-${variant?.id || 'base'}`;
    const existing = cart.find((i) => i.key === key);

    if (existing) {
      set({
        cart: cart.map((i) =>
          i.key === key
            ? { ...i, quantity: i.quantity + 1, total: i.unit_price * (i.quantity + 1) }
            : i
        ),
      });
    } else {
      // Parse numeric values from API (Postgres returns strings for numeric types)
      const basePrice = parseFloat(product.price) || 0;
      const extraPrice = parseFloat(variant?.extra_price) || 0;
      const price = basePrice + extraPrice;
      const taxPercent = parseFloat(product.tax_percent) || 0;

      set({
        cart: [
          ...cart,
          {
            key,
            product_id: product.id,
            product_name: product.name,
            variant_id: variant?.id || null,
            variant_label: variant?.value || null,
            quantity: 1,
            unit_price: price,
            tax_percent: taxPercent,
            total: price,
          },
        ],
      });
    }
  },

  removeFromCart: (key) => set({ cart: get().cart.filter((i) => i.key !== key) }),

  updateQty: (key, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter((i) => i.key !== key) });
    } else {
      set({
        cart: get().cart.map((i) =>
          i.key === key ? { ...i, quantity, total: i.unit_price * quantity } : i
        ),
      });
    }
  },

  clearCart: () => set({ cart: [] }),

  cartTotal: () => {
    const cart = get().cart;
    const subtotal = cart.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    const tax = cart.reduce(
      (s, i) => s + ((parseFloat(i.total) || 0) * (parseFloat(i.tax_percent) || 0)) / 100,
      0
    );
    return { subtotal, tax, total: subtotal + tax };
  },
}));

export default usePosStore;
