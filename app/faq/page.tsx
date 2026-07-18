'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is Spotlighticket?',
          a: 'Spotlighticket is a comprehensive ticketing platform for events, movies, and locations in Nigeria. We make it easy to discover, book, and manage tickets all in one place.',
        },
        {
          q: 'How do I create an account?',
          a: 'Click on "Sign up" in the navigation bar, choose whether you want to attend events or create them, fill in your details, and you\'re ready to go!',
        },
        {
          q: 'Is Spotlighticket free to use?',
          a: 'Yes! Creating an account and browsing events is completely free. We only charge transaction fees on ticket sales for organizers.',
        },
        {
          q: 'What types of events can I find?',
          a: 'You can find events, movie screenings, and visit-worthy locations — concerts, conferences, workshops, festivals, and more!',
        },
      ],
    },
    {
      category: 'For Attendees',
      questions: [
        {
          q: 'How do I purchase tickets?',
          a: 'Browse the Explore page, add tickets to your cart, and complete payment through our secure checkout.',
        },
        {
          q: 'Can I get a refund?',
          a: 'Refund policies vary by event. Please check the event details or contact the organizer directly for refund information.',
        },
        {
          q: 'Where can I find my tickets?',
          a: 'After purchase, tickets are sent to your email and available under "My Tickets" with a scannable QR code.',
        },
        {
          q: 'Do I need to print my ticket?',
          a: 'No! You can show the QR code on your ticket directly from your phone at the venue.',
        },
      ],
    },
    {
      category: 'For Organizers',
      questions: [
        {
          q: 'How do I create an event?',
          a: 'Sign up as an organizer, go to your dashboard, and click "Create Event". Fill in the details, set ticket prices, and publish!',
        },
        {
          q: 'When do I get paid?',
          a: 'Payouts are processed automatically to your connected bank account within 24-48 hours after ticket sales.',
        },
        {
          q: 'Can I customize my event page?',
          a: 'Yes, you can add images, detailed descriptions, venue locations, and custom ticket types to make your event stand out.',
        },
        {
          q: 'How do I check in attendees?',
          a: 'You can use your organizer dashboard to scan attendee QR codes at the venue entrance for seamless check-in.',
        },
      ],
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'Do you have a mobile app?',
          a: 'Currently, Spotlighticket is optimized for web browsers on all devices. A mobile app is in development and will be available soon!',
        },
        {
          q: 'What browsers are supported?',
          a: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, please use the latest version of your browser.',
        },
        {
          q: 'How do I reset my password?',
          a: 'Click "Log in" and then "Forgot password?". Enter your email address and we\'ll send you a verification code.',
        },
        {
          q: 'Can I use Spotlighticket on my phone?',
          a: 'Yes! Our website is fully responsive and works great on mobile devices. You can browse events, purchase tickets, and manage your account from your phone.',
        },
      ],
    },
  ];

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-hero" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 ring-1 ring-primary/20">
              <HelpCircle className="w-8 h-8 text-primary-glow" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight">
              How can we <span className="text-gradient">help?</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Find answers to common questions about Spotlighticket, ticketing, and event management.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 -mt-12 relative z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl shadow-elevated relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 rounded-2xl py-6 pl-16 pr-6 text-lg font-medium placeholder:text-muted-foreground focus:ring-0 text-foreground outline-none"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No results found. Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredFAQs.map((category, categoryIdx) => (
                <div key={categoryIdx}>
                  <h2 className="text-3xl font-bold mb-6">{category.category}</h2>
                  <div className="space-y-4">
                    {category.questions.map((faq, idx) => {
                      const globalIndex = faqs.slice(0, categoryIdx).reduce((acc, cat) => acc + cat.questions.length, 0) + idx;
                      const isOpen = openIndex === globalIndex;

                      return (
                        <div key={idx} className="glass rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                            className="w-full p-6 text-left flex justify-between items-center hover:bg-secondary/30 transition-colors"
                          >
                            <span className="font-semibold pr-4">{faq.q}</span>
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-6 border-t border-border/60">
                              <p className="text-muted-foreground leading-relaxed pt-4">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
