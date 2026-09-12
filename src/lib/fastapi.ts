/**
 * Resolves the FastAPI backend base URL.
 * In Docker container networks, server-side Node code uses FASTAPI_INTERNAL_URL (e.g. http://api:8000).
 * Otherwise falls back to NEXT_PUBLIC_FASTAPI_URL or local default http://127.0.0.1:8000.
 */
export function getFastApiBaseUrl(): string {
  return (
    process.env.FASTAPI_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_FASTAPI_URL ||
    "http://127.0.0.1:8000"
  );
}
