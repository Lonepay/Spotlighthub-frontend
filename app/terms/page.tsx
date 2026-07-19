'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 border-b border-border">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
              <FileText className="w-12 h-12 text-primary-glow" />
            </div>
            <h1 className="text-5xl font-display font-bold tracking-tight mb-6">Terms and Conditions</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Effective: January 1, 2024
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed mb-4">
                By accessing and using Spotlighticket, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="leading-relaxed">
                These Terms and Conditions ("Terms") govern your access to and use of the Spotlighticket platform, including our website, 
                mobile applications, and services (collectively, the "Service").
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">2. Description of Service</h2>
              <p className="leading-relaxed mb-4">
                Spotlighticket is a ticketing platform for events, movies, and locations that enables:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Organizers to list, promote, and sell tickets for events, screenings, and locations</li>
                <li>Attendees to discover, browse, and purchase tickets</li>
                <li>Secure payment processing through integrated payment gateways</li>
                <li>Booking management and digital ticket delivery</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
              <p className="leading-relaxed mb-4">
                To use certain features of our Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your password and identification</li>
                <li>Accept all responsibility for activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.2 Account Types</h3>
              <p className="leading-relaxed">
                You may register as either an "Attendee" or "Organizer". Your role determines the features and services available to you.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">4. Organizers</h2>

              <h3 className="text-xl font-semibold mb-3">4.1 Organizer Responsibilities</h3>
              <p className="leading-relaxed mb-4">
                As an organizer, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Provide accurate and complete event information</li>
                <li>Honor all tickets sold through our platform</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Handle refunds according to your stated refund policy</li>
                <li>Respond promptly to attendee inquiries</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.2 Fees and Payments</h3>
              <p className="leading-relaxed mb-4">
                Partners are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Transaction fees as outlined in our pricing structure</li>
                <li>Payment processing fees charged by payment gateways</li>
                <li>Any applicable taxes on ticket sales</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">5. Ticket Purchases and Refunds</h2>
              <p className="leading-relaxed mb-4">
                All ticket purchases are final unless otherwise stated by the specific organizer.
                Refunds are generally only issued in the event of a cancellation or significant change to the event.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of Spotlighticket and its licensors.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">7. Termination</h2>
              <p className="leading-relaxed mb-4">
                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">8. Changes to Terms</h2>
              <p className="leading-relaxed mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">9. Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us at support@spotlighticket.com.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
