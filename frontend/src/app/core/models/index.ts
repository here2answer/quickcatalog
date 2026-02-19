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

// Channel models
export type ChannelType = 'AMAZON' | 'FLIPKART' | 'ONDC' | 'WEBSITE' | 'MEESHO' | 'JIOMART' | 'CUSTOM';
export type ListingStatus = 'NOT_LISTED' | 'PENDING' | 'LIVE' | 'SUPPRESSED' | 'ERROR';
export type SyncFrequency = 'MANUAL' | 'HOURLY' | 'DAILY' | 'WEEKLY';

export interface Channel {
  id: string;
  channelType: ChannelType;
  channelName: string;
  credentials?: string;
  fieldMapping?: string;
  active: boolean;
  syncFrequency: SyncFrequency;
  lastSyncedAt?: string;
  liveListings: number;
  pendingListings: number;
  errorListings: number;
  createdAt?: string;
}

export interface ChannelListing {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  channelId: string;
  channelName?: string;
  channelType?: ChannelType;
  listingStatus: ListingStatus;
  externalListingId?: string;
  externalUrl?: string;
  channelPrice?: number;
  channelComparePrice?: number;
  lastSyncedAt?: string;
  syncError?: string;
}

export interface ListingSummary {
  channelId: string;
  channelName?: string;
  channelType?: ChannelType;
  listingStatus: ListingStatus;
  channelPrice?: number;
}

// Import models
export interface ImportJob {
  id: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface ImportError {
  row: number;
  field: string;
  error: string;
}

// User management models
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface InviteUserRequest {
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export interface UpdateRoleRequest {
  role: string;
}

// Duplicate detection models
export interface DuplicateGroup {
  productId: string;
  productName: string;
  productSku: string;
  matches: DuplicateMatch[];
}

export interface DuplicateMatch {
  id: string;
  name: string;
  sku: string;
  status: string;
  matchType: string;
  similarityScore: number;
}

// ONDC models
export type OndcEnvironment = 'STAGING' | 'PRE_PROD' | 'PRODUCTION';
export type RegistrationStatus = 'PENDING' | 'INITIATED' | 'SUBSCRIBED' | 'FAILED';
export type OndcOrderState = 'CREATED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
export type FulfillmentType = 'DELIVERY' | 'SELF_PICKUP';
export type FulfillmentState = 'PENDING' | 'PACKED' | 'AGENT_ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'ORDER_DELIVERED' | 'CANCELLED' | 'RTO_INITIATED' | 'RTO_DELIVERED';
export type PaymentType = 'PRE_PAID' | 'ON_DELIVERY' | 'POST_FULFILLMENT';
export type SettlementStatus = 'PENDING' | 'SETTLED';

export interface OndcSubscriber {
  id: string;
  subscriberId: string;
  subscriberUrl: string;
  environment: OndcEnvironment;
  signingPublicKey?: string;
  encryptionPublicKey?: string;
  uniqueKeyId?: string;
  domain?: string;
  cityCodes?: string[];
  registrationStatus: RegistrationStatus;
  lastSubscribeAt?: string;
  createdAt?: string;
}

export interface OndcSubscriberRequest {
  subscriberId: string;
  subscriberUrl: string;
  environment?: OndcEnvironment;
  domain?: string;
  cityCodes?: string[];
}

export interface OndcProvider {
  id: string;
  providerId: string;
  name: string;
  shortDesc?: string;
  longDesc?: string;
  logoUrl?: string;
  gpsCoordinates: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressAreaCode: string;
  addressCountry: string;
  contactPhone: string;
  contactEmail: string;
  supportPhone?: string;
  supportEmail?: string;
  supportUrl?: string;
  fssaiLicenseNo?: string;
  storeTimingStart?: string;
  storeTimingEnd?: string;
  storeDays?: string;
  defaultTimeToShip?: string;
  defaultReturnable?: boolean;
  defaultCancellable?: boolean;
  defaultReturnWindow?: string;
  defaultCodAvailable?: boolean;
  active: boolean;
  createdAt?: string;
}

export interface OndcProviderRequest {
  name: string;
  shortDesc?: string;
  longDesc?: string;
  logoUrl?: string;
  gpsCoordinates: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressAreaCode: string;
  addressCountry?: string;
  contactPhone: string;
  contactEmail: string;
  supportPhone?: string;
  supportEmail?: string;
  supportUrl?: string;
  fssaiLicenseNo?: string;
  storeTimingStart?: string;
  storeTimingEnd?: string;
  storeDays?: string;
  defaultTimeToShip?: string;
  defaultReturnable?: boolean;
  defaultCancellable?: boolean;
  defaultReturnWindow?: string;
  defaultCodAvailable?: boolean;
}

export interface OndcProductConfig {
  id: string;
  productId: string;
  ondcDomain: string;
  ondcCategoryId?: string;
  timeToShip?: string;
  returnable?: boolean;
  cancellable?: boolean;
  returnWindow?: string;
  sellerPickupReturn?: boolean;
  codAvailable?: boolean;
  maxOrderQuantity?: number;
  countryOfOrigin?: string;
  isVeg?: boolean;
  isNonVeg?: boolean;
  isEgg?: boolean;
  statutoryInfo?: string;
  publishedToOndc: boolean;
  lastPublishedAt?: string;
}

export interface OndcProductConfigRequest {
  ondcDomain: string;
  ondcCategoryId?: string;
  timeToShip?: string;
  returnable?: boolean;
  cancellable?: boolean;
  returnWindow?: string;
  sellerPickupReturn?: boolean;
  codAvailable?: boolean;
  maxOrderQuantity?: number;
  countryOfOrigin?: string;
  isVeg?: boolean;
  isNonVeg?: boolean;
  isEgg?: boolean;
  statutoryInfo?: string;
}

export interface OndcOrderListItem {
  id: string;
  becknOrderId: string;
  state: OndcOrderState;
  itemCount: number;
  totalAmount?: number;
  buyerName?: string;
  buyerPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OndcOrderDetail {
  id: string;
  becknOrderId: string;
  state: OndcOrderState;
  createdAt: string;
  updatedAt?: string;
  billingName?: string;
  billingPhone?: string;
  billingEmail?: string;
  billingAddress?: any;
  items: OndcOrderItem[];
  fulfillment?: OndcFulfillmentInfo;
  payment?: OndcPaymentInfo;
}

export interface OndcOrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
}

export interface OndcFulfillmentInfo {
  id: string;
  type: FulfillmentType;
  state: FulfillmentState;
  trackingUrl?: string;
  agentName?: string;
  agentPhone?: string;
  deliveryAddress?: any;
  deliveryGps?: string;
}

export interface OndcPaymentInfo {
  id: string;
  type: PaymentType;
  collectedBy?: string;
  transactionId?: string;
  settlementStatus: SettlementStatus;
  buyerAppFinderFeeAmount?: number;
}

// Enhanced dashboard models
export interface ChannelStatus {
  channelId: string;
  channelName: string;
  channelType: string;
  liveCount: number;
  pendingCount: number;
  errorCount: number;
  totalListings: number;
}

export interface CatalogHealth {
  totalProducts: number;
  productsWithImages: number;
  productsWithDescriptions: number;
  productsWithSeo: number;
  productsWithBarcode: number;
  productsWithHsn: number;
  completenessPercent: number;
  statusDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
}
