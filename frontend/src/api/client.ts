const TOKEN_KEY = "mbtz_token";

export type ApiEnvelope<T> = {
  /** Mirrors Spring HttpStatus in JSON (typically enum name, e.g. OK). */
  status: string;
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

const jsonHeaders = { "Content-Type": "application/json" };

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export type ProfileData = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  clinic: {
    id: string;
    businessName: string;
    slug: string;
  } | null;
};

export async function apiMe(token: string) {
  const res = await fetch("/api/v1/auth/me", {
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
  const env = await parseEnvelope<ProfileData>(res);
  return env.data;
}

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new Error(body.responseMessage ?? res.statusText);
  }
  return body;
}

export async function apiLogin(payload: { email: string; password: string }) {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const env = await parseEnvelope<AuthData>(res);
  return { ...env.data, responseMessage: env.responseMessage };
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  slug: string;
}) {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const env = await parseEnvelope<AuthData>(res);
  return { ...env.data, responseMessage: env.responseMessage };
}
