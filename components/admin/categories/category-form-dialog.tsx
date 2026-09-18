"use client"

import * as React from "react"
import { toast } from "sonner"
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
import type { AdminCategory, CategoryStatus } from "@/lib/mock/admin-categories"

export type CategoryFormValues = {
  name: string
  description: string
  image: string
  status: CategoryStatus
}

export type CategoryFormState = { mode: "add" } | { mode: "edit"; category: AdminCategory }

export type CategoryFormDialogProps = {
  state: CategoryFormState | null
  onClose: () => void
  onSave: (values: CategoryFormValues, state: CategoryFormState) => void
}

type FormErrors = Partial<Record<"name" | "description", string>>

function placeholderImage(name: string) {
  const initials = name.trim() ? name.trim().slice(0, 2).toUpperCase() : "BN"
  return `https://placehold.co/200x200/FCEAE3/DB5E76?font=roboto&text=${encodeURIComponent(initials)}`
}

/** Add/Edit Category form — same fields render for both, keyed by the caller so state resets per category. */
function CategoryForm({
  state,
  onCancel,
  onSave,
}: {
  state: CategoryFormState
  onCancel: () => void
  onSave: (values: CategoryFormValues) => void
}) {
  const initial = state.mode === "edit" ? state.category : null

  const [name, setName] = React.useState(initial?.name ?? "")
  const [description, setDescription] = React.useState(initial?.description ?? "")
  const [image, setImage] = React.useState(initial?.image ?? "")
  const [status, setStatus] = React.useState<CategoryStatus>(initial?.status ?? "active")
  const [errors, setErrors] = React.useState<FormErrors>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: FormErrors = {}
    if (!name.trim()) nextErrors.name = "Category name is required."
    if (!description.trim()) nextErrors.description = "Description is required."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave({
      name: name.trim(),
      description: description.trim(),
      image: image.trim() || placeholderImage(name),
      status,
    })
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

      <div className="flex flex-col gap-4 py-4">
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
          <Label htmlFor="category-image">Category Image URL</Label>
          <Input
            id="category-image"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <p className="text-caption text-muted-foreground">Optional — leave blank to use a placeholder.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus((value as CategoryStatus) ?? status)}>
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

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Category</Button>
      </DialogFooter>
    </form>
  )
}

/** Add/Edit Category dialog — reuses the project's existing Dialog primitive, no duplicate modal system. */
function CategoryFormDialog({ state, onClose, onSave }: CategoryFormDialogProps) {
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
            key={state.mode === "edit" ? state.category.slug : "add"}
            state={state}
            onCancel={onClose}
            onSave={(values) => {
              onSave(values, state)
              toast.success(state.mode === "edit" ? "Category updated" : "Category added", {
                description: `${values.name} has been saved.`,
              })
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { CategoryFormDialog }
