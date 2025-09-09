import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
	id: string;
	title: string;
	image?: string;
	price: number;
	qty: number;
}

interface CartState {
	items: CartItem[];
	addItem: (item: CartItem) => void;
	removeItem: (id: string) => void;
	updateQty: (id: string, qty: number) => void;
	clear: () => void;
}

export const useCart = create<CartState>()(
	persist<CartState>(
		(set, get) => ({
			items: [],
			addItem: (item) => set((s) => {
				const existing = s.items.find((i) => i.id === item.id);
				if (existing) {
					// Déjà présent: ne pas créer de doublon ni augmenter la quantité ici
					return { items: s.items };
				}
				const qty = Math.max(1, Number(item.qty || 1));
				return { items: [...s.items, { ...item, qty }] };
			}),
			removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
			updateQty: (id, qty) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, qty } : i)) })),
			clear: () => set({ items: [] }),
		}),
		{
			name: 'makiti_cart',
			version: 1,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ items: state.items })
		}
	)
);
