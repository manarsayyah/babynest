import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import { registerSchema } from "@/lib/validation/register"

/**
 * Cost factor for bcrypt hashing. 12 is the commonly recommended baseline
 * for production password storage — strong enough to resist offline
 * brute-forcing while staying fast enough for a normal request.
 */
const SALT_ROUNDS = 12

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  )
}

/** POST /api/auth/register — creates a new customer account. Always assigns role "customer"; the client can never set a role. */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key] = issue.message
      }
    }
    return NextResponse.json(
      { error: "Please fix the highlighted fields.", fieldErrors },
      { status: 400 }
    )
  }

  const { firstName, lastName, email, password } = parsed.data

  try {
    await connectToDatabase()
  } catch (error) {
    console.error("Registration: database connection failed:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }

  try {
    const existing = await User.findOne({ email }).select("_id").lean()
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // role is always "customer" here — there is no field in `parsed.data` for
    // it (the schema doesn't accept one), and it's hardcoded below regardless
    // of anything the client sends, so a registration request can never
    // create an admin account.
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "customer",
    })

    return NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 }
    )
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
