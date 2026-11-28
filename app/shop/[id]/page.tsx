'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingBag, Store, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { productCartEntry } from '@/components/shop/ProductCard';
import { useCart } from '@/lib/cart';
import { shop, Product, naira, num } from '@/lib/shop';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addEntry } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    shop.product(Number(params.id))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen"><Navbar /><div className="pt-40 flex justify-center"><Loader size={32} /></div></div>
    );
  }

  if (!product || !product.vendor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-40 pb-20 text-center">
          <p className="text-muted-foreground mb-4">This product isn&apos;t available.</p>
          <Button asChild variant="outline"><Link href="/shop">Back to the shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const vendor = product.vendor;
  const maxQty = Math.min(product.stock ?? 100, 100);
  const was = num(product.compare_at_price);
  const images = product.image_urls ?? [];

  const add = (goToCart: boolean) => {
    addEntry(productCartEntry(product, vendor, qty));
    if (goToCart) {
      router.push('/cart');
    } else {
      toast.success(`${qty} × ${product.name} added to your cart`);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6">
          <Link href={`/vendors/${vendor.id}`}><ArrowLeft className="h-4 w-4" /> {vendor.name}</Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              {images[active] ? (
                <Image src={images[active]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-14 h-14 text-muted-foreground" /></div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button key={src} type="button" onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${i === active ? 'border-primary' : 'border-transparent'}`}>
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              {product.category && <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">{product.category}</div>}
              <h1 className="font-display font-bold text-3xl md:text-4xl mb-3">{product.name}</h1>
              <div className="flex items-baseline gap-3">
                <span className="font-display font-bold text-3xl">{naira(product.price)}</span>
                {was > num(product.price) && <span className="text-muted-foreground line-through">{naira(was)}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {!product.in_stock ? 'Sold out' : product.stock !== null && product.stock <= 10 ? `Only ${product.stock} left` : 'In stock'}
              </p>
            </div>

            {product.in_stock && (
              <div className="space-y-3">
                <div className="inline-flex items-center border border-border rounded-lg">
                  <button type="button" aria-label="Fewer" className="p-2.5 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center tabular-nums">{qty}</span>
                  <button type="button" aria-label="More" className="p-2.5 disabled:opacity-40" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)}><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="hero" size="lg" className="flex-1" onClick={() => add(true)}>Buy now</Button>
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => add(false)}>Add to cart</Button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border p-4 space-y-3 text-sm">
              <Link href={`/vendors/${vendor.id}`} className="font-medium flex items-center gap-2 hover:underline">
                <Store className="w-4 h-4" /> {vendor.name} {vendor.is_verified && <VerifiedBadge size="sm" />}
              </Link>
              {vendor.offers_pickup && (
                <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> Free pickup{vendor.pickup_address ? `: ${vendor.pickup_address}` : ''}</p>
              )}
              {vendor.offers_delivery && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Truck className="w-4 h-4 mt-0.5 shrink-0" />
                  Delivery {num(vendor.delivery_fee) > 0 ? naira(vendor.delivery_fee ?? 0) : 'free'}{vendor.delivery_note ? ` · ${vendor.delivery_note}` : ''}
                </p>
              )}
              <p className="text-xs text-muted-foreground">You pay securely on Spotlight; the vendor is paid once your order is delivered.</p>
            </div>

            {product.description && <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
