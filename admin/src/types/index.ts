export type Role = "customer" | "manager" | "admin" | "owner";
export type Gender = "men" | "women" | "unisex";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "payfast";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  newsletterOptIn: boolean;
  hasPassword?: boolean;
  linkedProviders?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  priceOverride: number | null;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  images: string[];
  stock: number;
  isFeatured: boolean;
  gender: Gender;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category: { name: string; slug: string };
  variants: ProductVariant[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  productId: string;
  variantId: string | null;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    label?: string;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  } | null;
  trackingNumber: string | null;
  merchantRef: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  pagination?: Pagination;
  meta?: Pagination;
}
