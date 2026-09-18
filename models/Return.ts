import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const returnSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "completed"] as const,
      required: true,
      default: "requested",
    },
    requestedAt: { type: Date, required: true, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type ReturnDocument = InferSchemaType<typeof returnSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Return` model once compiled".
const Return = (models.Return as Model<ReturnDocument>) ?? model<ReturnDocument>("Return", returnSchema)

export default Return
