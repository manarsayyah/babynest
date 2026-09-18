import { Schema, model, models, type InferSchemaType, type Model } from "mongoose"

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    // Nullable self-reference for subcategories — a top-level category
    // leaves this unset.
    parentCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    image: { type: String, trim: true },
    /** Tailwind background class for the storefront's circular category tile. */
    tintClassName: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"] as const,
      required: true,
      default: "active",
    },
    // Soft-deleted rather than removed outright — products keep a valid
    // category reference even after an admin retires a category.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export type CategoryDocument = InferSchemaType<typeof categorySchema>

// Reuse the already-compiled model on hot reload instead of redefining it,
// which is what throws "Cannot overwrite `Category` model once compiled".
const Category =
  (models.Category as Model<CategoryDocument>) ?? model<CategoryDocument>("Category", categorySchema)

export default Category
