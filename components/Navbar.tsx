'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { isAdminLevelRole } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import {
  Ticket,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Compass,
  Building2,
  Store,
  Newspaper,
  Mail,
  Settings,
  LayoutDashboard,
  PlusCircle,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/events', label: 'Explore', icon: Compass },
  { href: '/organizers', label: 'Organizers', icon: Building2 },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/storage/logo.png"
              alt="Spotlighticket"
              width={219}
              height={99}
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="w-5 h-5" />
              </Button>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            <ThemeToggle />

            {user ? (
              <>
                {isAdminLevelRole(user.role) ? (
                  <Link href="/admin" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                    Admin
                  </Link>
                ) : user.role === 'organizer' ? (
                  <>
                    <Link href="/organizer" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/create-event" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                      Create Event
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                    Dashboard
                  </Link>
                )}
                <Link href="/my-tickets" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                  My Tickets
                </Link>
                <Link href="/profile" className="flex items-center space-x-2 text-foreground hover:text-primary-glow transition-colors">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.name}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild variant="hero">
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 md:hidden">
            <Link href="/cart" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <button
              className="text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-background border-t border-border p-4 z-40 shadow-elevated">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Link href="/" className="flex items-center justify-center space-x-2 px-3 py-2 rounded-none bg-secondary/30 hover:bg-secondary/50 text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-center space-x-2 px-3 py-2 rounded-none bg-secondary/30 hover:bg-secondary/50 text-sm font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 px-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {isAdminLevelRole(user.role) ? (
                      <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-secondary/50 text-sm text-muted-foreground hover:text-primary font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    ) : user.role === 'organizer' ? (
                      <>
                        <Link href="/organizer" className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-secondary/50 text-sm text-muted-foreground hover:text-primary font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Organizer Dashboard</span>
                        </Link>
                        <Link href="/create-event" className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-secondary/50 text-sm text-muted-foreground hover:text-primary font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                          <PlusCircle className="w-4 h-4" />
                          <span>Create Event</span>
                        </Link>
                      </>
                    ) : (
                      <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-secondary/50 text-sm text-muted-foreground hover:text-primary font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                    )}
                    <Link href="/profile" className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-secondary/50 text-sm text-muted-foreground hover:text-primary font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <Link href="/my-tickets" className="flex items-center space-x-3 px-3 py-2 rounded-none hover:bg-secondary/50 text-sm text-muted-foreground hover:text-primary font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      <Ticket className="w-4 h-4" />
                      <span>My Tickets</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 bg-destructive/10 text-destructive font-medium py-2 rounded-none text-sm hover:bg-destructive/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild variant="hero" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
