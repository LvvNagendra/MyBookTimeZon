/**
 * REST helpers: unwraps Spring {@link ResponseMessage} JSON and maps HTTP errors to {@link ApiError}.
 * Dev: relative `/api/v1` → Vite proxy (`vite.config.ts` → backend :8090).
 * Prod: set `VITE_API_BASE_URL` (e.g. `https://api.example.com`) so requests go to the full API host.
 */

const API_PREFIX = import.meta.env.VITE_API_BASE_URL
  ? `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/api/v1`
  : "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope<T> = {
  status?: unknown;
  responseMessage?: string;
  data?: T;
};

function joinPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${p}`;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit & { token?: string | null; timeoutMs?: number },
): Promise<T> {
  const headers = new Headers(init?.headers);
  const body = init?.body;
  if (body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }
  const { token: _t, timeoutMs = 45_000, ...fetchInit } = init ?? {};
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(joinPath(path), { ...fetchInit, headers, body, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(408, "Request timed out. Check your connection and try again.");
    }
    throw e;
  } finally {
    window.clearTimeout(tid);
  }
  const text = await res.text();
  let parsed: Envelope<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as Envelope<T>;
    } catch {
      throw new ApiError(res.status, text || res.statusText);
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, parsed?.responseMessage ?? res.statusText);
  }
  if (parsed && Object.prototype.hasOwnProperty.call(parsed, "data")) {
    return parsed.data as T;
  }
  /* DELETE / some success envelopes omit `data` (e.g. ResponseMessage<Void>). */
  if (res.ok) {
    return undefined as T;
  }
  throw new ApiError(res.status, "Malformed API response (missing data)");
}
