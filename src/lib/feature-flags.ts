/**
 * Feature flags for Jomble App.
 * Allows toggling compute-heavy or companion services (like the FastAPI CV Tailor engine)
 * between local development and production deployments.
 */

export function isCvTailorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CV_TAILOR !== "false"
}
