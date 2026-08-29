'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { vendors, Vendor } from '@/lib/vendors';
import { storageUrl } from '@/lib/storage';
import { Store, MapPin, Mail, Phone, Globe, Instagram } from 'lucide-react';

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = Number(params.id);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendors.getPublicOne(vendorId)
      .then(setVendor)
      .catch((error) => console.error('Failed to load vendor:', error))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-72 bg-muted rounded-xl" />
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

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative aspect-[16/8] rounded-2xl overflow-hidden bg-muted shadow-elevated mb-8">
          {cover ? (
            <Image src={cover} alt={vendor.name} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <Store className="w-16 h-16 text-white/50" />
            </div>
          )}
        </div>

        <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-primary-foreground bg-primary rounded-full">{vendor.category}</span>
        <h1 className="text-4xl font-bold mb-2">{vendor.name}</h1>
        <p className="text-muted-foreground mb-8 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {vendor.city}</p>

        {vendor.description && <p className="text-muted-foreground mb-10 whitespace-pre-line">{vendor.description}</p>}

        <div className="p-6 rounded-2xl border border-border glass">
          <h2 className="font-display font-semibold text-lg mb-4">Get in touch</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Button asChild variant="hero">
              <a href={`mailto:${vendor.contact_email}`}><Mail className="w-4 h-4" /> {vendor.contact_email}</a>
            </Button>
            {vendor.contact_phone && (
              <Button asChild variant="outline">
                <a href={`tel:${vendor.contact_phone}`}><Phone className="w-4 h-4" /> {vendor.contact_phone}</a>
              </Button>
            )}
            {vendor.website && (
              <Button asChild variant="outline">
                <a href={vendor.website} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /> Website</a>
              </Button>
            )}
            {vendor.instagram && (
              <Button asChild variant="outline">
                <a href={vendor.instagram.startsWith('http') ? vendor.instagram : `https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
