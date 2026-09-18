import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: {
    template: "%s | BabyNest Admin",
    default: "BabyNest Admin",
  },
  description: "BabyNest admin portal.",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
