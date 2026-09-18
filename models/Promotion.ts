import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const promotionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"] as const,
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, required: true, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type PromotionDocument = InferSchemaType<typeof promotionSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Promotion` model once compiled".
const Promotion =
  (models.Promotion as Model<PromotionDocument>) ?? model<PromotionDocument>("Promotion", promotionSchema)

export default Promotion
