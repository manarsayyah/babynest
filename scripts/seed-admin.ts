/**
 * One-off admin account seed script.
 *
 * Usage: npm run seed:admin
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in the environment (e.g. .env.local).
 *
 * This is a manual setup tool: it is never imported by the app, exposed
 * through a page or API route, or run automatically on startup.
 */
import bcrypt from "bcryptjs"
import connectToDatabase from "../lib/db"
import User from "../models/User"

const SALT_ROUNDS = 12

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD.\n" +
        "Set both in .env.local, then run: npm run seed:admin"
    )
    process.exitCode = 1
    return
  }

  const mongoose = await connectToDatabase()

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS)
    const existing = await User.findOne({ email: adminEmail })

    if (existing) {
      existing.role = "admin"
      existing.password = hashedPassword
      await existing.save()
      console.log(`Admin account for ${adminEmail} updated (role "admin", password re-hashed).`)
      return
    }

    await User.create({
      firstName: "BabyNest",
      lastName: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    })

    console.log(`Admin account created for ${adminEmail}.`)
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error("Admin seed failed:", error)
  process.exitCode = 1
})
