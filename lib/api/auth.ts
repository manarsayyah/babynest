import { auth } from "@/auth"
import { forbidden, unauthorized } from "@/lib/api/response"
import type { NextResponse } from "next/server"
import type { Session } from "next-auth"

type AuthResult = { session: Session; error: null } | { session: null; error: NextResponse }

/** Requires a signed-in user. Role comes only from the server-issued session — never from the request body/params. */
export async function requireUser(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) return { session: null, error: unauthorized() }
  return { session, error: null }
}

/** Requires a signed-in user with role "admin", read from the session, never from client input. */
export async function requireAdmin(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) return { session: null, error: unauthorized() }
  if (session.user.role !== "admin") return { session: null, error: forbidden() }
  return { session, error: null }
}
