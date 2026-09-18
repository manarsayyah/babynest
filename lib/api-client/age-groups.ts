/**
 * Maps the storefront's existing age-range filter buckets (lib/mock/filters.ts
 * ageBuckets — UI labels/keys only, not product data) to the ageGroup string
 * convention used on the real Product model (see the comment on
 * Product.ageGroup in models/Product.ts: e.g. "0-6m", "6-12m", "1-2y", "3+y").
 *
 * This is a best-effort convention, not an enforced schema — if products end
 * up seeded with different ageGroup strings, update this map to match.
 */
export const AGE_GROUP_VALUES_BY_BUCKET_KEY: Record<string, string[]> = {
  "0-6": ["0-6m"],
  "6-12": ["6-12m"],
  "1-2": ["1-2y"],
  "3+": ["3+y"],
}

export function ageGroupsForBucketKeys(bucketKeys: Iterable<string>): string[] {
  const values = new Set<string>()
  for (const key of bucketKeys) {
    for (const value of AGE_GROUP_VALUES_BY_BUCKET_KEY[key] ?? []) {
      values.add(value)
    }
  }
  return Array.from(values)
}
