import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const aiSearchQuerySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    queryText: { type: String, required: true, trim: true },
    /** Arbitrary filter criteria applied alongside the query (category, price range, etc.). */
    filtersApplied: { type: Schema.Types.Mixed, default: {} },
    resultsCount: { type: Number, required: true, default: 0, min: 0 },
    searchedAt: { type: Date, required: true, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  // Tier 3: createdAt + deletedAt, no updatedAt — a logged query is never edited.
  { timestamps: { createdAt: true, updatedAt: false } }
)

export type AiSearchQueryDocument = InferSchemaType<typeof aiSearchQuerySchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `AiSearchQuery` model once compiled".
const AiSearchQuery =
  (models.AiSearchQuery as Model<AiSearchQueryDocument>) ??
  model<AiSearchQueryDocument>("AiSearchQuery", aiSearchQuerySchema)

export default AiSearchQuery
