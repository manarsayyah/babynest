import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const returnItemSchema = new Schema(
  {
    returnId: { type: Schema.Types.ObjectId, ref: "Return", required: true },
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    quantity: { type: Number, required: true, min: 1 },
    condition: { type: String, trim: true },
  },
  { timestamps: true }
)

export type ReturnItemDocument = InferSchemaType<typeof returnItemSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `ReturnItem` model once compiled".
const ReturnItem =
  (models.ReturnItem as Model<ReturnItemDocument>) ?? model<ReturnItemDocument>("ReturnItem", returnItemSchema)

export default ReturnItem
