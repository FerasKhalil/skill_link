import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log('Seeding database...');

  // Create tables via raw SQL (mirrors the Drizzle schema)
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // Create enum types
  await sql`DO $$ BEGIN
    CREATE TYPE account_state AS ENUM ('active', 'suspended', 'deactivated');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin', 'moderator');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('none', 'pending', 'approved', 'rejected', 'requires_info');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE booking_state AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE booking_policy AS ENUM ('auto', 'manual');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE delivery_mode AS ENUM ('onsite', 'remote', 'both');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE pricing_model AS ENUM ('hourly', 'fixed', 'starting_at');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'fraud', 'harassment', 'fake_profile', 'safety', 'other');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE review_provenance AS ENUM ('booking_verified', 'experience_unverified');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE category_status AS ENUM ('active', 'inactive', 'suggested', 'merged');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'archived', 'rejected');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('message', 'booking', 'review', 'quote', 'verification', 'system', 'report');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('profile_image', 'listing_image', 'chat_attachment', 'identity_document', 'affiliation_evidence', 'report_evidence');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      password_hash TEXT NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      display_name VARCHAR(200),
      avatar_url TEXT,
      locale VARCHAR(5) NOT NULL DEFAULT 'en',
      role user_role NOT NULL DEFAULT 'customer',
      account_state account_state NOT NULL DEFAULT 'active',
      email_verified BOOLEAN NOT NULL DEFAULT false,
      email_verify_token VARCHAR(255),
      password_reset_token VARCHAR(255),
      password_reset_expiry TIMESTAMPTZ,
      phone_verified BOOLEAN NOT NULL DEFAULT false,
      phone_verify_code VARCHAR(10),
      phone_verify_expiry TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      user_agent TEXT,
      ip_address VARCHAR(45),
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS provider_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      profession VARCHAR(200),
      title VARCHAR(200),
      bio TEXT,
      bio_ar TEXT,
      experience TEXT,
      years_experience INTEGER,
      gender VARCHAR(20),
      verification_status verification_status NOT NULL DEFAULT 'none',
      verified_at TIMESTAMPTZ,
      verified_by UUID REFERENCES users(id),
      verification_notes TEXT,
      identity_verified BOOLEAN NOT NULL DEFAULT false,
      identity_doc_url TEXT,
      affiliation_verified BOOLEAN NOT NULL DEFAULT false,
      affiliation_doc_url TEXT,
      affiliation_org VARCHAR(200),
      rating_avg DECIMAL(3,2) DEFAULT '0',
      rating_count INTEGER NOT NULL DEFAULT 0,
      booking_count INTEGER NOT NULL DEFAULT 0,
      response_time VARCHAR(50),
      location_lat DECIMAL(10,7),
      location_lng DECIMAL(10,7),
      location_city VARCHAR(100),
      location_governorate VARCHAR(100),
      location_approximate TEXT,
      terms_accepted BOOLEAN NOT NULL DEFAULT false,
      terms_accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS provider_applications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_profile_id UUID REFERENCES provider_profiles(id),
      status verification_status NOT NULL DEFAULT 'pending',
      profession VARCHAR(200),
      title VARCHAR(200),
      bio TEXT,
      bio_ar TEXT,
      experience TEXT,
      years_experience INTEGER,
      gender VARCHAR(20),
      identity_doc_url TEXT,
      affiliation_doc_url TEXT,
      affiliation_org VARCHAR(200),
      terms_accepted BOOLEAN NOT NULL DEFAULT false,
      admin_notes TEXT,
      reviewed_by UUID REFERENCES users(id),
      reviewed_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug VARCHAR(100) NOT NULL UNIQUE,
      name_en VARCHAR(200) NOT NULL,
      name_ar VARCHAR(200) NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      icon VARCHAR(100),
      image_url TEXT,
      parent_id UUID REFERENCES categories(id),
      status category_status NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      suggested_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id),
      subcategory_id UUID REFERENCES categories(id),
      slug VARCHAR(200),
      title_en VARCHAR(300) NOT NULL,
      title_ar VARCHAR(300) NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      status listing_status NOT NULL DEFAULT 'draft',
      delivery_modes JSONB NOT NULL DEFAULT '["onsite"]'::jsonb,
      service_areas JSONB DEFAULT '["Amman"]'::jsonb,
      pricing_model pricing_model NOT NULL DEFAULT 'hourly',
      price_min DECIMAL(10,2),
      price_max DECIMAL(10,2),
      currency VARCHAR(5) NOT NULL DEFAULT 'JOD',
      duration_min INTEGER,
      duration_max INTEGER,
      credentials TEXT,
      credentials_ar TEXT,
      max_bookings_per_day INTEGER DEFAULT 10,
      booking_policy booking_policy NOT NULL DEFAULT 'manual',
      booking_horizon_days INTEGER DEFAULT 30,
      slot_duration_minutes INTEGER DEFAULT 60,
      view_count INTEGER NOT NULL DEFAULT 0,
      contact_count INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS listing_media (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt VARCHAR(300),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS availability_rules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      start_time VARCHAR(5) NOT NULL,
      end_time VARCHAR(5) NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS availability_exceptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      date VARCHAR(10) NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT false,
      start_time VARCHAR(5),
      end_time VARCHAR(5),
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id UUID REFERENCES listings(id),
      last_message_at TIMESTAMPTZ,
      last_message_preview TEXT,
      is_archived BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      attachment_url TEXT,
      attachment_type VARCHAR(50),
      is_read BOOLEAN NOT NULL DEFAULT false,
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quote_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      listing_id UUID REFERENCES listings(id),
      conversation_id UUID REFERENCES conversations(id),
      title VARCHAR(300),
      description TEXT,
      delivery_mode delivery_mode,
      preferred_date VARCHAR(10),
      preferred_time VARCHAR(20),
      budget DECIMAL(10,2),
      currency VARCHAR(5) NOT NULL DEFAULT 'JOD',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      provider_response TEXT,
      provider_price DECIMAL(10,2),
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      listing_id UUID REFERENCES listings(id),
      conversation_id UUID REFERENCES conversations(id),
      state booking_state NOT NULL DEFAULT 'pending',
      title VARCHAR(300),
      description TEXT,
      delivery_mode delivery_mode,
      scheduled_date VARCHAR(10),
      scheduled_time VARCHAR(20),
      duration_minutes INTEGER,
      price DECIMAL(10,2),
      currency VARCHAR(5) NOT NULL DEFAULT 'JOD',
      cancellation_reason TEXT,
      cancelled_by UUID REFERENCES users(id),
      cancelled_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      confirmed_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      booking_id UUID UNIQUE REFERENCES bookings(id),
      rating INTEGER NOT NULL,
      title VARCHAR(300),
      content TEXT,
      provenance review_provenance NOT NULL DEFAULT 'experience_unverified',
      is_edited BOOLEAN NOT NULL DEFAULT false,
      edited_at TIMESTAMPTZ,
      is_hidden BOOLEAN NOT NULL DEFAULT false,
      hidden_by UUID REFERENCES users(id),
      hidden_at TIMESTAMPTZ,
      hidden_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_providers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, provider_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS blocked_users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(blocker_id, blocked_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID NOT NULL,
      reason report_reason NOT NULL,
      description TEXT,
      evidence_urls JSONB DEFAULT '[]'::jsonb,
      status report_status NOT NULL DEFAULT 'open',
      priority VARCHAR(20) NOT NULL DEFAULT 'medium',
      assigned_to UUID REFERENCES users(id),
      resolution TEXT,
      resolved_at TIMESTAMPTZ,
      resolved_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type notification_type NOT NULL,
      title VARCHAR(300) NOT NULL,
      title_ar VARCHAR(300),
      body TEXT,
      body_ar TEXT,
      link TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS media (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      type media_type NOT NULL,
      original_name VARCHAR(300),
      stored_name VARCHAR(300) NOT NULL,
      mime_type VARCHAR(100),
      size_bytes INTEGER,
      url TEXT NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT false,
      moderation_state VARCHAR(30) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      actor_id UUID REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id UUID,
      details JSONB,
      ip_address VARCHAR(45),
      correlation_id VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS search_index (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
      text_en TEXT,
      text_ar TEXT,
      category_id UUID,
      subcategory_id UUID,
      rating_avg DECIMAL(3,2),
      rating_count INTEGER DEFAULT 0,
      price_min DECIMAL(10,2),
      price_max DECIMAL(10,2),
      delivery_modes JSONB DEFAULT '[]'::jsonb,
      service_areas JSONB DEFAULT '[]'::jsonb,
      is_verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT false,
      location_lat DECIMAL(10,7),
      location_lng DECIMAL(10,7),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON provider_profiles(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_provider_profiles_verification ON provider_profiles(verification_status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listings_provider ON listings(provider_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_bookings_state ON bookings(state)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_search_index_active ON search_index(is_active, is_verified)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category_id)`;

  console.log('Schema created successfully');

  // Seed categories
  const categoryData = [
    { slug: 'tutoring', name_en: 'Tutoring & Education', name_ar: 'الدروس الخصوصية والتعليم', icon: 'BookOpen', parent_id: null, sort_order: 1 },
    { slug: 'math-tutoring', name_en: 'Mathematics', name_ar: 'الرياضيات', icon: 'Calculator', parent_slug: 'tutoring', sort_order: 1 },
    { slug: 'english-tutoring', name_en: 'English Language', name_ar: 'اللغة الإنجليزية', icon: 'Languages', parent_slug: 'tutoring', sort_order: 2 },
    { slug: 'arabic-tutoring', name_en: 'Arabic Language', name_ar: 'اللغة العربية', icon: 'BookText', parent_slug: 'tutoring', sort_order: 3 },
    { slug: 'science-tutoring', name_en: 'Science', name_ar: 'العلوم', icon: 'FlaskConical', parent_slug: 'tutoring', sort_order: 4 },
    { slug: 'skilled-labour', name_en: 'Skilled Hand Labour', name_ar: 'العمالة الماهرة', icon: 'Wrench', parent_id: null, sort_order: 2 },
    { slug: 'electrical', name_en: 'Electrical Services', name_ar: 'الخدمات الكهربائية', icon: 'Zap', parent_slug: 'skilled-labour', sort_order: 1 },
    { slug: 'plumbing', name_en: 'Plumbing', name_ar: 'السباكة', icon: 'Droplets', parent_slug: 'skilled-labour', sort_order: 2 },
    { slug: 'carpentry', name_en: 'Carpentry', name_ar: 'النجارة', icon: 'Hammer', parent_slug: 'skilled-labour', sort_order: 3 },
    { slug: 'painting', name_en: 'Painting', name_ar: 'الدهان', icon: 'Paintbrush', parent_slug: 'skilled-labour', sort_order: 4 },
    { slug: 'instruments', name_en: 'Instruments & Music', name_ar: 'الآلات الموسيقية والموسيقى', icon: 'Music', parent_id: null, sort_order: 3 },
    { slug: 'oud-lessons', name_en: 'Oud Lessons', name_ar: 'دروس العود', icon: 'Music2', parent_slug: 'instruments', sort_order: 1 },
    { slug: 'piano-lessons', name_en: 'Piano Lessons', name_ar: 'دروس البيانو', icon: 'Piano', parent_slug: 'instruments', sort_order: 2 },
    { slug: 'instrument-repair', name_en: 'Instrument Repair', name_ar: 'إصلاح الآلات الموسيقية', icon: 'Settings', parent_slug: 'instruments', sort_order: 3 },
  ];

  const insertedCategories: Record<string, string> = {};

  for (const cat of categoryData) {
    const parentId = cat.parent_slug ? insertedCategories[cat.parent_slug] : null;
    const [inserted] = await sql`
      INSERT INTO categories (slug, name_en, name_ar, icon, parent_id, sort_order, status)
      VALUES (${cat.slug}, ${cat.name_en}, ${cat.name_ar}, ${cat.icon}, ${parentId}, ${cat.sort_order}, 'active')
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `;
    if (inserted) {
      insertedCategories[cat.slug] = inserted.id;
    }
  }

  console.log('Categories seeded');

  // Seed admin user
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_BOOTSTRAP_PASSWORD || 'SkillLinkAdmin2024!', 12);
  const [adminUser] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, display_name, locale, role, account_state, email_verified)
    VALUES (${process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@skilllink.jo'}, ${adminPasswordHash}, 'Admin', 'User', 'Admin', 'en', 'admin', 'active', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;

  if (adminUser) {
    await sql`INSERT INTO audit_events (actor_id, action, target_type, target_id, details) VALUES (${adminUser.id}, 'admin.seeded', 'user', ${adminUser.id}, '{"source": "seed"}'::jsonb)`;
    console.log(`Admin user created: ${process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@skilllink.jo'}`);
  } else {
    console.log('Admin user already exists');
  }

  // Seed demo provider user
  const demoPasswordHash = await bcrypt.hash('DemoProvider2024!', 12);
  const [demoProvider] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, display_name, locale, role, account_state, email_verified)
    VALUES ('provider@skilllink.jo', ${demoPasswordHash}, 'Sara', 'Ahmad', 'Sara Ahmad', 'ar', 'provider', 'active', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;

  if (demoProvider) {
    const [providerProfile] = await sql`
      INSERT INTO provider_profiles (user_id, profession, title, bio, bio_ar, years_experience, verification_status, identity_verified, rating_avg, rating_count, booking_count, location_city, location_governorate, terms_accepted, terms_accepted_at)
      VALUES (${demoProvider.id}, 'Mathematics Tutor', 'Professional Math Tutor', 'Experienced math tutor specializing in secondary school and university mathematics. I help students understand complex concepts through clear explanations and practical examples.', 'مدرس رياضيات متخصص في تعليم المرحلة الثانوية والتعليم الجامعي. أساعد الطلاب في فهم المفاهيم المعقدة من خلال شرح واضح وأمثلة عملية.', 8, 'approved', true, '4.85', 47, 120, 'Amman', 'Amman', true, NOW())
      RETURNING id
    `;

    if (providerProfile) {
      const mathCatId = insertedCategories['math-tutoring'];
      if (mathCatId) {
        const [listing] = await sql`
          INSERT INTO listings (provider_id, category_id, slug, title_en, title_ar, description_en, description_ar, status, delivery_modes, pricing_model, price_min, price_max, published_at)
          VALUES (${providerProfile.id}, ${mathCatId}, 'sara-ahmad-math', 'Professional Mathematics Tutoring', 'دروس رياضيات احترافية', 'Expert mathematics tutoring for secondary and university students. I cover algebra, calculus, statistics, and more. Available for online and in-person sessions.', 'دروس رياضيات متخصصة لطلاب المرحلة الثانوية والجامعة. أغطي الجبر والتفاضل والإحصاء والمزيد. متاحة للجلسات عبر الإنترنت والحضورية.', 'active', '["onsite","remote"]'::jsonb, 'hourly', 15, 25, NOW())
          RETURNING id
        `;
        if (listing) {
          await sql`
            INSERT INTO search_index (listing_id, provider_id, text_en, text_ar, category_id, rating_avg, rating_count, price_min, price_max, delivery_modes, service_areas, is_verified, is_active, location_lat, location_lng)
            VALUES (${listing.id}, ${providerProfile.id}, 'Professional Mathematics Tutoring Expert mathematics tutoring secondary university algebra calculus statistics', 'دروس رياضيات احترافية مدرس رياضيات متخصص تعليم المرحلة الثانوية الجامعة الجبر التفاضل الإحصاء', ${mathCatId}, '4.85', 47, '15', '25', '["onsite","remote"]'::jsonb, '["Amman"]'::jsonb, true, true, '31.9539', '35.9106')
          `;
        }
      }
      await sql`INSERT INTO audit_events (actor_id, action, target_type, target_id, details) VALUES (${adminUser?.id}, 'seed.provider_created', 'user', ${demoProvider.id}, '{"source": "seed"}'::jsonb)`;
      console.log('Demo provider created: provider@skilllink.jo');
    }
  }

  // Seed demo customer
  const customerPasswordHash = await bcrypt.hash('DemoCustomer2024!', 12);
  const [demoCustomer] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, display_name, locale, role, account_state, email_verified)
    VALUES ('customer@skilllink.jo', ${customerPasswordHash}, 'Ahmad', 'Al-Khatib', 'Ahmad Al-Khatib', 'en', 'customer', 'active', true)
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;

  if (demoCustomer) {
    console.log('Demo customer created: customer@skilllink.jo');
  }

  await sql.end();
  console.log('Seed completed successfully!');
  console.log('');
  console.log('=== Development Accounts ===');
  console.log('Admin:    admin@skilllink.jo    / SkillLinkAdmin2024!');
  console.log('Provider: provider@skilllink.jo / DemoProvider2024!');
  console.log('Customer: customer@skilllink.jo / DemoCustomer2024!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
