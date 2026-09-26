/** SlotNexa — static mock data for UI-only mode (no backend). */

export const DUMMY_BUSINESS_TYPES = [
  { code: "SALON", label: "Salon" },
  { code: "SPA", label: "Spa" },
  { code: "CLINIC", label: "Clinic" },
];

/** HD photo URLs (Unsplash) — swap for CDN in production */
export const NEARBY_SALONS = [
  {
    id: "s1",
    slug: "urban-trim",
    name: "Urban Trim Studio",
    rating: 4.8,
    reviewsCount: 428,
    distanceKm: 2.1,
    openNow: true,
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    village: "Indiranagar",
    displayLocation: "Indiranagar, Bengaluru",
    address: "12th Main Rd, Indiranagar, Bengaluru 560038",
    tags: ["Haircut", "Beard", "Styling"],
    imageTone: "linear-gradient(145deg, #e8e4dc, #d4cfc4)",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 120000,
    exploreIds: ["all", "barber", "hair"],
    businessType: "SALON",
  },
  {
    id: "s2",
    slug: "glam-shine",
    name: "Glam & Shine",
    rating: 4.6,
    reviewsCount: 305,
    distanceKm: 3.4,
    openNow: true,
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    village: "Koramangala",
    displayLocation: "Koramangala, Bengaluru",
    address: "5th Block Koramangala, Bengaluru 560095",
    tags: ["Facial", "Makeup", "Bridal"],
    imageTone: "linear-gradient(145deg, #ece8f0, #ddd8e8)",
    imageUrl: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 180000,
    exploreIds: ["all", "hair", "massage", "facial"],
    businessType: "SALON",
  },
  {
    id: "s3",
    slug: "fade-lab",
    name: "Fade Lab",
    rating: 4.9,
    reviewsCount: 612,
    distanceKm: 5.0,
    openNow: false,
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    village: "HSR Layout",
    displayLocation: "HSR Layout, Bengaluru",
    address: "Sector 2, HSR Layout, Bengaluru 560102",
    tags: ["Fade", "Beard", "Hair health"],
    imageTone: "linear-gradient(145deg, #e0e8e4, #cfd8d4)",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 90000,
    exploreIds: ["all", "barber", "hair"],
    businessType: "SALON",
  },
  {
    id: "s4",
    slug: "strand-mumbai",
    name: "Strand House Mumbai",
    rating: 4.7,
    reviewsCount: 891,
    distanceKm: 12.4,
    openNow: true,
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    village: "Bandra West",
    displayLocation: "Bandra West, Mumbai",
    address: "Linking Rd, Bandra West, Mumbai 400050",
    tags: ["Haircut", "Colour", "Keratin"],
    imageTone: "linear-gradient(145deg, #e8e4dc, #d4cfc4)",
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 200000,
    exploreIds: ["all", "hair", "barber"],
    businessType: "SALON",
  },
  {
    id: "s5",
    slug: "green-fields-mysuru",
    name: "Green Fields Salon",
    rating: 4.5,
    reviewsCount: 156,
    distanceKm: 142,
    openNow: true,
    country: "India",
    state: "Karnataka",
    city: "Mysuru",
    village: "Hunsur",
    displayLocation: "Hunsur, Mysuru district",
    address: "Main Rd, Hunsur town, Mysuru district 571105",
    tags: ["Haircut", "Facial", "Bridal"],
    imageTone: "linear-gradient(145deg, #e0e8e4, #cfd8d4)",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 75000,
    exploreIds: ["all", "hair", "facial"],
    businessType: "SALON",
  },
  {
    id: "c1",
    slug: "radiance-skin-clinic",
    name: "Radiance Skin Clinic",
    rating: 4.9,
    reviewsCount: 210,
    distanceKm: 1.8,
    openNow: true,
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    village: "Jayanagar",
    displayLocation: "Jayanagar, Bengaluru",
    address: "4th Block Jayanagar, Bengaluru 560011",
    tags: ["Dermatologist", "Skin", "Consult"],
    imageTone: "linear-gradient(145deg, #e4ecec, #d0dcdc)",
    imageUrl: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 50000,
    exploreIds: ["all"],
    businessType: "CLINIC",
  },
];

/** Style carousel — composite overlay is drawn in-app from face bounds + id. */
export const AI_HAIR_STYLES = [
  {
    id: "h1",
    name: "Soft Layer Cut",
    faceShape: "Oval",
    trend: "Trending near you",
    imageUrl: "/styles/soft-layer.jpg",
    blurb: "Soft layers with movement — suits oval and balanced faces.",
  },
  {
    id: "h2",
    name: "Textured Crop",
    faceShape: "Round",
    trend: "Popular at partner salons",
    imageUrl: "/styles/textured-crop.jpg",
    blurb: "Short textured top, clean sides — elongates a rounder face.",
  },
  {
    id: "h3",
    name: "Classic Side Part",
    faceShape: "Oval",
    trend: "Timeless",
    imageUrl: "/styles/side-part.jpg",
    blurb: "Clean side part — neat office / everyday look.",
  },
  {
    id: "h4",
    name: "Long Waves",
    faceShape: "Heart",
    trend: "Bridal favourite",
    imageUrl: "/styles/long-waves.jpg",
    blurb: "Long soft waves — face-framing length for heart shapes.",
  },
];

export const HAIR_HEALTH_RESULT = {
  score: 8.2,
  issues: ["Mild dryness", "Seasonal shedding"],
  tips: [
    "Use a sulfate-free shampoo 2–3× per week.",
    "Scalp massage with lightweight oil before wash.",
    "Book a deep-conditioning treatment monthly.",
  ],
  products: [
    { name: "Keratin Repair Shampoo", rating: 4.7, note: "For brittle ends" },
    { name: "Tea Tree Scalp Serum", rating: 4.5, note: "Calms itch" },
  ],
};

export const SKIN_ANALYSIS_RESULT = {
  score: 7.8,
  skinType: "Combination",
  concerns: ["Mild uneven tone", "Under-eye fatigue"],
  routine:
    "AM: gentle cleanser → vitamin C serum → SPF 30+. PM: double cleanse → niacinamide → moisturizer. Avoid harsh scrubs this week.",
  dietTips: "More water, omega-3 rich foods, and less late-night sugar — supports skin barrier (LLM-style tip, demo).",
  products: [
    { name: "SPF 30 Gel", rating: 4.8 },
    { name: "Niacinamide 10%", rating: 4.6 },
  ],
  facialSuggestion: "Hydrating facial + LED calm — book at a partner salon.",
};

export const TRENDING_AT_SALON = [
  { label: "Layer cut", bookings: 128 },
  { label: "Skin glow facial", bookings: 96 },
  { label: "Beard sculpt", bookings: 74 },
];

export const BEAUTY_COACH_SEED = [
  {
    role: "assistant" as const,
    text: "Hi — I’m your SlotNexa beauty coach. Ask about hair fall, beard styling, scalp care, or skincare routines. Answers come from a live AI when your server is configured.",
  },
];

export const ADMIN_DASHBOARD = {
  totalTenants: 42,
  tenantsInTrial: 9,
  tenantsActiveSubscription: 28,
  suspendedTenants: 2,
  tenantOwnerAccounts: 35,
  pendingPlatformPayments: 3,
  estimatedMonthlyRecurringPaise: 124500000,
  revenueNote: "Demo MRR — connect live API for Razorpay settlement figures.",
  totalCustomerAccounts: 1280,
  totalStaffMembers: 186,
  totalActiveServiceOfferings: 940,
  appointmentsLast7Days: 412,
  tenantsWithGeoMapped: 31,
  tenantsMissingGeo: 11,
  tenantsWithNoActiveServices: 4,
  platformPulseNote:
    "11 tenant(s) are not on the discovery map yet — add coordinates in tenant settings. 4 active tenant(s) still have no bookable services.",
  subscriptionMix: [
    { key: "TRIAL", label: "Trial", value: 9 },
    { key: "ACTIVE", label: "Active", value: 28 },
    { key: "SUSPENDED", label: "Suspended", value: 2 },
    { key: "OTHER", label: "Other", value: 3 },
  ],
  businessTypeMix: [
    { key: "SALON", label: "Salon", value: 30 },
    { key: "CLINIC", label: "Clinic", value: 12 },
  ],
  appointmentsByDay: [
    { key: "d1", label: "Mon", value: 48 },
    { key: "d2", label: "Tue", value: 62 },
    { key: "d3", label: "Wed", value: 55 },
    { key: "d4", label: "Thu", value: 71 },
    { key: "d5", label: "Fri", value: 80 },
    { key: "d6", label: "Sat", value: 64 },
    { key: "d7", label: "Sun", value: 32 },
  ],
  opsHealth: [
    { key: "GEO", label: "Map coverage %", value: 74 },
    { key: "SERVICES", label: "Have services %", value: 90 },
    { key: "MRR_K", label: "Est. MRR (₹k)", value: 1245 },
    { key: "APPT7", label: "Appts (7d)", value: 412 },
  ],
};

export const ADMIN_TENANTS = [
  {
    id: "c1",
    businessName: "Urban Trim Studio",
    slug: "urban-trim",
    businessType: "SALON",
    subscriptionStatus: "ACTIVE",
    trialEndsAt: null as string | null,
    tenantSuspended: false,
    city: "Indiranagar, Bengaluru",
    specialties: "Haircut, beard, colour, bridal styling",
    salonPhone: "9876543210",
    ownerMobile: "9988776655",
    ownerEmail: "owner@urbantrim.demo",
    internalNotes: "Enterprise partner — priority support",
  },
  {
    id: "c2",
    businessName: "Glam & Shine",
    slug: "glam-shine",
    businessType: "SALON",
    subscriptionStatus: "TRIAL",
    trialEndsAt: "2026-05-01",
    tenantSuspended: false,
    city: "Koramangala, Bengaluru",
    specialties: "Facial, makeup, spa, bridal",
    salonPhone: "9123456789",
    ownerMobile: "9090909090",
    ownerEmail: "hello@glamshine.demo",
    internalNotes: "Trial ends May 2026",
  },
];

export const CUSTOMER_APPOINTMENTS = [
  {
    id: "a1",
    startAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    endAt: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    serviceName: "Haircut + style",
    staffName: "Rahul M.",
    status: "CONFIRMED",
    paymentStatus: "PAID",
  },
];

const PUBLIC_PAGE_BASE = {
  clinicId: "clinic-demo",
  businessName: "Urban Trim Studio",
  slug: "urban-trim",
  businessType: "SALON",
  city: "Bengaluru",
  country: "India",
  state: "Karnataka",
  village: "Indiranagar",
  displayLocation: "Indiranagar, Bengaluru",
  address: "12th Main Rd, Indiranagar, Bengaluru 560038",
  latitude: 12.9784,
  longitude: 77.6408,
  services: [
    {
      id: "svc1",
      name: "Signature haircut",
      category: "Hair",
      durationMinutes: 45,
      priceCents: 120000,
      taxRateBps: 1800,
      description: "Consultation + cut + blow dry",
      active: true,
    },
    {
      id: "svc2",
      name: "Beard sculpt",
      category: "Beard",
      durationMinutes: 30,
      priceCents: 80000,
      taxRateBps: 1800,
      description: "Shape and detail",
      active: true,
    },
    {
      id: "svc3",
      name: "Hydra facial",
      category: "Skin",
      durationMinutes: 60,
      priceCents: 220000,
      taxRateBps: 1800,
      description: "Deep cleanse + hydration",
      active: true,
    },
  ],
  staff: [
    {
      id: "st1",
      displayName: "Floyd Miles",
      specialization: "Cuts & fades",
      active: true,
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=85&auto=format&fit=crop",
      reviews: 635,
      rating: 4.9,
      hourlyPaise: 150000,
      shopLabel: "Urban Trim Studio",
    },
    {
      id: "st2",
      displayName: "Ananya K.",
      specialization: "Colour & styling",
      active: true,
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=85&auto=format&fit=crop",
      reviews: 412,
      rating: 4.8,
      hourlyPaise: 180000,
      shopLabel: "Urban Trim Studio",
    },
  ],
  trendingStyles: [
    {
      id: "demo-trend-1",
      title: "Butterfly layers",
      tagline: "Movement around the face — popular this month at Urban Trim.",
      imageUrl: null,
      sortOrder: 0,
      active: true,
    },
    {
      id: "demo-trend-2",
      title: "Glass-skin prep facial",
      tagline: "Booked with colour appointments — gentle glow, no downtime claim.",
      imageUrl: null,
      sortOrder: 1,
      active: true,
    },
  ],
};

export function getPublicBusinessPage(businessType: string, slug: string) {
  const salon = NEARBY_SALONS.find((s) => s.slug === slug);
  return {
    ...PUBLIC_PAGE_BASE,
    businessType: businessType || PUBLIC_PAGE_BASE.businessType,
    slug: slug || PUBLIC_PAGE_BASE.slug,
    businessName: salon?.name ?? PUBLIC_PAGE_BASE.businessName,
    city: salon?.city ?? PUBLIC_PAGE_BASE.city,
    country: salon?.country ?? PUBLIC_PAGE_BASE.country,
    state: salon?.state ?? PUBLIC_PAGE_BASE.state,
    village: salon?.village ?? PUBLIC_PAGE_BASE.village,
    displayLocation: salon?.displayLocation ?? PUBLIC_PAGE_BASE.displayLocation,
    address: salon?.address ?? PUBLIC_PAGE_BASE.address,
    latitude: PUBLIC_PAGE_BASE.latitude,
    longitude: PUBLIC_PAGE_BASE.longitude,
  };
}

export function buildSlotsForDate(dateIso: string): Array<{ startAt: string; endAt: string; available: boolean }> {
  const times = [
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];
  const slots: Array<{ startAt: string; endAt: string; available: boolean }> = [];
  for (let i = 0; i < times.length; i++) {
    const [h, m] = times[i].split(":").map(Number);
    const start = new Date(`${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    const end = new Date(start.getTime() + 30 * 60000);
    slots.push({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      available: i % 4 !== 1,
    });
  }
  return slots;
}

export const TENANT_SERVICES = [
  { id: "svc1", name: "Signature haircut", durationMinutes: 45, priceCents: 120000, active: true },
  { id: "svc2", name: "Beard sculpt", durationMinutes: 30, priceCents: 80000, active: true },
];

export const TENANT_STAFF = [
  {
    id: "st1",
    displayName: "Rahul M.",
    specialization: "Cuts & fades",
    workingHoursJson: '{"weekly":{"mon":["09:00-18:00"],"tue":["09:00-18:00"]}}',
    email: "rahul@example.com",
    mobile: "9876543210",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop",
    active: true,
  },
  {
    id: "st2",
    displayName: "Ananya K.",
    specialization: "Colour",
    workingHoursJson: null,
    email: null,
    mobile: null,
    photoUrl: null,
    active: true,
  },
];

export const TENANT_APPOINTMENTS = [
  {
    id: "ap1",
    staffId: "st1",
    startAt: new Date(Date.now() + 3600000).toISOString(),
    endAt: new Date(Date.now() + 7200000).toISOString(),
    customerName: "Demo Customer",
    serviceName: "Signature haircut",
    staffName: "Rahul M.",
    status: "CONFIRMED",
    paymentStatus: "UNPAID",
  },
];

/** Home — offers & discovery */
export const HOME_OFFERS = [
  { id: "o1", title: "20% off first facial", sub: "Glam & Shine · ends Sunday", accent: "lavender" as const },
  { id: "o2", title: "Free beard trim with cut", sub: "Urban Trim Studio", accent: "rose" as const },
];

/** Featured hero (reference-style special offer) */
export const HOME_FEATURED = {
  salonName: "Handsome Jack’s Indiranagar",
  address: "12th Main Rd · 2.1 km",
  badge: "Save up to 50%",
  pricePaise: 150000,
  imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=85&auto=format&fit=crop",
  slug: "urban-trim",
};

export const HOME_CATEGORIES = [
  { id: "c1", label: "Barber", slug: "barber", to: "/nearby" },
  { id: "c2", label: "Hair salon", slug: "hair", to: "/ai-hair" },
  { id: "c3", label: "Massage", slug: "massage", to: "/nearby" },
  { id: "c4", label: "Facial", slug: "facial", to: "/skin" },
  { id: "c5", label: "Spa", slug: "spa", to: "/nearby" },
];

export const EXPLORE_CATEGORY_CHIPS = [
  { id: "all", label: "All" },
  { id: "barber", label: "Barber" },
  { id: "hair", label: "Hair salon" },
  { id: "massage", label: "Massage" },
];

export const EXPLORE_SUB_FILTERS = ["Men’s haircut", "Skin fade", "Haircut & beard", "Colour"];

export const RECOMMENDED_PROFESSIONALS = [
  {
    id: "p1",
    name: "Rahul Menon",
    role: "Senior stylist",
    rating: 4.9,
    reviews: 635,
    tags: ["Fade", "Texture"],
    salon: "Urban Trim",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop&facepad=2",
  },
  {
    id: "p2",
    name: "Ananya Krishnan",
    role: "Colour specialist",
    rating: 4.8,
    reviews: 412,
    tags: ["Balayage", "Bridal"],
    salon: "Urban Trim",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop&facepad=2",
  },
  {
    id: "p3",
    name: "Meera Shah",
    role: "Skin & makeup",
    rating: 4.7,
    reviews: 289,
    tags: ["Hydra facial", "Bridal"],
    salon: "Glam & Shine",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop&facepad=2",
  },
];

/** AI face analysis (demo) */
export const FACE_ATTRIBUTES = {
  faceShape: "Oval",
  hairThickness: "Medium",
  forehead: "Average",
  hairVolume: "Medium–high",
};

export const BEFORE_AFTER_PREVIEWS = [
  { id: "ba1", label: "Soft layers", tone: "linear-gradient(135deg, #e8e0d8, #d4ccc4)" },
  { id: "ba2", label: "Textured crop", tone: "linear-gradient(135deg, #ddd8e6, #c9c2d8)" },
];

/** Salon detail */
export const SALON_GALLERY = [
  { id: "g1", tone: "linear-gradient(145deg, #ece8e2, #ddd8d0)" },
  { id: "g2", tone: "linear-gradient(145deg, #e8ecf0, #d8dce4)" },
  { id: "g3", tone: "linear-gradient(145deg, #eef0e8, #dfe2da)" },
];

export const PEOPLE_ALSO_BOOKED = [
  { style: "Layer cut + blow dry", count: 64 },
  { style: "Beard line-up", count: 41 },
  { style: "Hydra facial", count: 38 },
];

export const MAKEUP_TRENDING = [
  { label: "Soft bridal glow", bookings: 52 },
  { label: "Smokey evening", bookings: 31 },
];

/** Tenant analytics & CRM (demo) */
export const TENANT_AI_INSIGHTS = [
  "Layer cuts are up 18% vs last week.",
  "Most booked add-on: beard trim with haircut.",
  "Customers in your area search “hair fall” — promote scalp treatments.",
];

export const TENANT_ANALYTICS = {
  weeklyRevenuePaise: 18650000,
  topServices: [
    { name: "Signature haircut", share: 42 },
    { name: "Hydra facial", share: 28 },
    { name: "Beard sculpt", share: 18 },
  ],
  repeatCustomersPct: 34,
  peakHours: "5–8 PM weekdays",
};

export const TENANT_CUSTOMERS = [
  { id: "cu1", name: "Priya N.", visits: 6, lastVisit: "2026-03-28", note: "Prefers Ananya" },
  { id: "cu2", name: "Arjun V.", visits: 3, lastVisit: "2026-04-02", note: "Sensitive scalp" },
];

export const PORTFOLIO_ITEMS = [
  { id: "pf1", tag: "Fade", tone: "linear-gradient(145deg, #d4d0c8, #c4c0b8)" },
  { id: "pf2", tag: "Layer cut", tone: "linear-gradient(145deg, #e0dce8, #d0ccd8)" },
  { id: "pf3", tag: "Bridal", tone: "linear-gradient(145deg, #f0e8e0, #e0d8d0)" },
];

export const TENANT_PRODUCTS = [
  { id: "pr1", name: "Keratin shampoo", pricePaise: 89900, match: "Dry / frizzy hair" },
  { id: "pr2", name: "Tea tree scalp serum", pricePaise: 64900, match: "Itchy scalp" },
];

/** Staff (professional) */
export const STAFF_REQUESTS = [
  {
    id: "rq1",
    customer: "Kavya R.",
    hairType: "Wavy · medium density",
    request: "Butterfly layers with face-framing",
    time: "Tomorrow · 4:30 PM",
    difficulty: "Medium",
  },
];

export const STAFF_EARNINGS = {
  weekPaise: 2450000,
  monthPaise: 9820000,
  nextPayout: "Apr 12, 2026",
};

/** Super admin — end users & platform payments (demo lists) */
export const ADMIN_END_USERS = [
  { id: "u1", email: "priya@email.com", name: "Priya N.", role: "CUSTOMER", joined: "2025-11-02" },
  { id: "u2", email: "arjun@email.com", name: "Arjun V.", role: "CUSTOMER", joined: "2026-01-14" },
  { id: "u3", email: "owner@demo.com", name: "Salon Owner", role: "TENANT_ADMIN", joined: "2025-08-01" },
];

export const ADMIN_PAYMENT_QUEUE = [
  { id: "pay1", tenant: "Glam & Shine", amountPaise: 199000, type: "SaaS Standard", status: "Pending" },
  { id: "pay2", tenant: "Urban Trim Studio", amountPaise: 99000, type: "SaaS Basic", status: "Pending" },
  { id: "pay3", tenant: "Fade Lab", amountPaise: 399000, type: "SaaS Premium", status: "Settled" },
];

export const BOOKING_SUCCESS_STORAGE_KEY = "slotnexa_last_booking";
