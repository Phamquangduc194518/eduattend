/** BE production (Railway) — public URL, không phải secret. */
export const PRODUCTION_API_BASE = "https://diem-danh-hust.up.railway.app/api/v1";

/** BE local khi chạy `npm run dev` không có VITE_API_BASE_URL. */
export const LOCAL_API_BASE = "http://localhost:8080/api/v1";

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (import.meta.env.PROD) {
    return PRODUCTION_API_BASE;
  }
  return LOCAL_API_BASE;
}

export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v1$/i, "");
}
