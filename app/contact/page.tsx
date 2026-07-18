'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight mb-6">
              Get in <span className="text-gradient">touch</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Send us a message</h2>

              {submitted && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 flex items-center">
                  <span className="mr-2">✓</span> Thank you for your message! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="contact-name">Your name</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ada Okafor"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-email">Email address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input
                    id="contact-subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message">Message</Label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <Button type="submit" disabled={loading} variant="hero" size="lg" className="w-full">
                  {loading ? 'Sending...' : 'Send message'}
                  {!loading && <Send className="w-5 h-5" />}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold mb-8">Contact information</h2>

                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <Mail className="w-6 h-6 text-primary-glow" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-lg">Email</h3>
                      <p className="text-muted-foreground">support@spotlighticket.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <Phone className="w-6 h-6 text-primary-glow" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-lg">Phone</h3>
                      <p className="text-muted-foreground">+234 813 220 9554</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <MapPin className="w-6 h-6 text-primary-glow" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-lg">Address</h3>
                      <p className="text-muted-foreground leading-relaxed">Lagos, Nigeria</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <Clock className="w-6 h-6 text-primary-glow" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 text-lg">Business hours</h3>
                      <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-muted-foreground">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-muted-foreground">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl relative overflow-hidden group">
                <MessageSquare className="w-10 h-10 text-primary-glow mb-4 relative z-10" />
                <h3 className="text-xl font-bold mb-2 relative z-10">Need immediate help?</h3>
                <p className="text-muted-foreground mb-6 relative z-10">
                  For urgent matters, please call our support line or send an email with "URGENT" in the subject line.
                </p>
                <a href="mailto:support@spotlighticket.com" className="inline-flex items-center text-primary-glow hover:underline font-bold transition-colors relative z-10">
                  Contact support <span className="ml-2">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-muted-foreground text-lg">
              Can't find what you're looking for? Check out our{' '}
              <a href="/faq" className="text-primary-glow hover:underline font-bold decoration-2 underline-offset-4">
                complete FAQ page
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
