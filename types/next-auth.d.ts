import type { DefaultSession } from "next-auth"

export type UserRole = "customer" | "admin"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      firstName: string
      lastName: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    firstName: string
    lastName: string
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName: string
    lastName: string
    role: UserRole
  }
}
