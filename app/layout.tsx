import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CartProvider } from '@/lib/cart'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Spotlighticket — Tickets for events, movies & locations in Nigeria',
  description:
    "Spotlighticket is Nigeria's home for booking events, movies, and visit-worthy locations. Secure checkout, instant tickets, light & dark mode.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ThemeProvider>
        <WhatsAppButton />
        <Toaster richColors position="top-center" theme="system" />
      </body>
    </html>
  )
}
