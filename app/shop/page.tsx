'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingBag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';
import { ProductCard } from '@/components/shop/ProductCard';
import { shop, Product } from '@/lib/shop';

function ShopPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ category: string; product_count: number }[]>([]);

  useEffect(() => {
    shop.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Filters changed: start again from page 1.
  useEffect(() => {
    setLoading(true);
    shop.products({ search: query || undefined, category: category || undefined, sort: sort || undefined, page: 1 })
      .then((res) => {
        setItems(res.data);
        setPage(1);
        setLastPage(res.last_page);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [query, category, sort]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await shop.products({ search: query || undefined, category: category || undefined, sort: sort || undefined, page: page + 1 });
      setItems((prev) => [...prev, ...res.data]);
      setPage(res.current_page);
      setLastPage(res.last_page);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Shop</div>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-2">Party gear &amp; more</h1>
          <p className="text-muted-foreground">From vendors on Spotlight. Pay securely here, then pick up or get it delivered.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-9" />
          </div>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Newest</option>
            <option value="popular">Most popular</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button type="button" onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-sm border ${category === '' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>All</button>
            {categories.map((c) => (
              <button key={c.category} type="button" onClick={() => setCategory(c.category)} className={`px-3 py-1.5 rounded-full text-sm border ${category === c.category ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                {c.category} <span className="opacity-60">{c.product_count}</span>
              </button>
            ))}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="py-20 flex justify-center"><Loader size={32} /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3" />
            {query || category ? 'No products match.' : 'No products yet. Check back soon.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {page < lastPage && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={loadMore} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</Button>
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={null}>
      <ShopPage />
    </Suspense>
  );
}
