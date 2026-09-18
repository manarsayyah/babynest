"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/** Global toast host, styled with our tokens. Mounted once in the root layout. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="bottom-right"
      style={
        {
          "--normal-bg": "var(--color-card)",
          "--normal-text": "var(--color-foreground)",
          "--normal-border": "var(--color-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
