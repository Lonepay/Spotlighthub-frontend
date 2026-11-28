'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Product, naira, num } from '@/lib/shop';
import { ProductCartEntry } from '@/lib/cart';

/** Builds the cart line for a product; `vendor` must carry its handover options. */
export function productCartEntry(
  product: Product,
  vendor: NonNullable<Product['vendor']>,
  quantity: number
): ProductCartEntry {
  return {
    type: 'product',
    product: {
      id: product.id,
      name: product.name,
      price: num(product.price),
      image: product.images?.[0] ?? null,
      stock: product.stock,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      offers_pickup: vendor.offers_pickup ?? true,
      pickup_address: vendor.pickup_address ?? null,
      offers_delivery: vendor.offers_delivery ?? false,
      delivery_fee: num(vendor.delivery_fee),
      delivery_note: vendor.delivery_note ?? null,
    },
    quantity,
  };
}

export function ProductCard({ product, showVendor = true }: { product: Product; showVendor?: boolean }) {
  const cover = product.image_urls?.[0];
  const was = num(product.compare_at_price);

  return (
    <Link href={`/shop/${product.id}`} className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
      <div className="relative aspect-square bg-muted">
        {cover ? (
          <Image src={cover} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-[1.02] transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-muted-foreground" /></div>
        )}
        {!product.in_stock && (
          <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">Sold out</span>
        )}
        {was > num(product.price) && product.in_stock && (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            -{Math.round((1 - num(product.price) / was) * 100)}%
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold">{naira(product.price)}</span>
          {was > num(product.price) && <span className="text-xs text-muted-foreground line-through">{naira(was)}</span>}
        </div>
        {showVendor && product.vendor && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            {product.vendor.name} {product.vendor.is_verified && <VerifiedBadge size="sm" />}
          </p>
        )}
      </div>
    </Link>
  );
}
