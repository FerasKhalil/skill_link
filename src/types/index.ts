export type Locale = 'ar' | 'en';
export type AccountState = 'active' | 'pending_verification' | 'limited' | 'suspended' | 'deleted' | 'blocked';
export type UserRole = 'customer' | 'provider' | 'admin' | 'moderator' | 'verification_admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'more_information_required' | 'expired';
export type BookingState = 'draft' | 'pending_provider' | 'confirmed' | 'declined' | 'cancelled_by_customer' | 'cancelled_by_provider' | 'completed' | 'no_show' | 'expired';
export type BookingPolicy = 'AUTO_ACCEPT' | 'REQUIRES_PROVIDER_APPROVAL';
export type DeliveryMode = 'online' | 'provider_location' | 'customer_location';
export type PricingModel = 'fixed' | 'starting_from' | 'hourly' | 'quote_only';
export type ReportReason = 'scam_risk' | 'inappropriate_content' | 'fake_profile' | 'fake_review' | 'unsafe_provider' | 'abuse' | 'other';
export type ReportStatus = 'new' | 'investigating' | 'actioned' | 'dismissed' | 'resolved';
export type ReviewProvenance = 'BOOKING_VERIFIED' | 'EXPERIENCE_UNVERIFIED';
export type CategoryStatus = 'active' | 'inactive' | 'draft';
export type ListingStatus = 'draft' | 'active' | 'paused' | 'archived' | 'under_review';
export type NotificationType = 'verification' | 'message' | 'booking' | 'quote' | 'review' | 'report' | 'system';

export interface User {
  id: string;
  email: string;
  emailVerifiedAt?: string;
  phone?: string;
  phoneVerifiedAt?: string;
  displayName: string;
  preferredLocale: Locale;
  accountState: AccountState;
  roles: UserRole[];
  avatar?: string;
  createdAt: string;
  providerProfile?: ProviderProfile;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  slug: string;
  title?: string;
  bio?: string;
  experience?: string;
  city?: string;
  neighborhood?: string;
  verificationSummary: {
    identity: VerificationStatus;
    email: boolean;
    phone: boolean;
    affiliation?: VerificationStatus;
  };
  publicationStatus: 'published' | 'unpublished' | 'suspended';
  rating?: number;
  reviewCount: number;
  serviceCount: number;
  responseRate?: number;
  responseTime?: string;
  user: User;
  listings: Listing[];
}

export interface Category {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  parentId?: string;
  status: CategoryStatus;
  displayOrder: number;
  icon?: string;
  children?: Category[];
  listingCount?: number;
}

export interface Listing {
  id: string;
  providerId: string;
  categoryId: string;
  category?: Category;
  title: string;
  description: string;
  status: ListingStatus;
  moderationState: 'approved' | 'pending' | 'rejected';
  deliveryModes: DeliveryModeListing[];
  images: string[];
  serviceAttributes?: Record<string, unknown>;
  rating?: number;
  reviewCount: number;
  createdAt: string;
  provider?: ProviderProfile;
}

export interface DeliveryModeListing {
  mode: DeliveryMode;
  enabled: boolean;
  pricing: PricingEntry[];
  serviceAreas: ServiceArea[];
  availability?: AvailabilityRule[];
  bookingPolicy: BookingPolicy;
}

export interface PricingEntry {
  model: PricingModel;
  amount?: number;
  currency: string;
  unit?: string;
  isPublic: boolean;
  description?: string;
}

export interface ServiceArea {
  city: string;
  neighborhood?: string;
  radiusKm?: number;
}

export interface AvailabilityRule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacity: number;
}

export interface AvailabilityException {
  date: string;
  unavailable: boolean;
  startTime?: string;
  endTime?: string;
}

export interface Conversation {
  id: string;
  contextType: 'listing' | 'quote' | 'booking';
  contextId: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  listing?: Listing;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'attachment' | 'system';
  sentAt: string;
  readAt?: string;
  sender?: User;
}

export interface QuoteRequest {
  id: string;
  customerId: string;
  listingId: string;
  preferredMode: DeliveryMode;
  description: string;
  preferredTiming?: string;
  status: 'pending' | 'responded' | 'declined' | 'expired';
  conversationId?: string;
  createdAt: string;
  listing?: Listing;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  listingId: string;
  deliveryMode: DeliveryMode;
  startTime: string;
  endTime: string;
  state: BookingState;
  policy: BookingPolicy;
  cancellationReason?: string;
  createdAt: string;
  listing?: Listing;
  customer?: User;
  provider?: ProviderProfile;
}

export interface Review {
  id: string;
  authorId: string;
  providerId: string;
  listingId: string;
  bookingId?: string;
  rating: number;
  text: string;
  provenance: ReviewProvenance;
  visible: boolean;
  moderationStatus: 'approved' | 'pending' | 'hidden' | 'rejected';
  createdAt: string;
  author?: User;
  provider?: ProviderProfile;
  response?: string;
  responseAt?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'listing' | 'message' | 'review' | 'booking' | 'attachment';
  targetId: string;
  reason: ReportReason;
  notes?: string;
  status: ReportStatus;
  owner?: string;
  outcome?: string;
  createdAt: string;
  reporter?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface SearchResult {
  listings: Listing[];
  total: number;
  page: number;
  pageSize: number;
  filters: Record<string, unknown>;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  deliveryMode?: DeliveryMode[];
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  verifiedOnly?: boolean;
  availableToday?: boolean;
  gender?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'rating' | 'distance' | 'newest';
}

export interface MapResult {
  listingId: string;
  providerName: string;
  lat: number;
  lng: number;
  serviceArea?: { lat: number; lng: number; radius: number }[];
  category: string;
  rating?: number;
  verified: boolean;
}
