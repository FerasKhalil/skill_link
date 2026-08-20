import type { User, ProviderProfile, Category, Listing, Conversation, Message, Booking, Review, Report, Notification, QuoteRequest } from '@/types';

export const mockCategories: Category[] = [
  {
    id: 'cat-1', slug: 'tutoring', name: { ar: 'الدروس الخصوصية', en: 'Tutoring' },
    description: { ar: 'دروس خصوصية في مختلف المواد والمستويات', en: 'Private tutoring in various subjects and levels' },
    status: 'active', displayOrder: 1, icon: 'book-open', listingCount: 145,
    children: [
      { id: 'cat-1-1', slug: 'math-tutoring', name: { ar: 'الرياضيات', en: 'Mathematics' }, description: { ar: 'دروس رياضيات', en: 'Math lessons' }, status: 'active', displayOrder: 1, parentId: 'cat-1', listingCount: 42 },
      { id: 'cat-1-2', slug: 'english-tutoring', name: { ar: 'اللغة الإنجليزية', en: 'English Language' }, description: { ar: 'دروس إنجليزي', en: 'English lessons' }, status: 'active', displayOrder: 2, parentId: 'cat-1', listingCount: 38 },
      { id: 'cat-1-3', slug: 'arabic-tutoring', name: { ar: 'اللغة العربية', en: 'Arabic Language' }, description: { ar: 'دروس عربي', en: 'Arabic lessons' }, status: 'active', displayOrder: 3, parentId: 'cat-1', listingCount: 25 },
      { id: 'cat-1-4', slug: 'science-tutoring', name: { ar: 'العلوم', en: 'Science' }, description: { ar: 'دروس علوم', en: 'Science lessons' }, status: 'active', displayOrder: 4, parentId: 'cat-1', listingCount: 20 },
      { id: 'cat-1-5', slug: 'test-prep', name: { ar: 'التحضير للاختبارات', en: 'Test Preparation' }, description: { ar: 'تحضير للothmatric و以及其他', en: 'SAT, IGCSE and other test prep' }, status: 'active', displayOrder: 5, parentId: 'cat-1', listingCount: 20 },
    ]
  },
  {
    id: 'cat-2', slug: 'skilled-hand-labour', name: { ar: 'العمالة الماهرة', en: 'Skilled Hand Labour' },
    description: { ar: 'خدمات الصيانة والإصلاح المنزلية', en: 'Home maintenance and repair services' },
    status: 'active', displayOrder: 2, icon: 'wrench', listingCount: 89,
    children: [
      { id: 'cat-2-1', slug: 'electrical', name: { ar: 'الكهرباء', en: 'Electrical' }, description: { ar: 'خدمات كهربائية', en: 'Electrical services' }, status: 'active', displayOrder: 1, parentId: 'cat-2', listingCount: 28 },
      { id: 'cat-2-2', slug: 'plumbing', name: { ar: 'السباكة', en: 'Plumbing' }, description: { ar: 'خدمات سباكة', en: 'Plumbing services' }, status: 'active', displayOrder: 2, parentId: 'cat-2', listingCount: 22 },
      { id: 'cat-2-3', slug: 'woodwork', name: { ar: 'النجارة', en: 'Woodwork' }, description: { ar: 'خدمات نجارة', en: 'Woodwork services' }, status: 'active', displayOrder: 3, parentId: 'cat-2', listingCount: 18 },
      { id: 'cat-2-4', slug: 'stonework', name: { ar: 'الحدادة والحديد', en: 'Stonework' }, description: { ar: 'خدمات حديد وstone', en: 'Stonework services' }, status: 'active', displayOrder: 4, parentId: 'cat-2', listingCount: 21 },
    ]
  },
  {
    id: 'cat-3', slug: 'instruments', name: { ar: 'الآلات الموسيقية', en: 'Instruments / Instrument-related Services' },
    description: { ar: 'دروس وصيانة وتأجير الآلات الموسيقية', en: 'Instrument lessons, repair, and rental' },
    status: 'active', displayOrder: 3, icon: 'music', listingCount: 67,
    children: [
      { id: 'cat-3-1', slug: 'piano-lessons', name: { ar: 'دروس بيانو', en: 'Piano Lessons' }, description: { ar: 'دروس بيانو', en: 'Piano lessons' }, status: 'active', displayOrder: 1, parentId: 'cat-3', listingCount: 15 },
      { id: 'cat-3-2', slug: 'guitar-lessons', name: { ar: 'دروس جيتار', en: 'Guitar Lessons' }, description: { ar: 'دروس جيتار', en: 'Guitar lessons' }, status: 'active', displayOrder: 2, parentId: 'cat-3', listingCount: 12 },
      { id: 'cat-3-3', slug: 'oud-lessons', name: { ar: 'دروس عود', en: 'Oud Lessons' }, description: { ar: 'دروس عود', en: 'Oud lessons' }, status: 'active', displayOrder: 3, parentId: 'cat-3', listingCount: 18 },
      { id: 'cat-3-4', slug: 'instrument-repair', name: { ar: 'صيانة الآلات', en: 'Instrument Repair' }, description: { ar: 'صيانة وإصلاح الآلات الموسيقية', en: 'Instrument repair and maintenance' }, status: 'active', displayOrder: 4, parentId: 'cat-3', listingCount: 10 },
      { id: 'cat-3-5', slug: 'instrument-rental', name: { ar: 'تأجير الآلات', en: 'Instrument Rental' }, description: { ar: 'تأجير آلات موسيقية', en: 'Instrument rental services' }, status: 'active', displayOrder: 5, parentId: 'cat-3', listingCount: 12 },
    ]
  }
];

export const mockUsers: User[] = [
  {
    id: 'user-1', email: 'ahmad@example.com', emailVerifiedAt: '2026-01-15T10:00:00Z',
    phone: '+962791234567', phoneVerifiedAt: '2026-01-15T10:05:00Z',
    displayName: 'Ahmad Al-Khatib', preferredLocale: 'en', accountState: 'active',
    roles: ['customer'], avatar: '/avatars/ahmad.jpg', createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-2', email: 'sara@example.com', emailVerifiedAt: '2026-02-01T10:00:00Z',
    phone: '+962798765432', phoneVerifiedAt: '2026-02-01T10:05:00Z',
    displayName: 'سارة أحمد', preferredLocale: 'ar', accountState: 'active',
    roles: ['customer', 'provider'], avatar: '/avatars/sara.jpg', createdAt: '2026-01-20T08:00:00Z'
  },
  {
    id: 'user-3', email: 'omar@example.com', emailVerifiedAt: '2026-01-20T10:00:00Z',
    phone: '+962791112233', phoneVerifiedAt: '2026-01-20T10:05:00Z',
    displayName: 'عمر الخطيب', preferredLocale: 'ar', accountState: 'active',
    roles: ['customer', 'provider'], avatar: '/avatars/omar.jpg', createdAt: '2026-01-18T08:00:00Z'
  },
  {
    id: 'user-4', email: 'layla@example.com', emailVerifiedAt: '2026-02-10T10:00:00Z',
    phone: '+962794445566', phoneVerifiedAt: '2026-02-10T10:05:00Z',
    displayName: 'ليلى حسن', preferredLocale: 'ar', accountState: 'active',
    roles: ['customer', 'provider'], avatar: '/avatars/layla.jpg', createdAt: '2026-02-05T08:00:00Z'
  },
  {
    id: 'user-5', email: 'khaled@example.com', emailVerifiedAt: '2026-03-01T10:00:00Z',
    phone: '+962797778899', phoneVerifiedAt: '2026-03-01T10:05:00Z',
    displayName: 'Khaled Mansour', preferredLocale: 'en', accountState: 'active',
    roles: ['customer', 'provider'], avatar: '/avatars/khaled.jpg', createdAt: '2026-02-25T08:00:00Z'
  },
  {
    id: 'user-admin', email: 'admin@skillink.jo', emailVerifiedAt: '2026-01-01T10:00:00Z',
    displayName: 'Admin User', preferredLocale: 'en', accountState: 'active',
    roles: ['admin', 'verification_admin', 'moderator'], createdAt: '2026-01-01T08:00:00Z'
  }
];

export const mockProviderProfiles: ProviderProfile[] = [
  {
    id: 'prov-1', userId: 'user-2', slug: 'sara-ahmad-math',
    title: 'Mathematics Tutor | University of Jordan',
    bio: 'Experienced mathematics tutor with over 5 years of teaching experience. Specializing in high school and university-level mathematics. Patient and methodical approach to helping students understand complex concepts.',
    experience: '5+ years tutoring mathematics at high school and university levels. Former teaching assistant at University of Jordan.',
    city: 'Amman', neighborhood: 'Abdoun',
    verificationSummary: { identity: 'approved', email: true, phone: true, affiliation: 'approved' },
    publicationStatus: 'published', rating: 4.8, reviewCount: 42, serviceCount: 3,
    responseRate: 95, responseTime: 'within 1 hour',
    user: { ...mockUsers[1], roles: ['customer', 'provider'] },
    listings: []
  },
  {
    id: 'prov-2', userId: 'user-3', slug: 'omar-electrical',
    title: 'Licensed Electrician | 10+ Years Experience',
    bio: 'Professional electrician providing reliable electrical services in Amman. From simple repairs to complete installations, I ensure quality work and safety standards.',
    experience: '10+ years in electrical work. Licensed by the Ministry of Labour. Specializing in residential and commercial electrical systems.',
    city: 'Amman', neighborhood: 'Jabal Amman',
    verificationSummary: { identity: 'approved', email: true, phone: true },
    publicationStatus: 'published', rating: 4.6, reviewCount: 35, serviceCount: 2,
    responseRate: 88, responseTime: 'within 2 hours',
    user: { ...mockUsers[2], roles: ['customer', 'provider'] },
    listings: []
  },
  {
    id: 'prov-3', userId: 'user-4', slug: 'layla-oud-lessons',
    title: 'Professional Oud Player & Instructor',
    bio: 'Award-winning oud player offering professional lessons for all levels. Learn traditional Arabic music or modern compositions in a supportive environment.',
    experience: '15 years performing and teaching oud. Graduate of the National Conservatory of Music. Performed at multiple international festivals.',
    city: 'Amman', neighborhood: 'Weibdeh',
    verificationSummary: { identity: 'approved', email: true, phone: true, affiliation: 'approved' },
    publicationStatus: 'published', rating: 4.9, reviewCount: 58, serviceCount: 4,
    responseRate: 98, responseTime: 'within 30 minutes',
    user: { ...mockUsers[3], roles: ['customer', 'provider'] },
    listings: []
  },
  {
    id: 'prov-4', userId: 'user-5', slug: 'khaled-plumbing',
    title: 'Expert Plumber | Emergency Services Available',
    bio: 'Reliable plumbing services for homes and businesses in Amman. Available for emergency calls. Quality guaranteed with affordable pricing.',
    experience: '8 years professional plumbing. Specializing in pipe repair, installation, drainage systems, and bathroom renovations.',
    city: 'Amman', neighborhood: "Tla'a Al-Ali",
    verificationSummary: { identity: 'approved', email: true, phone: true },
    publicationStatus: 'published', rating: 4.5, reviewCount: 28, serviceCount: 2,
    responseRate: 82, responseTime: 'within 3 hours',
    user: { ...mockUsers[4], roles: ['customer', 'provider'] },
    listings: []
  }
];

export const mockListings: Listing[] = [
  {
    id: 'list-1', providerId: 'prov-1', categoryId: 'cat-1-1',
    title: 'Mathematics Tutoring - All Levels',
    description: 'Comprehensive math tutoring covering algebra, calculus, statistics, and geometry. Available online and in-person in Amman.',
    status: 'active', moderationState: 'approved', reviewCount: 42,
    deliveryModes: [
      { mode: 'online', enabled: true, pricing: [{ model: 'hourly', amount: 25, currency: 'JOD', unit: 'hour', isPublic: true, description: 'Online session' }], serviceAreas: [{ city: 'Amman' }], bookingPolicy: 'AUTO_ACCEPT' },
      { mode: 'customer_location', enabled: true, pricing: [{ model: 'hourly', amount: 35, currency: 'JOD', unit: 'hour', isPublic: true, description: 'In-person at your location' }], serviceAreas: [{ city: 'Amman', neighborhood: 'Abdoun', radiusKm: 10 }], bookingPolicy: 'REQUIRES_PROVIDER_APPROVAL' }
    ],
    images: ['/listings/math-1.jpg'], createdAt: '2026-02-01T10:00:00Z',
    provider: mockProviderProfiles[0]
  },
  {
    id: 'list-2', providerId: 'prov-2', categoryId: 'cat-2-1',
    title: 'Electrical Services - Residential & Commercial',
    description: 'Complete electrical services including wiring, repairs, panel upgrades, lighting installation, and safety inspections.',
    status: 'active', moderationState: 'approved', reviewCount: 35,
    deliveryModes: [
      { mode: 'customer_location', enabled: true, pricing: [{ model: 'starting_from', amount: 15, currency: 'JOD', unit: 'visit', isPublic: true, description: 'Starting from 15 JOD per visit' }], serviceAreas: [{ city: 'Amman', radiusKm: 15 }], bookingPolicy: 'REQUIRES_PROVIDER_APPROVAL' }
    ],
    images: ['/listings/electric-1.jpg'], createdAt: '2026-02-10T10:00:00Z',
    provider: mockProviderProfiles[1]
  },
  {
    id: 'list-3', providerId: 'prov-3', categoryId: 'cat-3-3',
    title: 'Professional Oud Lessons',
    description: 'Learn oud from basics to advanced techniques. Traditional Arabic music and modern styles. All ages welcome.',
    status: 'active', moderationState: 'approved', reviewCount: 58,
    deliveryModes: [
      { mode: 'online', enabled: true, pricing: [{ model: 'hourly', amount: 30, currency: 'JOD', unit: 'hour', isPublic: true, description: 'Online lesson' }], serviceAreas: [{ city: 'Amman' }], bookingPolicy: 'AUTO_ACCEPT' },
      { mode: 'provider_location', enabled: true, pricing: [{ model: 'hourly', amount: 40, currency: 'JOD', unit: 'hour', isPublic: true, description: 'In-person at studio' }], serviceAreas: [{ city: 'Amman', neighborhood: 'Weibdeh' }], bookingPolicy: 'AUTO_ACCEPT' },
      { mode: 'customer_location', enabled: true, pricing: [{ model: 'hourly', amount: 50, currency: 'JOD', unit: 'hour', isPublic: true, description: 'In-person at your location' }], serviceAreas: [{ city: 'Amman', radiusKm: 8 }], bookingPolicy: 'REQUIRES_PROVIDER_APPROVAL' }
    ],
    images: ['/listings/oud-1.jpg'], createdAt: '2026-01-25T10:00:00Z',
    provider: mockProviderProfiles[2]
  },
  {
    id: 'list-4', providerId: 'prov-4', categoryId: 'cat-2-2',
    title: 'Plumbing Services & Emergency Repairs',
    description: 'Professional plumbing services for all your needs. Emergency services available 24/7. Licensed and insured.',
    status: 'active', moderationState: 'approved', reviewCount: 28,
    deliveryModes: [
      { mode: 'customer_location', enabled: true, pricing: [{ model: 'starting_from', amount: 20, currency: 'JOD', unit: 'visit', isPublic: true, description: 'Diagnostic visit from 20 JOD' }], serviceAreas: [{ city: 'Amman', radiusKm: 20 }], bookingPolicy: 'REQUIRES_PROVIDER_APPROVAL' }
    ],
    images: ['/listings/plumbing-1.jpg'], createdAt: '2026-03-05T10:00:00Z',
    provider: mockProviderProfiles[3]
  },
  {
    id: 'list-5', providerId: 'prov-1', categoryId: 'cat-1-2',
    title: 'English Language Tutoring',
    description: 'Improve your English skills with a professional tutor. IELTS preparation, conversation practice, grammar and writing.',
    status: 'active', moderationState: 'approved', reviewCount: 18,
    deliveryModes: [
      { mode: 'online', enabled: true, pricing: [{ model: 'hourly', amount: 20, currency: 'JOD', unit: 'hour', isPublic: true }], serviceAreas: [{ city: 'Amman' }], bookingPolicy: 'AUTO_ACCEPT' }
    ],
    images: ['/listings/english-1.jpg'], createdAt: '2026-03-10T10:00:00Z',
    provider: mockProviderProfiles[0]
  },
  {
    id: 'list-6', providerId: 'prov-3', categoryId: 'cat-3-4',
    title: 'Oud & Guitar Repair Service',
    description: 'Expert instrument repair for oud, guitar, and other string instruments. Restringing, setup, structural repairs.',
    status: 'active', moderationState: 'approved', reviewCount: 15,
    deliveryModes: [
      { mode: 'provider_location', enabled: true, pricing: [{ model: 'quote_only', isPublic: true, description: 'Quote provided after inspection' }], serviceAreas: [{ city: 'Amman' }], bookingPolicy: 'AUTO_ACCEPT' }
    ],
    images: ['/listings/repair-1.jpg'], createdAt: '2026-03-15T10:00:00Z',
    provider: mockProviderProfiles[2]
  }
];

mockProviderProfiles[0].listings = [mockListings[0], mockListings[4]];
mockProviderProfiles[1].listings = [mockListings[1]];
mockProviderProfiles[2].listings = [mockListings[2], mockListings[5]];
mockProviderProfiles[3].listings = [mockListings[3]];

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1', contextType: 'listing', contextId: 'list-1',
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: { id: 'msg-3', conversationId: 'conv-1', senderId: 'user-1', content: 'Great, see you on Thursday at 4pm!', type: 'text', sentAt: '2026-08-18T14:30:00Z' },
    unreadCount: 0, createdAt: '2026-08-15T10:00:00Z', listing: mockListings[0]
  },
  {
    id: 'conv-2', contextType: 'listing', contextId: 'list-3',
    participants: [mockUsers[0], mockUsers[3]],
    lastMessage: { id: 'msg-6', conversationId: 'conv-2', senderId: 'user-4', content: 'مرحباً! أهلاً بك. أنا متاحة للدروس يوم الأحد والثلاثاء.', type: 'text', sentAt: '2026-08-19T09:00:00Z' },
    unreadCount: 1, createdAt: '2026-08-18T16:00:00Z', listing: mockListings[2]
  }
];

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'msg-1', conversationId: 'conv-1', senderId: 'user-1', content: "Hi! I'm interested in math tutoring for my son who's in 10th grade.", type: 'text', sentAt: '2026-08-15T10:00:00Z', sender: mockUsers[0] },
    { id: 'msg-2', conversationId: 'conv-1', senderId: 'user-2', content: "Hello Ahmad! I'd be happy to help. What topics does he need help with?", type: 'text', sentAt: '2026-08-15T10:15:00Z', sender: mockUsers[1] },
    { id: 'msg-3', conversationId: 'conv-1', senderId: 'user-1', content: 'Mainly algebra and geometry. He has exams coming up next month.', type: 'text', sentAt: '2026-08-15T10:30:00Z', sender: mockUsers[0] },
    { id: 'msg-4', conversationId: 'conv-1', senderId: 'user-2', content: 'Perfect, those are my specialties. Would you prefer online or in-person sessions?', type: 'text', sentAt: '2026-08-15T11:00:00Z', sender: mockUsers[1] },
    { id: 'msg-5', conversationId: 'conv-1', senderId: 'user-1', content: 'In-person would be great. I live in Abdoun.', type: 'text', sentAt: '2026-08-15T11:15:00Z', sender: mockUsers[0] },
    { id: 'msg-6', conversationId: 'conv-1', senderId: 'user-2', content: "I'm also in Abdoun area! How about we start with a session this Thursday at 4pm?", type: 'text', sentAt: '2026-08-15T11:30:00Z', sender: mockUsers[1] },
    { id: 'msg-7', conversationId: 'conv-1', senderId: 'user-1', content: 'Great, see you on Thursday at 4pm!', type: 'text', sentAt: '2026-08-18T14:30:00Z', sender: mockUsers[0] },
  ],
  'conv-2': [
    { id: 'msg-8', conversationId: 'conv-2', senderId: 'user-1', content: 'مرحباً! أنا مهتم بتعلم العود. هل تقبلين مبتدئين؟', type: 'text', sentAt: '2026-08-18T16:00:00Z', sender: mockUsers[0] },
    { id: 'msg-9', conversationId: 'conv-2', senderId: 'user-4', content: 'مرحباً! أهلاً بك. أنا متاحة للدروس يوم الأحد والثلاثاء.', type: 'text', sentAt: '2026-08-19T09:00:00Z', sender: mockUsers[3] },
  ]
};

export const mockBookings: Booking[] = [
  {
    id: 'bk-1', customerId: 'user-1', providerId: 'prov-1', listingId: 'list-1',
    deliveryMode: 'customer_location', startTime: '2026-08-22T16:00:00Z', endTime: '2026-08-22T17:00:00Z',
    state: 'confirmed', policy: 'REQUIRES_PROVIDER_APPROVAL', createdAt: '2026-08-18T15:00:00Z',
    listing: mockListings[0], customer: mockUsers[0], provider: mockProviderProfiles[0]
  },
  {
    id: 'bk-2', customerId: 'user-1', providerId: 'prov-3', listingId: 'list-3',
    deliveryMode: 'online', startTime: '2026-08-25T18:00:00Z', endTime: '2026-08-25T19:00:00Z',
    state: 'pending_provider', policy: 'AUTO_ACCEPT', createdAt: '2026-08-19T10:00:00Z',
    listing: mockListings[2], customer: mockUsers[0], provider: mockProviderProfiles[2]
  },
  {
    id: 'bk-3', customerId: 'user-1', providerId: 'prov-2', listingId: 'list-2',
    deliveryMode: 'customer_location', startTime: '2026-08-10T10:00:00Z', endTime: '2026-08-10T12:00:00Z',
    state: 'completed', policy: 'REQUIRES_PROVIDER_APPROVAL', createdAt: '2026-08-05T08:00:00Z',
    listing: mockListings[1], customer: mockUsers[0], provider: mockProviderProfiles[1]
  }
];

export const mockReviews: Review[] = [
  {
    id: 'rev-1', authorId: 'user-1', providerId: 'prov-1', listingId: 'list-1',
    bookingId: 'bk-3', rating: 5, text: 'Excellent service! Ahmad was very professional and fixed the electrical issue quickly. Highly recommend!',
    provenance: 'BOOKING_VERIFIED', visible: true, moderationStatus: 'approved', createdAt: '2026-08-12T10:00:00Z',
    author: mockUsers[0]
  },
  {
    id: 'rev-2', authorId: 'user-1', providerId: 'prov-3', listingId: 'list-3',
    rating: 5, text: 'سارة معلمة ممتازة! ابني تحسن بشكل كبير في الرياضيات بعد فقط بضعة دروس.',
    provenance: 'EXPERIENCE_UNVERIFIED', visible: true, moderationStatus: 'approved', createdAt: '2026-08-15T10:00:00Z',
    author: mockUsers[0]
  },
  {
    id: 'rev-3', authorId: 'user-2', providerId: 'prov-3', listingId: 'list-3',
    rating: 5, text: 'Leila is an incredible oud teacher. Her patience and knowledge of traditional Arabic music is unmatched. A truly gifted musician and educator.',
    provenance: 'EXPERIENCE_UNVERIFIED', visible: true, moderationStatus: 'approved', createdAt: '2026-08-10T10:00:00Z',
    author: mockUsers[1]
  }
];

export const mockNotifications: Notification[] = [
  { id: 'notif-1', userId: 'user-1', type: 'booking', title: 'Booking Confirmed', message: 'Your math tutoring session has been confirmed for Friday at 4pm.', read: false, actionUrl: '/bookings/bk-1', createdAt: '2026-08-20T10:00:00Z' },
  { id: 'notif-2', userId: 'user-1', type: 'message', title: 'New Message', message: 'You have a new message from Sara.', read: false, actionUrl: '/messages/conv-1', createdAt: '2026-08-19T14:00:00Z' },
  { id: 'notif-3', userId: 'user-1', type: 'system', title: 'Welcome to SkillLink', message: 'Start by searching for service providers in your area.', read: true, createdAt: '2026-08-01T10:00:00Z' },
];

export const mockQuoteRequests: QuoteRequest[] = [
  {
    id: 'qr-1', customerId: 'user-1', listingId: 'list-2',
    preferredMode: 'customer_location', description: 'I need a complete rewiring of my apartment in Jabal Amman. 3 bedrooms, 2 bathrooms, kitchen, and living room.',
    preferredTiming: 'Next week, any morning', status: 'pending', createdAt: '2026-08-18T08:00:00Z', listing: mockListings[1]
  }
];

export const mockReports: Report[] = [
  {
    id: 'rpt-1', reporterId: 'user-1', targetType: 'review', targetId: 'rev-2',
    reason: 'fake_review', notes: "This review seems to be from the provider's own account.",
    status: 'new', createdAt: '2026-08-20T12:00:00Z', reporter: mockUsers[0]
  }
];
