import * as React from "react"
import { cn } from "cn"

/**
 * Shared max-width + gutter wrapper. Every section in the app should be
 * built as <Container> so page width and side padding stay identical
 * everywhere instead of ad-hoc max-width and padding combinations per page.
 */
function Container({
  className,
  as: Comp = "div",
  ...props
}: React.ComponentProps<"div"> & { as?: React.ElementType }) {
  return (
    <Comp data-slot="container" className={cn("container-app", className)} {...props} />
  )
}

export { Container }
