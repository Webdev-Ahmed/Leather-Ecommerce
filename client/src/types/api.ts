// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'CUSTOMER' | 'ADMIN'

export type Gender = 'MEN' | 'WOMEN' | 'UNISEX'

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'PAYFAST'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

// ─── User & Auth ──────────────────────────────────────────────────────────────

export type User = {
  id: string
  email: string
  name: string
  phone: string | null
  role: Role
  newsletterOptIn: boolean
  hasPassword: boolean
  linkedProviders: string[]
  createdAt: string
  updatedAt: string
}

export type AuthResponse = {
  status: 'success'
  accessToken: string
  user: User
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  name: string
  email: string
  password: string
  phone?: string
  newsletterOptIn?: boolean
}

export type GoogleAuthInput = {
  idToken: string
}

export type UpdateProfileInput = {
  name?: string
  phone?: string
  newsletterOptIn?: boolean
}

// ─── Address ──────────────────────────────────────────────────────────────────

export type Address = {
  id: string
  userId: string
  label: string | null
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  province: string
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateAddressInput = {
  label?: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  province: string
  postalCode?: string
  country: string
  isDefault?: boolean
}

export type UpdateAddressInput = Partial<CreateAddressInput>

// ─── Category ─────────────────────────────────────────────────────────────────

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  gender: Gender | null
  productCount?: number
  createdAt: string
  updatedAt: string
}

// ─── Product ──────────────────────────────────────────────────────────────────

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  discountPrice: number | null
  stock: number
  images: string[]
  tags: string[]
  gender: Gender
  isFeatured: boolean
  categoryId: string
  category: Category
  createdAt: string
  updatedAt: string
}

export type ProductsQuery = {
  page?: number
  limit?: number
  search?: string
  category?: string
  gender?: Gender | 'ALL'
  sort?: 'newest' | 'price_asc' | 'price_desc'
  isFeatured?: boolean
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderItem = {
  id: string
  orderId: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type OrderEvent = {
  id: string
  orderId: string
  status: OrderStatus
  note: string | null
  createdAt: string
}

export type ShippingAddress = {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  province: string
  postalCode: string | null
  country: string
}

export type Order = {
  id: string
  userId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: number
  deliveryFee: number
  total: number
  shippingAddress: ShippingAddress
  addressId: string | null
  items: OrderItem[]
  events: OrderEvent[]
  createdAt: string
  updatedAt: string
}

export type CreateOrderInput = {
  paymentMethod: PaymentMethod
  addressId?: string
  shippingAddress?: ShippingAddress
  items: Array<{
    productId: string
    quantity: number
  }>
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export type PaginatedResponse<T> = {
  status: 'success'
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  status: 'success'
  data: T
}

export type ApiError = {
  status: 'error'
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── App-level error type ─────────────────────────────────────────────────────

export type AppError = {
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
  statusCode?: number
}
