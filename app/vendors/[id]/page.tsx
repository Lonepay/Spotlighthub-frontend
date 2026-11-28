'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ProductCard } from '@/components/shop/ProductCard';
import { vendors, Vendor } from '@/lib/vendors';
import { PortfolioItem, naira, num } from '@/lib/shop';
import { storageUrl } from '@/lib/storage';
import { Store, MapPin, Mail, Phone, Globe, Instagram, ShoppingBag, LayoutGrid, Info, Truck } from 'lucide-react';

type Tab = 'shop' | 'portfolio' | 'about';

/** A vendor's storefront: products to buy, past work, and how to reach them. */
export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = Number(params.id);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('shop');
  const [viewing, setViewing] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    vendors.getPublicOne(vendorId)
      .then((v) => {
        setVendor(v);
        // Open on whatever the vendor actually has.
        setTab(v.products?.length ? 'shop' : v.portfolio_items?.length ? 'portfolio' : 'about');
      })
      .catch((error) => console.error('Failed to load vendor:', error))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-24 animate-pulse space-y-6">
          <div className="h-56 bg-muted rounded-2xl" />
          <div className="h-8 bg-muted rounded w-1/3" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground text-lg">Vendor not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const cover = storageUrl(vendor.cover_image);
  const products = vendor.products ?? [];
  const portfolio = vendor.portfolio_items ?? [];
  const cartVendor = {
    id: vendor.id, name: vendor.name, city: vendor.city, is_verified: vendor.is_verified,
    offers_pickup: vendor.offers_pickup, offers_delivery: vendor.offers_delivery, delivery_fee: vendor.delivery_fee,
    pickup_address: vendor.pickup_address, delivery_note: vendor.delivery_note,
  };

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'shop', label: 'Shop', icon: ShoppingBag, count: products.length },
    { id: 'portfolio', label: 'Portfolio', icon: LayoutGrid, count: portfolio.length },
    { id: 'about', label: 'About & contact', icon: Info },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="relative aspect-[16/6] rounded-2xl overflow-hidden bg-muted mb-6">
          {cover ? (
            <Image src={cover} alt={vendor.name} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <Store className="w-16 h-16 text-white/50" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-primary-foreground bg-primary rounded-full">{vendor.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">{vendor.name} {vendor.is_verified && <VerifiedBadge size="lg" />}</h1>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {vendor.city}</span>
              {vendor.offers_delivery && (
                <span className="inline-flex items-center gap-1.5"><Truck className="w-4 h-4" /> Delivers{num(vendor.delivery_fee) > 0 ? ` from ${naira(vendor.delivery_fee ?? 0)}` : ' free'}</span>
              )}
            </p>
          </div>
          {vendor.contact_phone && (
            <Button asChild variant="outline"><a href={`tel:${vendor.contact_phone}`}><Phone className="w-4 h-4" /> Call</a></Button>
          )}
        </div>

        <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium inline-flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <t.icon className="w-4 h-4" /> {t.label}{t.count !== undefined && <span className="text-xs opacity-60">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'shop' && (
          products.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No products listed yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={{ ...p, vendor: cartVendor }} showVendor={false} />)}
            </div>
          )
        )}

        {tab === 'portfolio' && (
          portfolio.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No portfolio yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolio.map((item) => (
                <button key={item.id} type="button" onClick={() => setViewing(item)} className="group text-left">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                    <Image src={item.image_url} alt={item.title} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-[1.02] transition-transform" />
                  </div>
                  <p className="mt-2 text-sm font-medium">{item.title}</p>
                </button>
              ))}
            </div>
          )
        )}

        {tab === 'about' && (
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              {vendor.description ? <p className="text-muted-foreground whitespace-pre-line">{vendor.description}</p> : <p className="text-muted-foreground">No description yet.</p>}
              {vendor.offers_pickup && vendor.pickup_address && (
                <p className="mt-6 text-sm"><strong>Pickup:</strong> {vendor.pickup_address}</p>
              )}
              {vendor.offers_delivery && (
                <p className="mt-2 text-sm"><strong>Delivery:</strong> {num(vendor.delivery_fee) > 0 ? naira(vendor.delivery_fee ?? 0) : 'Free'}{vendor.delivery_note ? ` · ${vendor.delivery_note}` : ''}</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-3">
              <Button asChild variant="hero" className="w-full">
                <a href={`mailto:${vendor.contact_email}`}><Mail className="w-4 h-4" /> {vendor.contact_email}</a>
              </Button>
              {vendor.contact_phone && (
                <Button asChild variant="outline" className="w-full"><a href={`tel:${vendor.contact_phone}`}><Phone className="w-4 h-4" /> {vendor.contact_phone}</a></Button>
              )}
              {vendor.website && /^https?:\/\//i.test(vendor.website) && (
                <Button asChild variant="outline" className="w-full"><a href={vendor.website} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /> Website</a></Button>
              )}
              {vendor.instagram && (
                <Button asChild variant="outline" className="w-full">
                  <a href={vendor.instagram.startsWith('http') ? vendor.instagram : `https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {viewing && (
            <>
              <div className="relative aspect-[4/3] bg-muted">
                <Image src={viewing.image_url} alt={viewing.title} fill sizes="768px" className="object-contain" />
              </div>
              <div className="p-5">
                <DialogTitle>{viewing.title}</DialogTitle>
                {viewing.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{viewing.description}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
