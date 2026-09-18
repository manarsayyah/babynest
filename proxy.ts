import { NextResponse } from "next/server"
import { auth } from "@/auth"

const ADMIN_PREFIX = "/admin"

// Every one of these is a path prefix — "/account" also protects "/account/settings",
// "/account/orders", etc. Listed explicitly to match the routes named in the spec.
const CUSTOMER_PREFIXES = [
  "/account",
  "/orders",
  "/personal-info",
  "/addresses",
  "/payment-methods",
  "/notifications",
  "/ai-preferences",
  "/wishlist",
]

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isAdminRoute = matchesPrefix(pathname, ADMIN_PREFIX)
  const isCustomerRoute = CUSTOMER_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))

  if (!session) {
    if (isAdminRoute || isCustomerRoute) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Role must come from the authenticated session (set server-side in auth.ts's
  // jwt/session callbacks) — never from anything the client sends.
  if (isAdminRoute && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/account/:path*",
    "/orders/:path*",
    "/personal-info/:path*",
    "/addresses/:path*",
    "/payment-methods/:path*",
    "/notifications/:path*",
    "/ai-preferences/:path*",
    "/wishlist/:path*",
    "/admin/:path*",
  ],
}
