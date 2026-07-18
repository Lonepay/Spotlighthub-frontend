import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="text-center">
          <h1 className="text-6xl font-display font-bold mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-4">Page not found</h2>
          <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary inline-flex items-center">
            Go home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
