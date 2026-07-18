'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Users, Target, Heart, Award, Globe, TrendingUp, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl font-display font-bold mb-6">
              About <span className="text-gradient">Spotlighticket</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to revolutionize event discovery in Nigeria by connecting people with
              unforgettable events, movies, and locations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                At Spotlighticket, we believe that every night out deserves to be effortless. Our mission is to
                create a seamless, secure, and delightful platform that brings organizers and attendees together.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We're committed to making event discovery and ticket purchasing as simple as possible, while
                giving organizers powerful tools to grow their events and reach their audience.
              </p>
              <p className="text-lg text-muted-foreground">
                Whether it's a concert, a movie premiere, or a weekend spot worth visiting, Spotlighticket is
                here to help you find it.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 text-center">
                <Target className="w-12 h-12 text-primary-glow mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Our vision</h3>
                <p className="text-muted-foreground">To be Nigeria's most trusted ticketing platform</p>
              </div>
              <div className="glass rounded-2xl p-6 text-center">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Our values</h3>
                <p className="text-muted-foreground">Integrity, innovation, and inclusivity</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our core values</h2>
            <p className="text-xl text-muted-foreground">What drives us every day</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Innovation', desc: 'Constantly pushing boundaries to improve the event experience' },
              { icon: Users, title: 'Community', desc: 'Building connections and bringing people together' },
              { icon: Shield, title: 'Trust', desc: 'Security and reliability in every transaction' },
              { icon: Award, title: 'Excellence', desc: 'Delivering the best service possible' },
            ].map((value) => (
              <div key={value.title} className="glass rounded-2xl p-6 text-center">
                <value.icon className="w-12 h-12 text-primary-glow mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our story</h2>
          </div>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              Spotlighticket was born from a simple observation: finding and booking tickets should be
              effortless. We set out to solve the pain points that both organizers and attendees face.
            </p>
            <p>
              Our team of passionate developers, designers, and event enthusiasts came together with a shared
              vision: to make events accessible to everyone while empowering organizers to succeed.
            </p>
            <p>
              Today, Spotlighticket serves thousands of users across Nigeria, facilitating ticket sales and
              helping countless events find their audience. But we're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why choose us?</h2>
            <p className="text-xl text-muted-foreground">What sets Spotlighticket apart</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8">
              <Globe className="w-12 h-12 text-primary-glow mb-4" />
              <h3 className="text-xl font-bold mb-3">Local focus</h3>
              <p className="text-muted-foreground">
                Built for Nigeria's events, movies, and locations — with Naira pricing and local payment gateways.
              </p>
            </div>
            <div className="glass rounded-2xl p-8">
              <TrendingUp className="w-12 h-12 text-primary-glow mb-4" />
              <h3 className="text-xl font-bold mb-3">Growing platform</h3>
              <p className="text-muted-foreground">
                Join a rapidly growing community of event lovers and organizers. New events added daily!
              </p>
            </div>
            <div className="glass rounded-2xl p-8">
              <Award className="w-12 h-12 text-primary-glow mb-4" />
              <h3 className="text-xl font-bold mb-3">Built for trust</h3>
              <p className="text-muted-foreground">
                Secure checkout and instant tickets, recognized for excellence in user experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden border-t border-border/60">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-bold mb-4">Join the Spotlighticket community</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Whether you're looking to attend amazing events or host your own, we're here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
