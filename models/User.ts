import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin"] as const,
      required: true,
      default: "customer",
    },
    // Soft-deleted rather than removed outright — Orders/Reviews/Addresses
    // keep a valid user reference even after an account is closed.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type UserDocument = InferSchemaType<typeof userSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `User` model once compiled".
const User = (models.User as Model<UserDocument>) ?? model<UserDocument>("User", userSchema)

export default User
