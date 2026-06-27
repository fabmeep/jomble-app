export { auth as proxy } from "@/auth"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/api/applications/:path*",
    "/applications",
    "/applications/:path*",
  ],
}