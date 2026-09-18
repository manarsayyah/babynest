export type SalesPeriod = "7d" | "30d" | "3m" | "1y"

export const salesPeriodOptions: { value: SalesPeriod; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "3m", label: "3 Months" },
  { value: "1y", label: "1 Year" },
]

export type SalesPoint = { label: string; value: number }

export const salesSeries: Record<SalesPeriod, SalesPoint[]> = {
  "7d": [
    { label: "Mon", value: 2650 },
    { label: "Tue", value: 3120 },
    { label: "Wed", value: 2890 },
    { label: "Thu", value: 3480 },
    { label: "Fri", value: 4260 },
    { label: "Sat", value: 5130 },
    { label: "Sun", value: 4720 },
  ],
  "30d": [
    { label: "W1", value: 15200 },
    { label: "W2", value: 17850 },
    { label: "W3", value: 16490 },
    { label: "W4", value: 21360 },
  ],
  "3m": [
    { label: "Jul", value: 58200 },
    { label: "Aug", value: 64500 },
    { label: "Sep", value: 71230 },
  ],
  "1y": [
    { label: "Oct", value: 38200 },
    { label: "Nov", value: 41500 },
    { label: "Dec", value: 52300 },
    { label: "Jan", value: 44100 },
    { label: "Feb", value: 46800 },
    { label: "Mar", value: 49250 },
    { label: "Apr", value: 51900 },
    { label: "May", value: 55400 },
    { label: "Jun", value: 58900 },
    { label: "Jul", value: 62100 },
    { label: "Aug", value: 67800 },
    { label: "Sep", value: 71230 },
  ],
}

export type TopProductPreview = {
  slug: string
  soldCount: number
  revenue: number
}

export const topProductsPreview: TopProductPreview[] = [
  { slug: "soft-plush-bear", soldCount: 124, revenue: 2234 },
  { slug: "organic-cotton-onesie", soldCount: 98, revenue: 1960 },
  { slug: "premium-baby-stroller", soldCount: 76, revenue: 15199 },
  { slug: "baby-monitor", soldCount: 65, revenue: 5849 },
]
