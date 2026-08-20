import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────
export const accountStateEnum = pgEnum('account_state', ['active', 'suspended', 'deactivated']);
export const userRoleEnum = pgEnum('user_role', ['customer', 'provider', 'admin', 'moderator']);
export const verificationStatusEnum = pgEnum('verification_status', ['none', 'pending', 'approved', 'rejected', 'requires_info']);
export const bookingStateEnum = pgEnum('booking_state', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const bookingPolicyEnum = pgEnum('booking_policy', ['auto', 'manual']);
export const deliveryModeEnum = pgEnum('delivery_mode', ['onsite', 'remote', 'both']);
export const pricingModelEnum = pgEnum('pricing_model', ['hourly', 'fixed', 'starting_at']);
export const reportReasonEnum = pgEnum('report_reason', ['spam', 'inappropriate', 'fraud', 'harassment', 'fake_profile', 'safety', 'other']);
export const reportStatusEnum = pgEnum('report_status', ['open', 'under_review', 'resolved', 'dismissed']);
export const reviewProvenanceEnum = pgEnum('review_provenance', ['booking_verified', 'experience_unverified']);
export const categoryStatusEnum = pgEnum('category_status', ['active', 'inactive', 'suggested', 'merged']);
export const listingStatusEnum = pgEnum('listing_status', ['draft', 'active', 'paused', 'archived', 'rejected']);
export const notificationTypeEnum = pgEnum('notification_type', ['message', 'booking', 'review', 'quote', 'verification', 'system', 'report']);
export const mediaTypeEnum = pgEnum('media_type', ['profile_image', 'listing_image', 'chat_attachment', 'identity_document', 'affiliation_evidence', 'report_evidence']);

// ─── Users ───────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 200 }),
  avatarUrl: text('avatar_url'),
  locale: varchar('locale', { length: 5 }).notNull().default('en'),
  role: userRoleEnum('role').notNull().default('customer'),
  accountState: accountStateEnum('account_state').notNull().default('active'),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifyToken: varchar('email_verify_token', { length: 255 }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpiry: timestamp('password_reset_expiry'),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  phoneVerifyCode: varchar('phone_verify_code', { length: 10 }),
  phoneVerifyExpiry: timestamp('phone_verify_expiry'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('users_email_idx').on(t.email),
  index('users_role_idx').on(t.role),
  index('users_account_state_idx').on(t.accountState),
]);

// ─── Sessions ────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('sessions_token_idx').on(t.token),
  index('sessions_user_id_idx').on(t.userId),
  index('sessions_expires_at_idx').on(t.expiresAt),
]);

// ─── Provider Profiles ───────────────────────────────
export const providerProfiles = pgTable('provider_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  profession: varchar('profession', { length: 200 }),
  title: varchar('title', { length: 200 }),
  bio: text('bio'),
  bioAr: text('bio_ar'),
  experience: text('experience'),
  yearsExperience: integer('years_experience'),
  gender: varchar('gender', { length: 20 }),
  verificationStatus: verificationStatusEnum('verification_status').notNull().default('none'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verificationNotes: text('verification_notes'),
  identityVerified: boolean('identity_verified').notNull().default(false),
  identityDocUrl: text('identity_doc_url'),
  affiliationVerified: boolean('affiliation_verified').notNull().default(false),
  affiliationDocUrl: text('affiliation_doc_url'),
  affiliationOrg: varchar('affiliation_org', { length: 200 }),
  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }).default('0'),
  ratingCount: integer('rating_count').notNull().default(0),
  bookingCount: integer('booking_count').notNull().default(0),
  responseTime: varchar('response_time', { length: 50 }),
  locationLat: decimal('location_lat', { precision: 10, scale: 7 }),
  locationLng: decimal('location_lng', { precision: 10, scale: 7 }),
  locationCity: varchar('location_city', { length: 100 }),
  locationGovernorate: varchar('location_governorate', { length: 100 }),
  locationApproximate: text('location_approximate'),
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('provider_profiles_user_id_idx').on(t.userId),
  index('provider_profiles_verification_idx').on(t.verificationStatus),
  index('provider_profiles_location_idx').on(t.locationLat, t.locationLng),
]);

// ─── Provider Applications ───────────────────────────
export const providerApplications = pgTable('provider_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerProfileId: uuid('provider_profile_id').references(() => providerProfiles.id),
  status: verificationStatusEnum('status').notNull().default('pending'),
  profession: varchar('profession', { length: 200 }),
  title: varchar('title', { length: 200 }),
  bio: text('bio'),
  bioAr: text('bio_ar'),
  experience: text('experience'),
  yearsExperience: integer('years_experience'),
  gender: varchar('gender', { length: 20 }),
  identityDocUrl: text('identity_doc_url'),
  affiliationDocUrl: text('affiliation_doc_url'),
  affiliationOrg: varchar('affiliation_org', { length: 200 }),
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('provider_applications_user_id_idx').on(t.userId),
  index('provider_applications_status_idx').on(t.status),
]);

// ─── Categories ──────────────────────────────────────
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 200 }).notNull(),
  nameAr: varchar('name_ar', { length: 200 }).notNull(),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  icon: varchar('icon', { length: 100 }),
  imageUrl: text('image_url'),
  parentId: uuid('parent_id'),
  status: categoryStatusEnum('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  suggestedBy: uuid('suggested_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('categories_slug_idx').on(t.slug),
  index('categories_parent_id_idx').on(t.parentId),
  index('categories_status_idx').on(t.status),
]);

// ─── Listings ────────────────────────────────────────
export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id),
  subcategoryId: uuid('subcategory_id').references(() => categories.id),
  slug: varchar('slug', { length: 200 }),
  titleEn: varchar('title_en', { length: 300 }).notNull(),
  titleAr: varchar('title_ar', { length: 300 }).notNull(),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  status: listingStatusEnum('status').notNull().default('draft'),
  deliveryModes: jsonb('delivery_modes').$type<string[]>().notNull().default(['onsite']),
  serviceAreas: jsonb('service_areas').$type<string[]>().default(['Amman']),
  pricingModel: pricingModelEnum('pricing_model').notNull().default('hourly'),
  priceMin: decimal('price_min', { precision: 10, scale: 2 }),
  priceMax: decimal('price_max', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 5 }).notNull().default('JOD'),
  durationMin: integer('duration_min'),
  durationMax: integer('duration_max'),
  credentials: text('credentials'),
  credentialsAr: text('credentials_ar'),
  maxBookingsPerDay: integer('max_bookings_per_day').default(10),
  bookingPolicy: bookingPolicyEnum('booking_policy').notNull().default('manual'),
  bookingHorizonDays: integer('booking_horizon_days').default(30),
  slotDurationMinutes: integer('slot_duration_minutes').default(60),
  viewCount: integer('view_count').notNull().default(0),
  contactCount: integer('contact_count').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('listings_provider_id_idx').on(t.providerId),
  index('listings_category_id_idx').on(t.categoryId),
  index('listings_status_idx').on(t.status),
  index('listings_slug_idx').on(t.slug),
]);

// ─── Listing Media ───────────────────────────────────
export const listingMedia = pgTable('listing_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: varchar('alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('listing_media_listing_id_idx').on(t.listingId),
]);

// ─── Availability Rules ──────────────────────────────
export const availabilityRules = pgTable('availability_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  capacity: integer('capacity').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('availability_rules_provider_id_idx').on(t.providerId),
  index('availability_rules_listing_id_idx').on(t.listingId),
]);

// ─── Availability Exceptions ─────────────────────────
export const availabilityExceptions = pgTable('availability_exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(),
  isAvailable: boolean('is_available').notNull().default(false),
  startTime: varchar('start_time', { length: 5 }),
  endTime: varchar('end_time', { length: 5 }),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('availability_exceptions_provider_id_idx').on(t.providerId),
  index('availability_exceptions_date_idx').on(t.date),
]);

// ─── Conversations ───────────────────────────────────
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  participant1Id: uuid('participant1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: uuid('participant2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').references(() => listings.id),
  lastMessageAt: timestamp('last_message_at'),
  lastMessagePreview: text('last_message_preview'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('conversations_p1_idx').on(t.participant1Id),
  index('conversations_p2_idx').on(t.participant2Id),
  index('conversations_last_message_idx').on(t.lastMessageAt),
  uniqueIndex('conversations_participants_unique').on(t.participant1Id, t.participant2Id),
]);

// ─── Messages ────────────────────────────────────────
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content'),
  attachmentUrl: text('attachment_url'),
  attachmentType: varchar('attachment_type', { length: 50 }),
  isRead: boolean('is_read').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('messages_conversation_id_idx').on(t.conversationId),
  index('messages_sender_id_idx').on(t.senderId),
  index('messages_created_at_idx').on(t.createdAt),
]);

// ─── Quote Requests ──────────────────────────────────
export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').references(() => listings.id),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  title: varchar('title', { length: 300 }),
  description: text('description'),
  deliveryMode: deliveryModeEnum('delivery_mode'),
  preferredDate: varchar('preferred_date', { length: 10 }),
  preferredTime: varchar('preferred_time', { length: 20 }),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 5 }).notNull().default('JOD'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  providerResponse: text('provider_response'),
  providerPrice: decimal('provider_price', { precision: 10, scale: 2 }),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('quote_requests_customer_id_idx').on(t.customerId),
  index('quote_requests_provider_id_idx').on(t.providerId),
  index('quote_requests_status_idx').on(t.status),
]);

// ─── Bookings ────────────────────────────────────────
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').references(() => listings.id),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  state: bookingStateEnum('state').notNull().default('pending'),
  title: varchar('title', { length: 300 }),
  description: text('description'),
  deliveryMode: deliveryModeEnum('delivery_mode'),
  scheduledDate: varchar('scheduled_date', { length: 10 }),
  scheduledTime: varchar('scheduled_time', { length: 20 }),
  durationMinutes: integer('duration_minutes'),
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 5 }).notNull().default('JOD'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  cancelledAt: timestamp('cancelled_at'),
  completedAt: timestamp('completed_at'),
  confirmedAt: timestamp('confirmed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('bookings_customer_id_idx').on(t.customerId),
  index('bookings_provider_id_idx').on(t.providerId),
  index('bookings_state_idx').on(t.state),
  index('bookings_scheduled_date_idx').on(t.scheduledDate),
]);

// ─── Reviews ─────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 300 }),
  content: text('content'),
  provenance: reviewProvenanceEnum('provenance').notNull().default('experience_unverified'),
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: timestamp('edited_at'),
  isHidden: boolean('is_hidden').notNull().default(false),
  hiddenBy: uuid('hidden_by').references(() => users.id),
  hiddenAt: timestamp('hidden_at'),
  hiddenReason: text('hidden_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('reviews_provider_id_idx').on(t.providerId),
  index('reviews_reviewer_id_idx').on(t.reviewerId),
  index('reviews_booking_id_idx').on(t.bookingId),
  index('reviews_rating_idx').on(t.rating),
  uniqueIndex('reviews_booking_unique').on(t.bookingId),
]);

// ─── Saved Providers ─────────────────────────────────
export const savedProviders = pgTable('saved_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('saved_providers_unique').on(t.userId, t.providerId),
  index('saved_providers_user_id_idx').on(t.userId),
]);

// ─── Blocked Users ───────────────────────────────────
export const blockedUsers = pgTable('blocked_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockerId: uuid('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: uuid('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('blocked_users_unique').on(t.blockerId, t.blockedId),
  index('blocked_users_blocker_idx').on(t.blockerId),
]);

// ─── Reports ─────────────────────────────────────────
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: uuid('target_id').notNull(),
  reason: reportReasonEnum('reason').notNull(),
  description: text('description'),
  evidenceUrls: jsonb('evidence_urls').$type<string[]>().default([]),
  status: reportStatusEnum('status').notNull().default('open'),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('reports_reporter_id_idx').on(t.reporterId),
  index('reports_target_idx').on(t.targetType, t.targetId),
  index('reports_status_idx').on(t.status),
]);

// ─── Notifications ───────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  titleAr: varchar('title_ar', { length: 300 }),
  body: text('body'),
  bodyAr: text('body_ar'),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('notifications_user_id_idx').on(t.userId),
  index('notifications_is_read_idx').on(t.isRead),
  index('notifications_created_at_idx').on(t.createdAt),
]);

// ─── Media ───────────────────────────────────────────
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: mediaTypeEnum('type').notNull(),
  originalName: varchar('original_name', { length: 300 }),
  storedName: varchar('stored_name', { length: 300 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  sizeBytes: integer('size_bytes'),
  url: text('url').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  moderationState: varchar('moderation_state', { length: 30 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('media_user_id_idx').on(t.userId),
  index('media_type_idx').on(t.type),
]);

// ─── Audit Events ────────────────────────────────────
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }),
  targetId: uuid('target_id'),
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: varchar('ip_address', { length: 45 }),
  correlationId: varchar('correlation_id', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('audit_events_actor_id_idx').on(t.actorId),
  index('audit_events_action_idx').on(t.action),
  index('audit_events_target_idx').on(t.targetType, t.targetId),
  index('audit_events_created_at_idx').on(t.createdAt),
]);

// ─── Search Index (denormalized for performance) ─────
export const searchIndex = pgTable('search_index', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => providerProfiles.id, { onDelete: 'cascade' }),
  textEn: text('text_en'),
  textAr: text('text_ar'),
  categoryId: uuid('category_id'),
  subcategoryId: uuid('subcategory_id'),
  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }),
  ratingCount: integer('rating_count').default(0),
  priceMin: decimal('price_min', { precision: 10, scale: 2 }),
  priceMax: decimal('price_max', { precision: 10, scale: 2 }),
  deliveryModes: jsonb('delivery_modes').$type<string[]>().default([]),
  serviceAreas: jsonb('service_areas').$type<string[]>().default([]),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(false),
  locationLat: decimal('location_lat', { precision: 10, scale: 7 }),
  locationLng: decimal('location_lng', { precision: 10, scale: 7 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('search_index_listing_id_idx').on(t.listingId),
  index('search_index_category_idx').on(t.categoryId),
  index('search_index_active_verified_idx').on(t.isActive, t.isVerified),
]);
