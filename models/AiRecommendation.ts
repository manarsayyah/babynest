import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const aiRecommendationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    reason: { type: String, trim: true },
    score: { type: Number, min: 0 },
    generatedAt: { type: Date, required: true, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type AiRecommendationDocument = InferSchemaType<typeof aiRecommendationSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `AiRecommendation` model once compiled".
const AiRecommendation =
  (models.AiRecommendation as Model<AiRecommendationDocument>) ??
  model<AiRecommendationDocument>("AiRecommendation", aiRecommendationSchema)

export default AiRecommendation
