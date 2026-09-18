import { shopCatalog, type ShopProduct } from "@/lib/mock/shop-catalog"

/** Seed wishlist for the demo — drawn from the real shop catalog so product links/prices/images stay consistent site-wide. */
export function getInitialWishlistItems(): ShopProduct[] {
  const slugs = [
    "organic-cotton-onesie",
    "wooden-stacking-toy",
    "soft-plush-bear",
    "premium-baby-stroller",
    "starlight-nursery-mobile",
    "baby-monitor",
    "glass-baby-bottle-set",
    "silicone-bath-toys",
  ]

  return slugs
    .map((slug) => shopCatalog.find((product) => product.slug === slug))
    .filter((product): product is ShopProduct => Boolean(product))
}
