import api from './api';
import { Paginated } from './admin';

export interface Product {
  id: number;
  vendor_id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  stock: number | null; // null = not tracked
  images: string[];
  image_urls: string[];
  in_stock: boolean;
  is_active: boolean;
  sold_count: number;
  vendor?: {
    id: number;
    name: string;
    city: string;
    is_verified?: boolean;
    offers_pickup?: boolean;
    offers_delivery?: boolean;
    delivery_fee?: number | string;
    pickup_address?: string | null;
    delivery_note?: string | null;
  };
}

export interface PortfolioItem {
  id: number;
  title: string;
  description: string | null;
  image: string;
  image_url: string;
}

export interface ShopOrderLine {
  id: number;
  product_id: number | null;
  name: string;
  image_url: string | null;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export type ShopOrderStatus = 'paid' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'refunded';

export interface ShopOrder {
  id: number;
  reference: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  delivery_method: 'pickup' | 'delivery';
  delivery_address: string | null;
  subtotal: string;
  delivery_fee: string;
  total: string;
  fee_amount: string;
  fee_percentage: string;
  vendor_payout?: number;
  status: ShopOrderStatus;
  vendor_note: string | null;
  delivered_at: string | null;
  created_at: string;
  items: ShopOrderLine[];
  vendor?: { id: number; name: string; contact_phone: string | null; contact_email: string; pickup_address: string | null };
}

export const STATUS_LABEL: Record<ShopOrderStatus, string> = {
  paid: 'New',
  processing: 'Preparing',
  ready: 'Ready for pickup',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  refunded: 'Refunded',
};

export const num = (v: number | string | null | undefined) => Number(v ?? 0);
export const naira = (n: number | string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(num(n));

export const shop = {
  // --- Public ---
  async products(params?: { search?: string; category?: string; vendor_id?: number; sort?: string; page?: number }) {
    const { data } = await api.get('/products', { params });
    return data as Paginated<Product>;
  },

  async categories(): Promise<{ category: string; product_count: number }[]> {
    const { data } = await api.get('/products/categories');
    return data;
  },

  async product(id: number): Promise<Product> {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  async myOrders(page = 1) {
    const { data } = await api.get('/my-orders', { params: { page } });
    return data as Paginated<ShopOrder>;
  },

  // --- Vendor's own storefront ---
  async myProducts(): Promise<Product[]> {
    const { data } = await api.get('/vendor/products');
    return data;
  },

  async saveProduct(form: FormData, id?: number): Promise<Product> {
    const { data } = await api.post(id ? `/vendor/products/${id}` : '/vendor/products', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteProduct(id: number): Promise<{ message: string; hidden?: boolean }> {
    const { data } = await api.delete(`/vendor/products/${id}`);
    return data;
  },

  async myPortfolio(): Promise<PortfolioItem[]> {
    const { data } = await api.get('/vendor/portfolio');
    return data;
  },

  async addPortfolio(form: FormData): Promise<PortfolioItem> {
    const { data } = await api.post('/vendor/portfolio', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  async deletePortfolio(id: number) {
    await api.delete(`/vendor/portfolio/${id}`);
  },

  async saveDelivery(payload: { offers_pickup: boolean; pickup_address: string | null; offers_delivery: boolean; delivery_fee: number; delivery_note: string | null }) {
    const { data } = await api.put('/vendor/delivery', payload);
    return data;
  },

  async vendorOrders(params?: { status?: string; page?: number }) {
    const { data } = await api.get('/vendor/orders', { params });
    return data as { orders: Paginated<ShopOrder>; counts: Record<string, number> };
  },

  async setOrderStatus(id: number, status: ShopOrderStatus, note?: string): Promise<ShopOrder> {
    const { data } = await api.put(`/vendor/orders/${id}/status`, { status, note: note || null });
    return data;
  },
};
