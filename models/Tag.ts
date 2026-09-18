import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

/** Reusable product attribute tags — e.g. "Organic", "BPA-Free", "Eco-Friendly". */
const tagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Soft-deleted rather than removed outright — products keep a valid
    // tag reference even after a tag is retired.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type TagDocument = InferSchemaType<typeof tagSchema>

const Tag = (models.Tag as Model<TagDocument>) ?? model<TagDocument>("Tag", tagSchema)

export default Tag
