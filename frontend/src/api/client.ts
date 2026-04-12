/**
 * API client: uses the Spring Boot backend at `/api/v1` (Vite dev proxy → :8090).
 * Set `VITE_USE_MOCK=true` to use in-memory demo data without a running server.
 */

import {
  ADMIN_DASHBOARD,
  ADMIN_TENANTS,
  buildSlotsForDate,
  CUSTOMER_APPOINTMENTS,
  DUMMY_BUSINESS_TYPES,
  getPublicBusinessPage,
  TENANT_APPOINTMENTS,
  TENANT_SERVICES,
  TENANT_STAFF,
} from "../data/dummy";
import { localFallbackReply } from "../utils/beautyCoachLocal";
import { isValidInMobile, normalizeInMobile } from "../utils/phone";
import { ApiError, requestJson } from "./http";

const TOKEN_KEY = "mbtz_token";
export const DUMMY_PROFILE_KEY = "mbtz_dummy_profile";

/** When true, all API calls use local dummy data (offline UI). */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === "true";

export type ApiEnvelope<T> = {
  status: unknown;
  responseMessage: string;
  data: T;
  count?: number;
  list?: unknown[];
  send?: string;
};

export type AuthData = {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: { id: string; email: string; name: string; role: string };
  clinicId: string | null;
};

export type ProfileData = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    mobile?: string;
    /** HTTPS URL or JPEG data URL from registration / PATCH profile. */
    profilePhotoDataUrl?: string | null;
  };
  clinic: {
    id: string;
    businessName: string;
    slug: string;
    businessType: string;
    subscriptionStatus: string;
    trialEndsAt?: string | null;
    tenantSuspended?: boolean;
    onlinePaymentsEnabled?: boolean;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    state?: string | null;
    village?: string | null;
    displayLocation?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

function delay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildProfileFromEmail(email: string, name: string, mobile?: string | null): ProfileData {
  const lower = email.toLowerCase();
  let role = "CUSTOMER";
  if (lower.includes("superadmin") || lower.startsWith("admin@")) role = "SUPER_ADMIN";
  else if (lower.includes("owner") || lower.includes("tenant@")) role = "TENANT_ADMIN";
  else if (lower.includes("staff@")) role = "STAFF";

  const clinic =
    role === "TENANT_ADMIN" || role === "STAFF"
      ? {
          id: "clinic-demo",
          businessName: "Urban Trim Studio",
          slug: "urban-trim",
          businessType: "SALON",
          subscriptionStatus: "ACTIVE",
          trialEndsAt: null as string | null,
          tenantSuspended: false,
          onlinePaymentsEnabled: true,
          address: "12th Main Rd, Indiranagar, Bengaluru 560038",
          city: "Bengaluru",
          country: "India",
          state: "Karnataka",
          village: "Indiranagar",
          displayLocation: "Indiranagar, Bengaluru",
          latitude: 12.9784,
          longitude: 77.6408,
        }
      : null;

  const u: ProfileData["user"] = {
    id: "user-demo",
    email,
    name: name || email.split("@")[0] || "Guest",
    role,
  };
  if (mobile) u.mobile = mobile;

  return {
    user: u,
    clinic,
  };
}

function mapProfile(raw: unknown): ProfileData {
  const p = raw as {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      mobile?: string | null;
      profilePhotoDataUrl?: string | null;
    };
    clinic: {
      id: string;
      businessName: string;
      slug: string;
      businessType: string;
      subscriptionStatus: string;
      trialEndsAt?: string | null;
      tenantSuspended?: boolean;
      onlinePaymentsEnabled?: boolean;
      address?: string | null;
      city?: string | null;
      country?: string | null;
      state?: string | null;
      village?: string | null;
      displayLocation?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
  };
  return {
    user: {
      id: String(p.user.id),
      email: p.user.email,
      name: p.user.name,
      role: p.user.role,
      ...(p.user.mobile ? { mobile: p.user.mobile } : {}),
      ...(p.user.profilePhotoDataUrl != null && String(p.user.profilePhotoDataUrl).length > 0
        ? { profilePhotoDataUrl: String(p.user.profilePhotoDataUrl) }
        : {}),
    },
    clinic: p.clinic
      ? {
          id: String(p.clinic.id),
          businessName: p.clinic.businessName,
          slug: p.clinic.slug,
          businessType: String(p.clinic.businessType),
          subscriptionStatus: String(p.clinic.subscriptionStatus),
          trialEndsAt: p.clinic.trialEndsAt ?? null,
          tenantSuspended: Boolean(p.clinic.tenantSuspended),
          onlinePaymentsEnabled: Boolean(p.clinic.onlinePaymentsEnabled),
          ...(p.clinic.address != null ? { address: String(p.clinic.address) } : {}),
          ...(p.clinic.city != null ? { city: String(p.clinic.city) } : {}),
          ...(p.clinic.country != null ? { country: String(p.clinic.country) } : {}),
          ...(p.clinic.state != null ? { state: String(p.clinic.state) } : {}),
          ...(p.clinic.village != null ? { village: String(p.clinic.village) } : {}),
          ...(p.clinic.displayLocation != null ? { displayLocation: String(p.clinic.displayLocation) } : {}),
          ...(p.clinic.latitude != null && p.clinic.longitude != null
            ? {
                latitude: Number(p.clinic.latitude),
                longitude: Number(p.clinic.longitude),
              }
            : {}),
        }
      : null,
  };
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function clearDummyProfile() {
  localStorage.removeItem(DUMMY_PROFILE_KEY);
}

export async function apiMe(token: string): Promise<ProfileData> {
  if (USE_MOCK_API) {
    await delay(120);
    const raw = localStorage.getItem(DUMMY_PROFILE_KEY);
    if (!raw) throw new Error("Not signed in");
    return JSON.parse(raw) as ProfileData;
  }
  const data = await requestJson<unknown>("/auth/me", { method: "GET", token });
  return mapProfile(data);
}

export async function apiPatchCustomerProfile(
  token: string,
  body: { profilePhotoDataUrl?: string | null },
): Promise<ProfileData["user"]> {
  if (USE_MOCK_API) {
    await delay(100);
    const raw = localStorage.getItem(DUMMY_PROFILE_KEY);
    if (!raw) throw new Error("Not signed in");
    const p = JSON.parse(raw) as ProfileData;
    const next: ProfileData = {
      ...p,
      user: {
        ...p.user,
        ...(body.profilePhotoDataUrl !== undefined
          ? { profilePhotoDataUrl: body.profilePhotoDataUrl || undefined }
          : {}),
      },
    };
    localStorage.setItem(DUMMY_PROFILE_KEY, JSON.stringify(next));
    return next.user;
  }
  const u = await requestJson<Record<string, unknown>>("/me/profile", {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
  return {
    id: String(u.id ?? ""),
    email: String(u.email ?? ""),
    name: String(u.name ?? ""),
    role: String(u.role ?? "CUSTOMER"),
    ...(u.mobile ? { mobile: String(u.mobile) } : {}),
    ...(u.profilePhotoDataUrl != null && String(u.profilePhotoDataUrl).length > 0
      ? { profilePhotoDataUrl: String(u.profilePhotoDataUrl) }
      : {}),
  };
}

export type NotificationCatalog = Record<string, unknown>;

export async function apiMetaNotifications(): Promise<NotificationCatalog> {
  if (USE_MOCK_API) {
    await delay(40);
    return {
      email: {
        bookingConfirmation: { enabled: false, when: "After booking", template: "HTML" },
        dayOfReminder: { enabled: false, when: "Morning of visit", template: "HTML" },
        staffCcOnBooking: { enabled: false },
      },
      planned: [],
    };
  }
  return requestJson<NotificationCatalog>("/meta/notifications", { method: "GET" });
}

export async function apiLogin(payload: { email: string; password: string }): Promise<AuthData> {
  if (USE_MOCK_API) {
    await delay();
    let keepMobile: string | undefined;
    try {
      const raw = localStorage.getItem(DUMMY_PROFILE_KEY);
      if (raw) {
        const prev = JSON.parse(raw) as ProfileData;
        if (prev.user.email.toLowerCase() === payload.email.trim().toLowerCase() && prev.user.mobile) {
          keepMobile = prev.user.mobile;
        }
      }
    } catch {
      /* ignore */
    }
    const profile = buildProfileFromEmail(
      payload.email.trim(),
      payload.email.trim().split("@")[0] ?? "User",
      keepMobile,
    );
    localStorage.setItem(DUMMY_PROFILE_KEY, JSON.stringify(profile));
    return {
      accessToken: "salongo_dummy",
      tokenType: "Bearer",
      expiresInMs: 86400000,
      user: profile.user,
      clinicId: profile.clinic?.id ?? null,
    };
  }
  const data = await requestJson<AuthData>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: payload.email.trim(), password: payload.password }),
  });
  return {
    ...data,
    user: { ...data.user, id: String(data.user.id) },
    clinicId: data.clinicId ? String(data.clinicId) : null,
  };
}

export type BusinessTypeOption = { code: string; label: string };

export async function apiBusinessTypes(): Promise<BusinessTypeOption[]> {
  if (USE_MOCK_API) {
    await delay(80);
    return DUMMY_BUSINESS_TYPES;
  }
  return requestJson<BusinessTypeOption[]>("/meta/business-types", { method: "GET" });
}

/** Static onboarding suggestions by business type — not other tenants’ rows. */
export type StarterServiceTemplate = {
  name: string;
  category: string | null;
  durationMinutes: number;
  priceCents: number;
};

export async function apiMetaStarterServiceTemplates(businessType: string): Promise<StarterServiceTemplate[]> {
  if (USE_MOCK_API) {
    await delay(80);
    return [
      { name: "Signature haircut", category: "Hair", durationMinutes: 45, priceCents: 49900 },
      { name: "Beard trim", category: "Grooming", durationMinutes: 30, priceCents: 29900 },
    ];
  }
  return requestJson<StarterServiceTemplate[]>(
    `/meta/starter-service-templates?businessType=${encodeURIComponent(businessType)}`,
    { method: "GET" },
  );
}

/** Distinct categories from this clinic’s services only (tenant token + clinicId). */
export async function apiTenantServiceCategories(token: string, clinicId: string): Promise<string[]> {
  if (USE_MOCK_API) {
    await delay(50);
    return ["Hair", "Skin", "Grooming"];
  }
  return requestJson<string[]>(`/clinics/${clinicId}/service-categories`, { method: "GET", token });
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  slug: string;
  businessType: string;
}): Promise<AuthData> {
  if (USE_MOCK_API) {
    await delay();
    const profile: ProfileData = {
      user: {
        id: "user-demo",
        email: payload.email.trim(),
        name: payload.name.trim(),
        role: "TENANT_ADMIN",
      },
      clinic: {
        id: "clinic-demo",
        businessName: payload.businessName.trim() || "My Salon",
        slug: payload.slug.trim().toLowerCase() || "my-salon",
        businessType: payload.businessType || "SALON",
        subscriptionStatus: "TRIAL",
        trialEndsAt: null,
        tenantSuspended: false,
        onlinePaymentsEnabled: false,
      },
    };
    localStorage.setItem(DUMMY_PROFILE_KEY, JSON.stringify(profile));
    return {
      accessToken: "salongo_dummy",
      tokenType: "Bearer",
      expiresInMs: 86400000,
      user: profile.user,
      clinicId: profile.clinic?.id ?? null,
    };
  }
  const data = await requestJson<AuthData>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      businessName: payload.businessName.trim(),
      slug: payload.slug.trim().toLowerCase(),
      businessType: payload.businessType || "OTHER",
    }),
  });
  return {
    ...data,
    user: { ...data.user, id: String(data.user.id) },
    clinicId: data.clinicId ? String(data.clinicId) : null,
  };
}

export async function apiRegisterCustomer(payload: {
  name: string;
  email: string;
  password: string;
  mobile: string;
  profilePhotoDataUrl?: string | null;
}): Promise<AuthData> {
  if (USE_MOCK_API) {
    await delay();
    if (!isValidInMobile(payload.mobile)) {
      throw new Error("Enter a valid 10-digit Indian mobile number (starts with 6–9).");
    }
    const mobile = normalizeInMobile(payload.mobile);
    const profile: ProfileData = {
      user: {
        id: "user-demo",
        email: payload.email.trim(),
        name: payload.name.trim(),
        role: "CUSTOMER",
        mobile,
        ...(payload.profilePhotoDataUrl ? { profilePhotoDataUrl: payload.profilePhotoDataUrl } : {}),
      },
      clinic: null,
    };
    localStorage.setItem(DUMMY_PROFILE_KEY, JSON.stringify(profile));
    return {
      accessToken: "salongo_dummy",
      tokenType: "Bearer",
      expiresInMs: 86400000,
      user: profile.user,
      clinicId: null,
    };
  }
  const body: Record<string, unknown> = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    mobile: payload.mobile.trim(),
  };
  if (payload.profilePhotoDataUrl?.trim()) {
    body.profilePhotoDataUrl = payload.profilePhotoDataUrl.trim();
  }
  const data = await requestJson<AuthData>("/auth/register-customer", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return {
    ...data,
    user: { ...data.user, id: String(data.user.id) },
    clinicId: data.clinicId ? String(data.clinicId) : null,
  };
}

export type PublicBusinessPage = {
  clinicId: string;
  businessName: string;
  slug: string;
  businessType: string;
  city: string | null;
  address?: string | null;
  country?: string | null;
  state?: string | null;
  village?: string | null;
  displayLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  services: Array<{
    id: string;
    name: string;
    category: string | null;
    durationMinutes: number;
    priceCents: number;
    taxRateBps: number | null;
    description: string | null;
    active: boolean;
  }>;
  staff: Array<{
    id: string;
    displayName: string;
    specialization: string | null;
    active: boolean;
    photoUrl?: string | null;
    reviews?: number;
    rating?: number;
    hourlyPaise?: number;
    shopLabel?: string | null;
  }>;
  trendingStyles?: Array<{
    id: string;
    title: string;
    tagline: string | null;
    imageUrl: string | null;
    sortOrder: number;
    active: boolean;
  }>;
};

export async function apiPublicBusiness(businessType: string, slug: string): Promise<PublicBusinessPage> {
  if (USE_MOCK_API) {
    await delay(100);
    return getPublicBusinessPage(businessType, slug);
  }
  const bt = businessType.toUpperCase();
  const data = await requestJson<Record<string, unknown>>(`/public/${bt}/${encodeURIComponent(slug)}`, {
    method: "GET",
  });
  return {
    ...data,
    clinicId: String(data.clinicId),
    businessType: String(data.businessType),
    latitude: data.latitude != null && data.latitude !== "" ? Number(data.latitude) : null,
    longitude: data.longitude != null && data.longitude !== "" ? Number(data.longitude) : null,
    services: (data.services as PublicBusinessPage["services"]) ?? [],
    staff: (data.staff as PublicBusinessPage["staff"]) ?? [],
    trendingStyles: mapTrendingStyles(data.trendingStyles),
  } as PublicBusinessPage;
}

function mapTrendingStyles(raw: unknown): PublicBusinessPage["trendingStyles"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const r = x as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      title: String(r.title ?? ""),
      tagline: r.tagline != null ? String(r.tagline) : null,
      imageUrl: r.imageUrl != null ? String(r.imageUrl) : null,
      sortOrder: Number(r.sortOrder ?? 0),
      active: Boolean(r.active),
    };
  });
}

export type TimeSlot = { startAt: string; endAt: string; available: boolean };

export async function apiPublicSlots(
  businessType: string,
  slug: string,
  params: { date: string; serviceId: string; staffId: string },
): Promise<TimeSlot[]> {
  if (USE_MOCK_API) {
    await delay(80);
    return buildSlotsForDate(params.date);
  }
  const bt = businessType.toUpperCase();
  const q = new URLSearchParams({
    date: params.date,
    serviceId: params.serviceId,
    staffId: params.staffId,
  });
  return requestJson<TimeSlot[]>(`/public/${bt}/${encodeURIComponent(slug)}/slots?${q}`, { method: "GET" });
}

export type BookResult = {
  appointment: Record<string, unknown>;
  paymentCheckout: {
    ledgerId: string;
    orderId: string;
    amountPaise: number;
    mockMode: boolean;
    message: string;
    currency?: string;
    razorpayKeyId?: string | null;
  } | null;
};

export async function apiPublicBook(
  businessType: string,
  slug: string,
  body: {
    serviceId: string;
    staffId: string;
    startAt: string;
    customerName: string;
    customerEmail: string;
    customerMobile?: string;
    customerNotes?: string;
  },
): Promise<BookResult> {
  if (USE_MOCK_API) {
    await delay(200);
    return {
      appointment: { id: "demo-appt", status: "CONFIRMED" },
      paymentCheckout: {
        ledgerId: "led-demo",
        orderId: `ORD-${Date.now()}`,
        amountPaise: 150000,
        mockMode: true,
        message: "Demo — no Razorpay call.",
      },
    };
  }
  const bt = businessType.toUpperCase();
  const payload = {
    serviceId: body.serviceId,
    staffId: body.staffId,
    startAt: body.startAt,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerMobile: body.customerMobile ?? null,
    customerNotes: body.customerNotes ?? null,
  };
  const data = await requestJson<BookResult>(`/public/${bt}/${encodeURIComponent(slug)}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data.paymentCheckout) {
    const pc = data.paymentCheckout as Record<string, unknown>;
    return {
      ...data,
      paymentCheckout: {
        ...data.paymentCheckout,
        ledgerId: String(pc.ledgerId ?? ""),
      },
    };
  }
  return data;
}

export async function apiTenantServices(token: string, clinicId: string): Promise<unknown[]> {
  if (USE_MOCK_API) {
    await delay(100);
    return TENANT_SERVICES as unknown[];
  }
  return requestJson<unknown[]>(`/clinics/${clinicId}/services`, { method: "GET", token });
}

export async function apiTenantStaff(token: string, clinicId: string): Promise<unknown[]> {
  if (USE_MOCK_API) {
    await delay(100);
    return TENANT_STAFF as unknown[];
  }
  return requestJson<unknown[]>(`/clinics/${clinicId}/staff`, { method: "GET", token });
}

export async function apiTenantAppointments(token: string, clinicId: string): Promise<unknown[]> {
  if (USE_MOCK_API) {
    await delay(100);
    return TENANT_APPOINTMENTS as unknown[];
  }
  return requestJson<unknown[]>(`/clinics/${clinicId}/appointments`, { method: "GET", token });
}

export async function apiCreateService(
  token: string,
  clinicId: string,
  body: {
    name: string;
    category?: string;
    durationMinutes: number;
    priceCents: number;
    taxRateBps?: number;
    description?: string;
    active?: boolean;
  },
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(150);
    return { ok: true };
  }
  return requestJson<unknown>(`/clinics/${clinicId}/services`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export type TrendingStyleRow = NonNullable<PublicBusinessPage["trendingStyles"]>[number];

export async function apiTenantTrendingStyles(token: string, clinicId: string): Promise<TrendingStyleRow[]> {
  if (USE_MOCK_API) {
    await delay(60);
    const p = getPublicBusinessPage("SALON", "urban-trim") as PublicBusinessPage;
    return [...(p.trendingStyles ?? [])];
  }
  const rows = await requestJson<unknown[]>(`/clinics/${clinicId}/trending-styles`, { method: "GET", token });
  return mapTrendingStyles(rows);
}

export async function apiTenantCreateTrendingStyle(
  token: string,
  clinicId: string,
  body: { title: string; tagline?: string | null; imageUrl?: string | null; sortOrder?: number; active?: boolean },
): Promise<TrendingStyleRow> {
  if (USE_MOCK_API) {
    await delay(120);
    return {
      id: `t-${Date.now()}`,
      title: body.title,
      tagline: body.tagline ?? null,
      imageUrl: body.imageUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      active: body.active !== false,
    };
  }
  const row = await requestJson<Record<string, unknown>>(`/clinics/${clinicId}/trending-styles`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
  return mapTrendingStyles([row])[0]!;
}

export async function apiTenantUpdateTrendingStyle(
  token: string,
  clinicId: string,
  styleId: string,
  body: Partial<{ title: string; tagline: string | null; imageUrl: string | null; sortOrder: number; active: boolean }>,
): Promise<TrendingStyleRow> {
  if (USE_MOCK_API) {
    await delay(100);
    return {
      id: styleId,
      title: String(body.title ?? "Updated"),
      tagline: body.tagline ?? null,
      imageUrl: body.imageUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      active: body.active !== false,
    };
  }
  const row = await requestJson<Record<string, unknown>>(`/clinics/${clinicId}/trending-styles/${styleId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
  return mapTrendingStyles([row])[0]!;
}

export async function apiTenantDeleteTrendingStyle(token: string, clinicId: string, styleId: string): Promise<void> {
  if (USE_MOCK_API) {
    await delay(80);
    return;
  }
  await requestJson<unknown>(`/clinics/${clinicId}/trending-styles/${styleId}`, { method: "DELETE", token });
}

export type BeautyCoachPersonalizeResult = {
  suggestedHaircuts: string[];
  hairHealthTips: string[];
  productCategories: string[];
  facialTips: string[];
  disclaimer: string;
};

export async function apiBeautyCoachPersonalize(body: {
  faceShapeCategory?: string | null;
  faceShapeDetail?: string | null;
  faceCount?: number | null;
  hairConcern?: string | null;
  skinOrMakeupNotes?: string | null;
}): Promise<BeautyCoachPersonalizeResult> {
  if (USE_MOCK_API) {
    await delay(400);
    return {
      suggestedHaircuts: ["Soft layers", "Side fringe", "Textured bob", "Long curtain bangs"],
      hairHealthTips: ["Reduce heat frequency", "Wide-tooth comb when wet", "Silk pillowcase can help friction"],
      productCategories: ["Sulfate-free shampoo", "Bond-repair mask", "Heat protectant spray", "Scalp balancing rinse"],
      facialTips: ["SPF 30+ daily", "Cream blush high on cheeks", "Brow gel for a lifted frame"],
      disclaimer: "Demo mode — not medical advice. See a dermatologist or trichologist for persistent issues.",
    };
  }
  return requestJson<BeautyCoachPersonalizeResult>("/beauty-coach/personalize", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type StaffWriteBody = {
  displayName: string;
  specialization?: string | null;
  workingHoursJson?: string | null;
  email?: string | null;
  mobile?: string | null;
  gender?: string | null;
  parallelBookingsMax?: number | null;
  photoUrl?: string | null;
  active?: boolean;
};

export async function apiCreateStaff(
  token: string,
  clinicId: string,
  body: StaffWriteBody,
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(150);
    return { ok: true };
  }
  return requestJson<unknown>(`/clinics/${clinicId}/staff`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function apiUpdateStaff(
  token: string,
  clinicId: string,
  staffId: string,
  body: Partial<StaffWriteBody>,
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(120);
    return { ok: true };
  }
  return requestJson<unknown>(`/clinics/${clinicId}/staff/${staffId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

export async function apiTenantCancelAppointment(
  token: string,
  clinicId: string,
  appointmentId: string,
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(120);
    return { ok: true };
  }
  return requestJson<unknown>(`/clinics/${clinicId}/appointments/${appointmentId}/cancel`, {
    method: "POST",
    token,
  });
}

export async function apiTenantReassignAppointment(
  token: string,
  clinicId: string,
  appointmentId: string,
  staffId: string,
  reason?: string | null,
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(120);
    return { ok: true };
  }
  const body: Record<string, unknown> = { staffId };
  if (reason != null && String(reason).trim()) body.reason = String(reason).trim();
  return requestJson<unknown>(`/clinics/${clinicId}/appointments/${appointmentId}/reassign`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function apiTenantCompleteAppointment(
  token: string,
  clinicId: string,
  appointmentId: string,
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(100);
    return { ok: true };
  }
  return requestJson<unknown>(`/clinics/${clinicId}/appointments/${appointmentId}/complete`, {
    method: "POST",
    token,
  });
}

export async function apiTenantNoShowAppointment(
  token: string,
  clinicId: string,
  appointmentId: string,
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(100);
    return { ok: true };
  }
  return requestJson<unknown>(`/clinics/${clinicId}/appointments/${appointmentId}/no-show`, {
    method: "POST",
    token,
  });
}

export async function apiCustomerCancelAppointment(token: string, appointmentId: string): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(120);
    return { ok: true };
  }
  return requestJson<unknown>(`/me/appointments/${appointmentId}/cancel`, {
    method: "POST",
    token,
  });
}

export type IndiaGeoData = {
  states: string[];
  citiesByState: Record<string, string[]>;
};

/** India states & cities — backend serves static catalog (no API key). */
export async function apiIndiaGeo(): Promise<IndiaGeoData> {
  if (USE_MOCK_API) {
    await delay(60);
    return {
      states: ["Karnataka", "Maharashtra"],
      citiesByState: {
        Karnataka: ["Bengaluru", "Mysuru"],
        Maharashtra: ["Mumbai", "Pune"],
      },
    };
  }
  return requestJson<IndiaGeoData>("/meta/geo/india", { method: "GET" });
}

export type StaffProfileMeta = {
  genders: string[];
  parallelBookingsHelp: string;
};

export async function apiMetaStaffProfileOptions(): Promise<StaffProfileMeta> {
  if (USE_MOCK_API) {
    await delay(40);
    return {
      genders: ["UNSPECIFIED", "FEMALE", "MALE", "NON_BINARY", "PREFER_NOT_TO_SAY"],
      parallelBookingsHelp: "Max overlapping appointments this stylist accepts.",
    };
  }
  const raw = await requestJson<Record<string, unknown>>("/meta/staff-profile-options", { method: "GET" });
  return {
    genders: Array.isArray(raw.genders) ? (raw.genders as string[]) : [],
    parallelBookingsHelp: String(raw.parallelBookingsHelp ?? ""),
  };
}

export type PaymentCheckout = {
  ledgerId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  mockMode: boolean;
  message: string;
};

export async function apiSaasCheckout(
  token: string,
  clinicId: string,
  plan: "BASIC" | "STANDARD" | "PREMIUM",
): Promise<PaymentCheckout> {
  if (USE_MOCK_API) {
    await delay(120);
    const amounts: Record<string, number> = { BASIC: 99000, STANDARD: 199000, PREMIUM: 399000 };
    return {
      ledgerId: `saas-${plan.toLowerCase()}`,
      orderId: `ORD-SAAS-${Date.now()}`,
      amountPaise: amounts[plan],
      currency: "INR",
      mockMode: true,
      message: "Demo checkout — confirm mock to activate.",
    };
  }
  const data = await requestJson<PaymentCheckout & { ledgerId: string }>(`/clinics/${clinicId}/payments/saas/checkout`, {
    method: "POST",
    token,
    body: JSON.stringify({ plan }),
  });
  return { ...data, ledgerId: String(data.ledgerId) };
}

export async function apiSaasConfirmMock(token: string, clinicId: string, ledgerId: string): Promise<string> {
  if (USE_MOCK_API) {
    await delay(100);
    return "OK";
  }
  return requestJson<string>(`/clinics/${clinicId}/payments/saas/confirm-mock/${ledgerId}`, {
    method: "POST",
    token,
  });
}

export async function apiUpdateClinic(
  token: string,
  clinicId: string,
  body: {
    businessName?: string;
    businessType?: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    state?: string | null;
    village?: string | null;
    displayLocation?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    onlinePaymentsEnabled?: boolean;
  },
): Promise<unknown> {
  if (USE_MOCK_API) {
    await delay(150);
    return {};
  }
  return requestJson<unknown>(`/clinics/${clinicId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

export type AdminDashboard = {
  totalTenants: number;
  tenantsInTrial: number;
  tenantsActiveSubscription: number;
  suspendedTenants: number;
  tenantOwnerAccounts: number;
  pendingPlatformPayments: number;
  estimatedMonthlyRecurringPaise: number;
  revenueNote: string;
};

export type ClinicRow = {
  id: string;
  businessName: string;
  slug: string;
  businessType: string;
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  tenantSuspended?: boolean;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  village?: string | null;
  displayLocation?: string | null;
  specialties?: string | null;
  salonPhone?: string | null;
  ownerMobile?: string | null;
  ownerEmail?: string | null;
  internalNotes?: string | null;
};

function mapClinicRow(raw: unknown): ClinicRow {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    businessName: String(r.businessName),
    slug: String(r.slug),
    businessType: String(r.businessType),
    subscriptionStatus: String(r.subscriptionStatus),
    trialEndsAt: (r.trialEndsAt as string | null) ?? null,
    tenantSuspended: Boolean(r.tenantSuspended),
    city: r.city != null ? String(r.city) : null,
    country: r.country != null ? String(r.country) : null,
    state: r.state != null ? String(r.state) : null,
    village: r.village != null ? String(r.village) : null,
    displayLocation: r.displayLocation != null ? String(r.displayLocation) : null,
    specialties: r.specialties != null ? String(r.specialties) : null,
    salonPhone: r.salonPhone != null ? String(r.salonPhone) : null,
    ownerMobile: r.ownerMobile != null ? String(r.ownerMobile) : null,
    ownerEmail: r.ownerEmail != null ? String(r.ownerEmail) : null,
    internalNotes: r.internalNotes != null ? String(r.internalNotes) : null,
  };
}

export async function apiAdminDashboard(token: string): Promise<AdminDashboard> {
  if (USE_MOCK_API) {
    await delay(100);
    return ADMIN_DASHBOARD;
  }
  return requestJson<AdminDashboard>("/admin/dashboard", { method: "GET", token });
}

export async function apiAdminTenants(token: string): Promise<ClinicRow[]> {
  if (USE_MOCK_API) {
    await delay(100);
    return [...ADMIN_TENANTS];
  }
  const rows = await requestJson<unknown[]>("/admin/tenants", { method: "GET", token });
  return rows.map(mapClinicRow);
}

export async function apiAdminCreateTenant(
  token: string,
  body: {
    businessName: string;
    slug: string;
    businessType: string;
    city?: string;
    country?: string;
    state?: string;
    village?: string;
    displayLocation?: string;
    specialties?: string;
    salonPhone: string;
    ownerMobile: string;
    ownerEmail: string;
    ownerPassword: string;
    internalNotes?: string;
    initialStaff?: {
      displayName: string;
      specialization?: string | null;
      email?: string | null;
      mobile?: string | null;
      gender?: string | null;
      parallelBookingsMax?: number | null;
      workingHoursJson?: string | null;
    };
    /** New service rows for this clinic only — never IDs from other tenants. */
    initialServices?: { name: string; category?: string | null; durationMinutes?: number; priceCents?: number }[];
  },
): Promise<ClinicRow> {
  if (USE_MOCK_API) {
    await delay(180);
    if (!body.ownerEmail?.trim()) throw new Error("Owner email is required.");
    if (!body.ownerPassword || body.ownerPassword.length < 8) {
      throw new Error("Owner password must be at least 8 characters.");
    }
    const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) throw new Error("Slug is required.");
    if (ADMIN_TENANTS.some((t) => t.slug === slug)) throw new Error("That booking link slug is already in use.");
    if (!isValidInMobile(body.ownerMobile)) {
      throw new Error("Owner mobile must be a valid 10-digit Indian number (for alerts & WhatsApp).");
    }
    if (!isValidInMobile(body.salonPhone)) {
      throw new Error("Salon phone must be a valid 10-digit Indian number (customer contact).");
    }
    const id = `c${ADMIN_TENANTS.length + 1}-${Date.now().toString(36)}`;
    const row: ClinicRow = {
      id,
      businessName: body.businessName.trim() || "New business",
      slug,
      businessType: body.businessType || "SALON",
      subscriptionStatus: "TRIAL",
      trialEndsAt: null,
      tenantSuspended: false,
      city: body.city?.trim() || null,
      country: body.country?.trim() || null,
      state: body.state?.trim() || null,
      village: body.village?.trim() || null,
      displayLocation: body.displayLocation?.trim() || null,
      specialties: body.specialties?.trim() || null,
      salonPhone: normalizeInMobile(body.salonPhone),
      ownerMobile: normalizeInMobile(body.ownerMobile),
      ownerEmail: body.ownerEmail?.trim() || null,
      internalNotes: body.internalNotes?.trim() || null,
    };
    ADMIN_TENANTS.push(row as (typeof ADMIN_TENANTS)[number]);
    return row;
  }
  const created = await requestJson<unknown>("/admin/tenants", {
    method: "POST",
    token,
    body: JSON.stringify({
      businessName: body.businessName.trim(),
      slug: body.slug.trim().toLowerCase(),
      businessType: body.businessType,
      city: body.city?.trim() || null,
      country: body.country?.trim() || null,
      state: body.state?.trim() || null,
      village: body.village?.trim() || null,
      displayLocation: body.displayLocation?.trim() || null,
      specialties: body.specialties?.trim() || null,
      salonPhone: body.salonPhone.trim(),
      ownerMobile: body.ownerMobile.trim(),
      ownerEmail: body.ownerEmail.trim(),
      ownerPassword: body.ownerPassword,
      internalNotes: body.internalNotes?.trim() || null,
      initialStaff: body.initialStaff ?? undefined,
      initialServices:
        body.initialServices && body.initialServices.length > 0 ? body.initialServices : undefined,
    }),
  });
  return mapClinicRow(created);
}

export async function apiAdminSetSuspended(token: string, clinicId: string, value: boolean): Promise<ClinicRow> {
  if (USE_MOCK_API) {
    await delay(120);
    const row = ADMIN_TENANTS.find((t) => t.id === clinicId);
    if (row) row.tenantSuspended = value;
    return mapClinicRow(row ?? ADMIN_TENANTS[0]);
  }
  const q = new URLSearchParams({ value: String(value) });
  const data = await requestJson<unknown>(`/admin/tenants/${clinicId}/suspended?${q}`, {
    method: "PATCH",
    token,
  });
  return mapClinicRow(data);
}

export async function apiCustomerAppointments(token: string): Promise<unknown[]> {
  if (USE_MOCK_API) {
    await delay(100);
    return CUSTOMER_APPOINTMENTS as unknown[];
  }
  return requestJson<unknown[]>("/me/appointments", { method: "GET", token });
}

export type ClinicPublicSummary = {
  id: string;
  businessName: string;
  slug: string;
  businessType: string;
  address: string | null;
  city: string | null;
  country: string | null;
  state: string | null;
  village: string | null;
  displayLocation: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function apiDiscoverClinics(params: {
  country?: string;
  state?: string;
  city?: string;
  village?: string;
  q?: string;
}): Promise<ClinicPublicSummary[]> {
  if (USE_MOCK_API) {
    await delay(80);
    return [];
  }
  const q = new URLSearchParams();
  if (params.country) q.set("country", params.country);
  if (params.state) q.set("state", params.state);
  if (params.city) q.set("city", params.city);
  if (params.village) q.set("village", params.village);
  if (params.q) q.set("q", params.q);
  const qs = q.toString();
  const rows = await requestJson<unknown[]>(`/public/clinics/search${qs ? `?${qs}` : ""}`, { method: "GET" });
  return rows.map((r) => {
    const x = r as Record<string, unknown>;
    return {
      id: String(x.id),
      businessName: String(x.businessName),
      slug: String(x.slug),
      businessType: String(x.businessType),
      address: x.address != null ? String(x.address) : null,
      city: x.city != null ? String(x.city) : null,
      country: x.country != null ? String(x.country) : null,
      state: x.state != null ? String(x.state) : null,
      village: x.village != null ? String(x.village) : null,
      displayLocation: x.displayLocation != null ? String(x.displayLocation) : null,
      latitude: x.latitude != null && x.latitude !== "" ? Number(x.latitude) : null,
      longitude: x.longitude != null && x.longitude !== "" ? Number(x.longitude) : null,
    };
  });
}

export type BeautyCoachChatResult = { reply: string; offline?: boolean };

/** Calls the server-side LLM proxy (OpenAI-compatible). Keys never leave the backend. */
export async function apiBeautyCoachChat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<BeautyCoachChatResult> {
  if (USE_MOCK_API) {
    await delay(600);
    return { reply: localFallbackReply(message), offline: true };
  }
  try {
    return await requestJson<BeautyCoachChatResult>("/beauty-coach/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    });
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 503) {
      return { reply: localFallbackReply(message), offline: true };
    }
    throw e;
  }
}

export { ApiError };
