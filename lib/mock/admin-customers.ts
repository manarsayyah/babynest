/**
 * Admin customer directory. Self-contained mock dataset, isolated here so
 * it's a one-file swap once a real `/api/admin/customers` endpoint exists —
 * distinct from `lib/mock/account.ts` (the logged-in shopper's own profile).
 */
export type CustomerStatus = "active" | "inactive"

export type AdminCustomer = {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  addressLine: string
  city: string
  ordersCount: number
  totalSpent: number
  /** ISO date of the customer's most recent order, or null if they've never ordered. */
  lastOrderDate: string | null
  status: CustomerStatus
  /** ISO date the account was created. */
  joinedDate: string
}

function avatarFor(name: string, tone: "rose" | "lavender" | "sage" | "beige" = "rose") {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const palette: Record<typeof tone, string> = {
    rose: "FCE4E8/DB5E76",
    lavender: "F1EEFC/7C6AE8",
    sage: "E9F0E6/4C7A46",
    beige: "FBF3DE/C9971F",
  }
  return `https://placehold.co/80x80/${palette[tone]}?font=roboto&text=${initials}`
}

export const adminCustomers: AdminCustomer[] = [
  { id: "CUST-1001", name: "Sarah Miller", email: "sarah@example.com", phone: "+1 (555) 201-4471", avatar: avatarFor("Sarah Miller", "rose"), addressLine: "142 Willow Creek Rd", city: "Austin, TX", ordersCount: 8, totalSpent: 342.5, lastOrderDate: "2026-09-14", status: "active", joinedDate: "2025-11-02" },
  { id: "CUST-1002", name: "Emma Wilson", email: "emma@example.com", phone: "+1 (555) 340-9821", avatar: avatarFor("Emma Wilson", "lavender"), addressLine: "88 Maple Ave", city: "Denver, CO", ordersCount: 5, totalSpent: 218.0, lastOrderDate: "2026-09-14", status: "active", joinedDate: "2026-01-15" },
  { id: "CUST-1003", name: "Lina Carter", email: "lina@example.com", phone: "+1 (555) 118-2290", avatar: avatarFor("Lina Carter", "sage"), addressLine: "27 Harbor St", city: "Portland, OR", ordersCount: 2, totalSpent: 76.99, lastOrderDate: "2026-09-13", status: "active", joinedDate: "2026-08-25" },
  { id: "CUST-1004", name: "Omar Khalil", email: "omar@example.com", phone: "+1 (555) 902-3345", avatar: avatarFor("Omar Khalil", "beige"), addressLine: "5 Cedar Lane", city: "Chicago, IL", ordersCount: 6, totalSpent: 412.3, lastOrderDate: "2026-09-13", status: "active", joinedDate: "2025-09-10" },
  { id: "CUST-1005", name: "Nour Fares", email: "nour@example.com", phone: "+1 (555) 774-6612", avatar: avatarFor("Nour Fares", "rose"), addressLine: "310 Birchwood Dr", city: "Seattle, WA", ordersCount: 3, totalSpent: 189.97, lastOrderDate: "2026-09-12", status: "active", joinedDate: "2026-03-05" },
  { id: "CUST-1006", name: "Manar Sayyah", email: "manar@example.com", phone: "+1 (555) 223-8890", avatar: avatarFor("Manar Sayyah", "lavender"), addressLine: "123 Main Street", city: "Beirut, Lebanon", ordersCount: 4, totalSpent: 156.96, lastOrderDate: "2026-09-12", status: "active", joinedDate: "2025-12-20" },
  { id: "CUST-1007", name: "Rami Saad", email: "rami@example.com", phone: "+1 (555) 665-1129", avatar: avatarFor("Rami Saad", "sage"), addressLine: "76 Fieldstone Ct", city: "Miami, FL", ordersCount: 1, totalSpent: 189.99, lastOrderDate: "2026-09-11", status: "inactive", joinedDate: "2026-02-14" },
  { id: "CUST-1008", name: "Layla Haddad", email: "layla@example.com", phone: "+1 (555) 489-7723", avatar: avatarFor("Layla Haddad", "beige"), addressLine: "19 Sunrise Blvd", city: "San Diego, CA", ordersCount: 7, totalSpent: 298.45, lastOrderDate: "2026-09-11", status: "active", joinedDate: "2025-10-08" },
  { id: "CUST-1009", name: "Yousef Nassar", email: "yousef@example.com", phone: "+1 (555) 551-3067", avatar: avatarFor("Yousef Nassar", "rose"), addressLine: "402 Elm St", city: "Boston, MA", ordersCount: 1, totalSpent: 58.0, lastOrderDate: "2026-09-10", status: "inactive", joinedDate: "2026-09-01" },
  { id: "CUST-1010", name: "Dana Aziz", email: "dana@example.com", phone: "+1 (555) 877-2201", avatar: avatarFor("Dana Aziz", "lavender"), addressLine: "58 Lakeside Dr", city: "Phoenix, AZ", ordersCount: 2, totalSpent: 84.0, lastOrderDate: "2026-09-10", status: "active", joinedDate: "2026-06-18" },
  { id: "CUST-1011", name: "Hana Odeh", email: "hana@example.com", phone: "+1 (555) 332-9081", avatar: avatarFor("Hana Odeh", "sage"), addressLine: "230 Ridgeview Rd", city: "Nashville, TN", ordersCount: 9, totalSpent: 521.75, lastOrderDate: "2026-09-09", status: "active", joinedDate: "2025-08-22" },
  { id: "CUST-1012", name: "Karim Mansour", email: "karim@example.com", phone: "+1 (555) 118-6654", avatar: avatarFor("Karim Mansour", "beige"), addressLine: "14 Orchard Ln", city: "Raleigh, NC", ordersCount: 1, totalSpent: 18.5, lastOrderDate: "2026-09-08", status: "inactive", joinedDate: "2026-08-30" },
  { id: "CUST-1013", name: "Farah Zidan", email: "farah@example.com", phone: "+1 (555) 774-3312", avatar: avatarFor("Farah Zidan", "rose"), addressLine: "63 Meadowbrook Ave", city: "Columbus, OH", ordersCount: 2, totalSpent: 79.96, lastOrderDate: "2026-09-08", status: "active", joinedDate: "2026-04-11" },
  { id: "CUST-1014", name: "Adam Haddad", email: "adam@example.com", phone: "+1 (555) 990-4478", avatar: avatarFor("Adam Haddad", "lavender"), addressLine: "9 Hillcrest Way", city: "Charlotte, NC", ordersCount: 3, totalSpent: 212.94, lastOrderDate: "2026-09-07", status: "active", joinedDate: "2025-07-19" },
  { id: "CUST-1015", name: "Maya Kassab", email: "maya@example.com", phone: "+1 (555) 556-2290", avatar: avatarFor("Maya Kassab", "sage"), addressLine: "271 Brookline Ave", city: "Atlanta, GA", ordersCount: 1, totalSpent: 26.0, lastOrderDate: "2026-09-06", status: "inactive", joinedDate: "2026-01-29" },
  { id: "CUST-1016", name: "Tariq Amin", email: "tariq@example.com", phone: "+1 (555) 663-1145", avatar: avatarFor("Tariq Amin", "beige"), addressLine: "84 Stonegate Dr", city: "Dallas, TX", ordersCount: 2, totalSpent: 129.96, lastOrderDate: "2026-09-05", status: "inactive", joinedDate: "2025-05-14" },
  { id: "CUST-1017", name: "Salma Rahal", email: "salma@example.com", phone: "+1 (555) 227-8834", avatar: avatarFor("Salma Rahal", "rose"), addressLine: "37 Pinecrest Cir", city: "Minneapolis, MN", ordersCount: 5, totalSpent: 358.0, lastOrderDate: "2026-09-05", status: "active", joinedDate: "2025-11-27" },
  { id: "CUST-1018", name: "Nadia Farouk", email: "nadia@example.com", phone: "+1 (555) 445-9012", avatar: avatarFor("Nadia Farouk", "lavender"), addressLine: "12 Aspen Ct", city: "Salt Lake City, UT", ordersCount: 1, totalSpent: 21.99, lastOrderDate: "2026-09-04", status: "active", joinedDate: "2026-08-20" },
  { id: "CUST-1019", name: "Zaid Homsi", email: "zaid@example.com", phone: "+1 (555) 809-2276", avatar: avatarFor("Zaid Homsi", "sage"), addressLine: "146 Riverside Dr", city: "Sacramento, CA", ordersCount: 3, totalSpent: 147.98, lastOrderDate: "2026-09-03", status: "active", joinedDate: "2026-02-02" },
  { id: "CUST-1020", name: "Rania Saleh", email: "rania@example.com", phone: "+1 (555) 302-6641", avatar: avatarFor("Rania Saleh", "beige"), addressLine: "51 Sycamore St", city: "Kansas City, MO", ordersCount: 1, totalSpent: 34.99, lastOrderDate: "2026-09-02", status: "inactive", joinedDate: "2026-03-16" },
  { id: "CUST-1021", name: "Bilal Nasser", email: "bilal@example.com", phone: "+1 (555) 667-9923", avatar: avatarFor("Bilal Nasser", "rose"), addressLine: "298 Highland Ave", city: "Tampa, FL", ordersCount: 6, totalSpent: 296.97, lastOrderDate: "2026-09-01", status: "active", joinedDate: "2025-06-09" },
  { id: "CUST-1022", name: "Yasmin Toubasi", email: "yasmin@example.com", phone: "+1 (555) 154-7789", avatar: avatarFor("Yasmin Toubasi", "lavender"), addressLine: "70 Autumn Ridge Rd", city: "Orlando, FL", ordersCount: 4, totalSpent: 178.0, lastOrderDate: "2026-08-31", status: "active", joinedDate: "2026-07-30" },
]

const NEW_CUSTOMER_WINDOW_DAYS = 30

/** Joined within the last 30 days of `referenceDate` (defaults to now). */
export function isNewCustomer(customer: AdminCustomer, referenceDate: Date = new Date()) {
  const joined = new Date(customer.joinedDate)
  const cutoff = new Date(referenceDate)
  cutoff.setDate(cutoff.getDate() - NEW_CUSTOMER_WINDOW_DAYS)
  return joined >= cutoff
}

/** A repeat shopper — placed more than one order. */
export function isReturningCustomer(customer: AdminCustomer) {
  return customer.ordersCount > 1
}

export function formatCustomerDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
