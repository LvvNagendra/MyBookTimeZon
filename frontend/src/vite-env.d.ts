/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the Java API (e.g. https://api.example.com). Used when replacing mock client. */
  readonly VITE_API_BASE_URL?: string;
  /** When `"true"`, `api/client` uses local dummy data instead of `/api/v1` (no backend required). */
  readonly VITE_USE_MOCK?: string;
  /** Google Cloud API key with "Maps Embed API" enabled (optional; improves iframe reliability). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
