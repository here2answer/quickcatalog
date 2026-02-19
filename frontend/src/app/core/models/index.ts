// Auth models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  companyName: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  gstin?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  companyName: string;
}

// Category models
export interface Category {
  id: string;
  name: string;
  parentId?: string;
  hsnCodeDefault?: string;
  defaultGstRate?: string;
  attributesSchema?: string;
  sortOrder: number;
  active: boolean;
  children?: Category[];
}

export interface CategoryRequest {
  name: string;
  parentId?: string;
  hsnCodeDefault?: string;
  defaultGstRate?: string;
  attributesSchema?: string;
  sortOrder?: number;
}

// Product models
export interface Product {
  id: string;
  name: string;
  slug?: string;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  manufacturer?: string;
  sku?: string;
  shortDescription?: string;
  longDescription?: string;
  hsnCode?: string;
  sacCode?: string;
  gstRate?: string;
  barcodeType?: string;
  barcodeValue?: string;
  mrp?: number;
  sellingPrice?: number;
  costPrice?: number;
  unit?: string;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  trackInventory: boolean;
  currentStock?: number;
  lowStockThreshold?: number;
  customAttributes?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status: string;
  featured: boolean;
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  sku?: string;
  thumbnailUrl?: string;
  categoryName?: string;
  mrp?: number;
  sellingPrice?: number;
  gstRate?: string;
  status: string;
  currentStock?: number;
  lowStockThreshold?: number;
  trackInventory: boolean;
  tags?: string[];
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  originalUrl: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  altText?: string;
  primary: boolean;
  sortOrder: number;
}

// Lookup models
export interface HsnCode {
  code: string;
  description: string;
  gstRate?: string;
  chapter?: string;
}

export interface UnitOption {
  value: string;
  displayName: string;
}

export interface GstRateOption {
  value: string;
  rate: number;
  displayName: string;
}

// Dashboard models
export interface DashboardSummary {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
}

export interface RecentActivity {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: string;
  createdAt: string;
}

// API response models
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Attribute schema model
export interface AttributeDefinition {
  name: string;
  type: 'text' | 'number' | 'select' | 'multi-select' | 'boolean';
  options?: string[];
  unit?: string;
  required?: boolean;
}

// AI models
export interface AiGenerationResult {
  generatedText: string;
  model: string;
  tokensUsed?: number;
  logId: string;
}

export interface AiSeoResult {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  model: string;
  logId: string;
}

export interface AiHsnSuggestion {
  code: string;
  description: string;
  gstRate?: string;
}

// Product variant models
export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string;
  sku?: string;
  barcodeValue?: string;
  attributes?: Record<string, string>;
  mrp?: number;
  sellingPrice?: number;
  costPrice?: number;
  currentStock?: number;
  weightGrams?: number;
  imageId?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BarcodeResult {
  barcodeValue: string;
  barcodeImageBase64: string;
}
