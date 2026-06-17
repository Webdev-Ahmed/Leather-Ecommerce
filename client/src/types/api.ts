// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = "customer" | "manager" | "admin" | "owner";

export type Gender = "men" | "women" | "unisex";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "payfast" | "jazzcash" | "easypaisa";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

// ─── User & Auth ──────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  newsletterOptIn: boolean;
  createdAt: string;
  hasPassword?: boolean;
  linkedProviders?: string[];
  updatedAt?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  newsletterOptIn?: boolean;
};

export type GoogleAuthInput = {
  idToken: string;
};

export type UpdateProfileInput = {
  name?: string;
  phone?: string;
  newsletterOptIn?: boolean;
};

// ─── Address ──────────────────────────────────────────────────────────────────

export type Address = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type CreateAddressInput = {
  label?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

// ─── CartProduct ────────────────────────────────────────────────────────────
// Minimal product shape returned by GET /cart (the server only selects 7 fields
// for cart items — a full Product isn't needed for cart display).

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: string[];
  stock: number;
};

// ─── Category ─────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
};

export type ProductCategory = {
  name: string;
  slug: string;
};

// ─── ProductVariant ───────────────────────────────────────────────────────────

export type ProductVariant = {
  id: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  sku: string | null;
  stock: number;
  priceOverride: number | null;
  images: string[];
};

// ─── Product ──────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  images: string[];
  tags: string[];
  gender: Gender;
  isFeatured: boolean;
  category: ProductCategory;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
};

export type ProductsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  gender?: Gender;
  sort?: "newest" | "price_asc" | "price_desc";
  isFeatured?: boolean;
};

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderItem = {
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
};

export type OrderEvent = {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
};

export type ShippingAddress = {
  label?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  trackingNumber: string | null;
  merchantRef: string | null;
  items: OrderItem[];
  events: OrderEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  paymentMethod: PaymentMethod;
  addressId?: string;
  shippingAddress?: ShippingAddress;
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

export type PaginatedResponse<T> = {
  status: "ok";
  data: T[];
  pagination?: PaginationMeta;
  meta?: PaginationMeta;
};

// ─── API Response wrappers ────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  status: "ok";
  data: T;
};

export type ApiError = {
  status: "error";
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── App-level error type ─────────────────────────────────────────────────────

export type AppError = {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
};
