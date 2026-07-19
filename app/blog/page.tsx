'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { blog, BlogPost } from '@/lib/blog';
import { storageUrl } from '@/lib/storage';
import { Calendar } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blog.getAll({ page: 1 }).then((data) => {
      setPosts(data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="pt-20 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="text-xs uppercase tracking-widest text-primary-glow mb-2">Blog</div>
        <h1 className="text-4xl font-bold mb-3">Stories from Spotlighticket</h1>
        <p className="text-lg text-muted-foreground">Guides, product updates, and highlights from across Nigeria.</p>
      </section>

      <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-2xl mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="glass rounded-2xl overflow-hidden shadow-card group cursor-pointer h-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow-sm">
                  <div className="relative h-48 overflow-hidden bg-muted">
                    {post.image ? (
                      <Image
                        src={storageUrl(post.image)!}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary" />
                    )}
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-2 py-1 mb-3 text-xs font-bold uppercase tracking-wider text-primary-glow bg-primary/10 rounded-md">
                      {post.category}
                    </span>
                    <h2 className="font-display font-bold text-xl mb-2 leading-snug">{post.title}</h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.published_at &&
                        new Date(post.published_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No posts yet. Check back soon!</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
