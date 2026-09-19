"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  descendantIds,
  type AdminCategoryOption,
  type AdminCategoryRow,
  type CategoryDraft,
  type CategoryStatus,
} from "@/lib/api-client/admin-categories"

export type CategoryFormValues = CategoryDraft

export type CategoryFormState = { mode: "add" } | { mode: "edit"; category: AdminCategoryRow }

export type CategorySaveOutcome =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export type CategoryFormDialogProps = {
  state: CategoryFormState | null
  /** Every non-deleted category — the parent picker's choices. */
  options: AdminCategoryOption[]
  onClose: () => void
  onSave: (values: CategoryFormValues, state: CategoryFormState) => Promise<CategorySaveOutcome>
}

type FormErrors = Record<string, string>

const NO_PARENT = "none"

/** Add/Edit Category form — same fields render for both, keyed by the caller so state resets per category. */
function CategoryForm({
  state,
  options,
  onCancel,
  onSave,
}: {
  state: CategoryFormState
  options: AdminCategoryOption[]
  onCancel: () => void
  onSave: CategoryFormDialogProps["onSave"]
}) {
  const initial = state.mode === "edit" ? state.category : null

  const [name, setName] = React.useState(initial?.name ?? "")
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [image, setImage] = React.useState(initial?.image ?? "")
  const [status, setStatus] = React.useState<CategoryStatus>(initial?.status ?? "active")
  const [parentId, setParentId] = React.useState<string>(initial?.parentCategoryId ?? NO_PARENT)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // A category can't be its own parent, or sit under one of its own descendants (that would be a cycle).
  const parentChoices = React.useMemo(() => {
    const excluded = initial ? new Set([initial._id, ...descendantIds(initial._id, options)]) : new Set<string>()
    return [
      { value: NO_PARENT, label: "None (top-level category)" },
      ...options.filter((option) => !excluded.has(option._id)).map((option) => ({ value: option._id, label: option.name })),
    ]
  }, [initial, options])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: FormErrors = {}
    if (!name.trim()) nextErrors.name = "Category name is required."
    if (!description.trim()) nextErrors.description = "Description is required."
    if (image.trim() && !/^(https?:\/\/|\/)/i.test(image.trim())) nextErrors.image = "Use an http(s) URL or a site path."
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      const outcome = await onSave(
        {
          name: name.trim(),
          description: description.trim(),
          image: image.trim(),
          status,
          parentCategoryId: parentId === NO_PARENT ? null : parentId,
        },
        state
      )
      if (!outcome.ok) {
        setFormError(outcome.message)
        setErrors(outcome.fieldErrors ?? {})
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{state.mode === "edit" ? "Edit Category" : "Add Category"}</DialogTitle>
        <DialogDescription>
          {state.mode === "edit"
            ? "Update how this category appears in the catalog."
            : "Create a new category to organize your BabyNest products."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4 pr-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-name">Category Name</Label>
          <Input
            id="category-name"
            placeholder="e.g. Nursery"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
          <FormError message={errors.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            placeholder="Short description shown to shoppers"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={Boolean(errors.description)}
          />
          <FormError message={errors.description} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-parent">Parent Category</Label>
          <Select value={parentId} items={parentChoices} onValueChange={(value) => setParentId(value ?? parentId)}>
            <SelectTrigger id="category-parent" className="w-full rounded-lg" aria-invalid={Boolean(errors.parentCategoryId)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parentChoices.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {choice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormError message={errors.parentCategoryId} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-image">Category Image URL</Label>
          <Input
            id="category-image"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
            aria-invalid={Boolean(errors.image)}
          />
          <FormError message={errors.image} />
          <p className="text-caption text-muted-foreground">Optional — leave blank to use a placeholder.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-status">Status</Label>
          <Select
            value={status}
            items={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            onValueChange={(value) => setStatus((value as CategoryStatus) ?? status)}
          >
            <SelectTrigger id="category-status" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormError message={formError} className="mb-2" />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Category"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Add/Edit Category dialog — reuses the project's existing Dialog primitive, no duplicate modal system. */
function CategoryFormDialog({ state, options, onClose, onSave }: CategoryFormDialogProps) {
  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {state ? (
          <CategoryForm
            key={state.mode === "edit" ? state.category._id : "add"}
            state={state}
            options={options}
            onCancel={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { CategoryFormDialog }
