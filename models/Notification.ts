import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, required: true, default: false },
    sentAt: { type: Date, required: true, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type NotificationDocument = InferSchemaType<typeof notificationSchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Notification` model once compiled".
const Notification =
  (models.Notification as Model<NotificationDocument>) ??
  model<NotificationDocument>("Notification", notificationSchema)

export default Notification
