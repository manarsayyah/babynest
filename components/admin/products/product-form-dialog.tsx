"use client"

import * as React from "react"
import { Plus, TriangleAlert, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/ui/form-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  draftFromDetail,
  emptyProductDraft,
  fetchAdminProductDetail,
  fetchAllTags,
  type AdminProductRow,
  type ImageDraft,
  type ProductDraft,
  type VariantDraft,
} from "@/lib/api-client/admin-products"
import type { ApiTag, ProductDetailResponse } from "@/lib/api-client/types"
import { slugify } from "@/lib/api/slugify"

export type ProductFormState = { mode: "add" } | { mode: "edit"; product: AdminProductRow }

export type ProductSaveOutcome =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export type ProductFormDialogProps = {
  state: ProductFormState | null
  categoryOptions: { value: string; label: string }[]
  onClose: () => void
  /** Runs the real create/update requests. `original` is the product as MongoDB currently holds it (edit mode only). */
  onSave: (
    draft: ProductDraft,
    state: ProductFormState,
    original: ProductDetailResponse | null
  ) => Promise<ProductSaveOutcome>
}

type Errors = Record<string, string>

const emptyVariant: VariantDraft = { sku: "", variantName: "", color: "", size: "", priceDelta: "0", stockQty: "0" }
const emptyImage: ImageDraft = { imageUrl: "", altText: "", isPrimary: false }

function isNonNegativeNumber(value: string) {
  const trimmed = value.trim()
  return trimmed !== "" && Number.isFinite(Number(trimmed)) && Number(trimmed) >= 0
}

function isNonNegativeInteger(value: string) {
  return isNonNegativeNumber(value) && Number.isInteger(Number(value))
}

function validate(draft: ProductDraft): Errors {
  const errors: Errors = {}
  if (!draft.name.trim()) errors.name = "Product name is required."
  if (!draft.slug.trim()) errors.slug = "Slug is required."
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) {
    errors.slug = "Use only lowercase letters, numbers, and hyphens."
  }
  if (!draft.categoryId) errors.categoryId = "Choose a category."
  if (!isNonNegativeNumber(draft.price)) errors.price = "Enter a price of 0 or more."
  if (draft.stock.trim() !== "" && !isNonNegativeInteger(draft.stock)) errors.stock = "Stock must be a whole number."

  draft.variants.forEach((variant, index) => {
    if (variant.priceDelta.trim() !== "" && !Number.isFinite(Number(variant.priceDelta))) {
      errors[`variants.${index}`] = "Price adjustment must be a number."
    } else if (variant.stockQty.trim() !== "" && !isNonNegativeInteger(variant.stockQty)) {
      errors[`variants.${index}`] = "Variant stock must be a whole number."
    }
  })
  draft.images.forEach((image, index) => {
    if (!image.imageUrl.trim()) errors[`images.${index}`] = "Image URL is required."
  })

  return errors
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className ? `flex flex-col gap-1.5 ${className}` : "flex flex-col gap-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FormError message={error} />
    </div>
  )
}

function ProductForm({
  state,
  initialDraft,
  original,
  tags,
  categoryOptions,
  onCancel,
  onSave,
}: {
  state: ProductFormState
  initialDraft: ProductDraft
  original: ProductDetailResponse | null
  tags: ApiTag[]
  categoryOptions: { value: string; label: string }[]
  onCancel: () => void
  onSave: ProductFormDialogProps["onSave"]
}) {
  const [draft, setDraft] = React.useState<ProductDraft>(initialDraft)
  const [errors, setErrors] = React.useState<Errors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  // A new product's slug follows its name until the admin edits the slug by hand; an existing slug is never rewritten.
  const [slugTouched, setSlugTouched] = React.useState(state.mode === "edit")

  function update<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }))
  }

  function updateImage(index: number, patch: Partial<ImageDraft>) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((image, i) => (i === index ? { ...image, ...patch } : image)),
    }))
  }

  function setPrimaryImage(index: number) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((image, i) => ({ ...image, isPrimary: i === index })),
    }))
  }

  function toggleTag(tagId: string, checked: boolean) {
    setDraft((prev) => ({
      ...prev,
      tagIds: checked ? [...prev.tagIds, tagId] : prev.tagIds.filter((id) => id !== tagId),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors = validate(draft)
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      const outcome = await onSave(draft, state, original)
      if (!outcome.ok) {
        setFormError(outcome.message)
        setErrors(outcome.fieldErrors ?? {})
      }
    } finally {
      setIsSaving(false)
    }
  }

  const isEdit = state.mode === "edit"

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update this product's details, variants, images, and tags."
            : "Add a new product to your BabyNest catalog."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4 pr-1">
        <Field id="product-name" label="Product Name" error={errors.name}>
          <Input
            id="product-name"
            placeholder="e.g. Organic Cotton Onesie"
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value
              setDraft((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }))
            }}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field id="product-slug" label="Slug" error={errors.slug}>
          <Input
            id="product-slug"
            placeholder="organic-cotton-onesie"
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true)
              update("slug", e.target.value)
            }}
            aria-invalid={Boolean(errors.slug)}
          />
          {isEdit ? (
            <p className="text-caption text-muted-foreground">Changing the slug changes the product&apos;s store URL.</p>
          ) : null}
        </Field>

        <Field id="product-description" label="Description" error={errors.description}>
          <Textarea
            id="product-description"
            placeholder="Short description shown to shoppers"
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="product-brand" label="Brand" error={errors.brand}>
            <Input id="product-brand" value={draft.brand} onChange={(e) => update("brand", e.target.value)} />
          </Field>
          <Field id="product-material" label="Material" error={errors.material}>
            <Input id="product-material" value={draft.material} onChange={(e) => update("material", e.target.value)} />
          </Field>
          <Field id="product-age-group" label="Age Group" error={errors.ageGroup}>
            <Input
              id="product-age-group"
              placeholder="e.g. 0-6m"
              value={draft.ageGroup}
              onChange={(e) => update("ageGroup", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="product-category" label="Category" error={errors.categoryId}>
            <Select
              value={draft.categoryId || null}
              items={categoryOptions}
              onValueChange={(value) => update("categoryId", value ?? draft.categoryId)}
            >
              <SelectTrigger id="product-category" className="w-full rounded-lg" aria-invalid={Boolean(errors.categoryId)}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="product-price" label="Price (USD)" error={errors.price}>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={draft.price}
              onChange={(e) => update("price", e.target.value)}
              aria-invalid={Boolean(errors.price)}
            />
          </Field>
          <Field id="product-stock" label="Stock Quantity" error={errors.stock}>
            <Input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={draft.stock}
              onChange={(e) => update("stock", e.target.value)}
              aria-invalid={Boolean(errors.stock)}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
          <span className="flex flex-col">
            <span className="text-small font-medium text-foreground">Active</span>
            <span className="text-caption text-muted-foreground">
              Inactive products are hidden from the store but stay in your catalog.
            </span>
          </span>
          <Switch checked={draft.isActive} onCheckedChange={(checked) => update("isActive", checked)} />
        </label>

        <Separator />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 text-foreground">Variants</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update("variants", [...draft.variants, { ...emptyVariant }])}
            >
              <Plus data-icon="inline-start" />
              Add Variant
            </Button>
          </div>
          {draft.variants.length === 0 ? (
            <p className="text-small text-muted-foreground">No variants. Add one for each color/size combination.</p>
          ) : null}
          {draft.variants.map((variant, index) => (
            <div key={variant.id ?? `new-${index}`} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Input
                  aria-label={`Variant ${index + 1} SKU`}
                  placeholder="SKU"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                />
                <Input
                  aria-label={`Variant ${index + 1} name`}
                  placeholder="Name (e.g. Red / Large)"
                  value={variant.variantName}
                  onChange={(e) => updateVariant(index, { variantName: e.target.value })}
                />
                <Input
                  aria-label={`Variant ${index + 1} color`}
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) => updateVariant(index, { color: e.target.value })}
                />
                <Input
                  aria-label={`Variant ${index + 1} size`}
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, { size: e.target.value })}
                />
                <Input
                  aria-label={`Variant ${index + 1} price adjustment`}
                  type="number"
                  step="0.01"
                  placeholder="Price adjustment"
                  value={variant.priceDelta}
                  onChange={(e) => updateVariant(index, { priceDelta: e.target.value })}
                />
                <Input
                  aria-label={`Variant ${index + 1} stock`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stock"
                  value={variant.stockQty}
                  onChange={(e) => updateVariant(index, { stockQty: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <FormError message={errors[`variants.${index}`]} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-muted-foreground"
                  onClick={() => update("variants", draft.variants.filter((_, i) => i !== index))}
                >
                  <X data-icon="inline-start" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 text-foreground">Images</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update("images", [...draft.images, { ...emptyImage }])}
            >
              <Plus data-icon="inline-start" />
              Add Image
            </Button>
          </div>
          {draft.images.length === 0 ? (
            <p className="text-small text-muted-foreground">No images yet. Add an image URL to show this product.</p>
          ) : null}
          {draft.images.map((image, index) => (
            <div key={image.id ?? `new-${index}`} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  aria-label={`Image ${index + 1} URL`}
                  placeholder="https://..."
                  value={image.imageUrl}
                  onChange={(e) => updateImage(index, { imageUrl: e.target.value })}
                  aria-invalid={Boolean(errors[`images.${index}`])}
                />
                <Input
                  aria-label={`Image ${index + 1} alt text`}
                  placeholder="Alt text (optional)"
                  value={image.altText}
                  onChange={(e) => updateImage(index, { altText: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <FormError message={errors[`images.${index}`]} />
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    variant={image.isPrimary ? "secondary" : "ghost"}
                    size="sm"
                    aria-pressed={image.isPrimary}
                    onClick={() => setPrimaryImage(index)}
                  >
                    {image.isPrimary ? "Primary image" : "Make primary"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => update("images", draft.images.filter((_, i) => i !== index))}
                  >
                    <X data-icon="inline-start" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h3 className="text-h4 text-foreground">Tags</h3>
          {tags.length === 0 ? (
            <p className="text-small text-muted-foreground">No tags exist yet.</p>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {tags.map((tag) => (
                <label key={tag._id} className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={draft.tagIds.includes(tag._id)}
                    onCheckedChange={(checked) => toggleTag(tag._id, checked === true)}
                  />
                  <span className="text-small text-foreground">{tag.name}</span>
                </label>
              ))}
            </div>
          )}
        </section>
      </div>

      <FormError message={formError} className="mb-2" />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Loads what the form needs (all tags, plus the product's real variants/images/tags
 * when editing) before rendering it, with a skeleton while loading and a retry on error.
 */
function ProductFormLoader({
  state,
  categoryOptions,
  onCancel,
  onSave,
}: {
  state: ProductFormState
  categoryOptions: { value: string; label: string }[]
  onCancel: () => void
  onSave: ProductFormDialogProps["onSave"]
}) {
  type Loaded = { tags: ApiTag[]; detail: ProductDetailResponse | null }
  const [loaded, setLoaded] = React.useState<Loaded | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const editId = state.mode === "edit" ? state.product._id : null

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [tags, detail] = await Promise.all([
          fetchAllTags(),
          editId ? fetchAdminProductDetail(editId) : Promise.resolve(null),
        ])
        if (cancelled) return
        setLoaded({ tags, detail })
        setLoadError(null)
      } catch (err) {
        if (cancelled) return
        setLoaded(null)
        setLoadError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [editId, reloadToken])

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <DialogHeader className="sr-only">
          <DialogTitle>Couldn&apos;t load product</DialogTitle>
          <DialogDescription>{loadError}</DialogDescription>
        </DialogHeader>
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TriangleAlert className="size-5" />
        </span>
        <p className="text-small text-muted-foreground">{loadError}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
          <Button variant="outline" onClick={() => { setLoadError(null); setReloadToken((n) => n + 1) }}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <DialogHeader>
          <DialogTitle>{state.mode === "edit" ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>Loading product details...</DialogDescription>
        </DialogHeader>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <ProductForm
      state={state}
      initialDraft={loaded.detail ? draftFromDetail(loaded.detail) : emptyProductDraft}
      original={loaded.detail}
      tags={loaded.tags}
      categoryOptions={categoryOptions}
      onCancel={onCancel}
      onSave={onSave}
    />
  )
}

/** Add/Edit Product dialog — reuses the project's existing Dialog primitive, no duplicate modal system. */
function ProductFormDialog({ state, categoryOptions, onClose, onSave }: ProductFormDialogProps) {
  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {state ? (
          <ProductFormLoader
            key={state.mode === "edit" ? state.product._id : "add"}
            state={state}
            categoryOptions={categoryOptions}
            onCancel={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { ProductFormDialog }
