'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { blog, BlogPost } from '@/lib/blog';
import { storageUrl } from '@/lib/storage';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    if (!slug) return;
    blog.getOne(slug)
      .then((data) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-28">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button variant="hero" onClick={() => router.push('/blog')}>
            Back to blog
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <article className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </Button>

        <span className="inline-block px-2 py-1 mb-4 text-xs font-bold uppercase tracking-wider text-primary-glow bg-primary/10 rounded-md">
          {post.category}
        </span>

        <h1 className="font-display font-bold text-3xl md:text-5xl mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          {post.published_at && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
          {post.user?.name && <span>By {post.user.name}</span>}
        </div>

        {post.image && (
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-10 shadow-card">
            <Image
              src={storageUrl(post.image)!}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground whitespace-pre-line leading-relaxed text-muted-foreground">
          {post.content}
        </div>
      </article>

      <Footer />
    </div>
  );
}
