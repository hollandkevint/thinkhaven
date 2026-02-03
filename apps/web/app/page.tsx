'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'
import { Search, ClipboardCheck, FileText, CheckCircle, Mail, MapPin, Quote, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-cream overflow-hidden">
      {/* Subtle texture overlay for depth */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Hero Section - Deliberate Symmetry + Bold Statement */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Decorative frame element - Wes Anderson touch */}
            <div className="relative inline-block mb-8 animate-fadeIn">
              <div className="absolute -inset-4 border border-ink/10 rounded-sm" />
              <Badge
                variant="secondary"
                className="relative px-6 py-2.5 text-sm font-medium font-display tracking-wide bg-parchment text-ink border-0 shadow-sm"
              >
                Join the Beta — Limited Spots Available
              </Badge>
            </div>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-medium font-display text-ink mb-8 leading-[1.1] tracking-tight animate-fadeIn"
              style={{ animationDelay: '100ms' }}
            >
              Don&apos;t waste 6 months
              <br />
              building something
              <br />
              <span className="text-rust italic">nobody wants</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-ink-light font-body mb-10 max-w-2xl mx-auto leading-relaxed animate-fadeIn"
              style={{ animationDelay: '200ms' }}
            >
              Get your startup idea validated by AI in 30 minutes.
              <br className="hidden md:block" />
              <strong className="text-ink">Know if you should build it</strong> before you invest.
            </p>

            {/* Primary CTA - Framed */}
            <div
              className="mb-6 animate-fadeIn"
              style={{ animationDelay: '300ms' }}
            >
              <WaitlistForm />
            </div>

            <div
              className="flex justify-center mb-6 animate-fadeIn"
              style={{ animationDelay: '400ms' }}
            >
              <Button
                size="lg"
                variant="outline"
                className="group px-8 py-5 text-lg font-medium font-display border-2 border-ink/20 hover:border-ink hover:bg-ink hover:text-cream transition-all duration-200"
                onClick={() => router.push('/assessment')}
              >
                Try Free Assessment First
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <p
              className="text-sm text-slate-blue flex items-center justify-center gap-8 flex-wrap animate-fadeIn"
              style={{ animationDelay: '500ms' }}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-forest" />
                30-minute AI validation
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-forest" />
                10 critical questions
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-forest" />
                Professional report
              </span>
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-8">
          <div className="w-16 h-px bg-ink/10" />
          <div className="w-2 h-2 rounded-full bg-terracotta/40" />
          <div className="w-16 h-px bg-ink/10" />
        </div>
      </div>

      {/* Value Proposition - Framed Cards with Asymmetric Layout */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Section Header with Frame */}
            <div className="text-center mb-12">
              <h2 className="inline-block text-3xl md:text-4xl font-medium font-display text-ink relative">
                What you get in 30 minutes
                <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terracotta/40 to-transparent" />
              </h2>
            </div>

            {/* Feature Cards - Staggered Animation */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Search,
                  color: 'terracotta',
                  title: '10 Critical Questions',
                  description: 'Problem clarity, target market, competition, differentiation — the questions that matter.',
                  delay: '0ms'
                },
                {
                  icon: ClipboardCheck,
                  color: 'forest',
                  title: 'Validation Scorecard',
                  description: 'Clear verdict: Build it, Pivot, or Kill it — with reasoning you can share.',
                  delay: '100ms'
                },
                {
                  icon: FileText,
                  color: 'mustard',
                  title: 'Professional Report',
                  description: 'Export your validation to share with advisors, investors, or your team.',
                  delay: '200ms'
                }
              ].map((feature, index) => {
                const Icon = feature.icon
                const colorClasses = {
                  terracotta: 'bg-terracotta/8 text-terracotta border-terracotta/20',
                  forest: 'bg-forest/8 text-forest border-forest/20',
                  mustard: 'bg-mustard/8 text-mustard border-mustard/20'
                }
                return (
                  <div
                    key={index}
                    className="group relative animate-fadeIn h-full"
                    style={{ animationDelay: feature.delay }}
                  >
                    {/* Card with decorative corner */}
                    <div className="relative h-full bg-parchment rounded-lg p-6 border border-ink/8 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                      {/* Decorative corner accent */}
                      <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg ${
                        feature.color === 'terracotta' ? 'border-terracotta/30' :
                        feature.color === 'forest' ? 'border-forest/30' : 'border-mustard/30'
                      }`} />

                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-medium font-display text-ink mb-2">{feature.title}</h3>
                      <p className="text-ink-light font-body text-sm leading-relaxed flex-grow">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof - Distinct Color Block */}
      <div className="relative z-10 bg-parchment border-y border-ink/8">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #2C2416 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Statement stat - Bold focal point */}
            <div className="text-center mb-16">
              <div className="inline-block relative">
                <span className="text-8xl md:text-9xl font-display font-medium text-terracotta leading-none">50+</span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-terracotta/30 rounded-full" />
              </div>
              <p className="mt-4 text-lg text-slate-blue font-body">Sparring Sessions Completed</p>
            </div>

            <h2 className="text-2xl md:text-3xl font-medium font-display text-center text-ink mb-12">
              What Strategic Thinkers Are Saying
            </h2>

            {/* Testimonials - Framed quotes */}
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  quote: "The assessment pinpointed exactly where my strategic thinking was weak. Within 2 weeks, my recommendations started getting approved consistently.",
                  name: "Sarah Chen",
                  role: "Senior Product Manager, Healthcare SaaS"
                },
                {
                  quote: "I've tried other strategic frameworks, but ThinkHaven is the first that felt systematic enough for someone with a technical background.",
                  name: "Marcus Rodriguez",
                  role: "Engineering Director, Biotech"
                }
              ].map((testimonial, index) => (
                <Card
                  key={index}
                  className="group bg-cream border-ink/10 hover:border-ink/20 transition-all duration-300 overflow-hidden"
                >
                  <CardContent className="relative p-6">
                    {/* Quote mark decoration */}
                    <Quote className="absolute top-4 right-4 w-8 h-8 text-terracotta/10 transform rotate-180" />

                    <p className="text-ink-light font-body mb-6 leading-relaxed relative z-10 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta/20 to-forest/20 flex items-center justify-center">
                        <span className="font-display text-sm text-ink font-medium">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-ink font-medium font-display text-sm">{testimonial.name}</p>
                        <p className="text-slate-blue text-xs">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section - Bold Color Block */}
      <div className="relative z-10 bg-terracotta overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-8 left-8 w-24 h-24 border border-cream/10 rounded-full" />
          <div className="absolute bottom-8 right-8 w-32 h-32 border border-cream/10 rounded-full" />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-cream/5 rounded-full" />
        </div>

        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-medium font-display text-cream mb-6 leading-tight">
              Stop guessing.
              <br />
              Start validating.
            </h2>
            <p className="text-xl text-cream/85 font-body mb-10 max-w-xl mx-auto">
              73% of startups fail because they build something nobody wants.
              Join the beta and validate before you build.
            </p>

            <div className="bg-cream/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-cream/10">
              <WaitlistForm />
            </div>

            <p className="text-cream/70 text-sm flex items-center justify-center gap-8 flex-wrap mb-8">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cream/60" />
                Limited beta spots
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cream/60" />
                Early access pricing
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cream/60" />
                Direct founder support
              </span>
            </p>

            <div className="pt-6 border-t border-cream/20">
              <p className="text-cream text-sm">
                Not ready to commit?{' '}
                <a
                  href="/assessment"
                  className="text-cream underline underline-offset-4 font-semibold hover:text-parchment transition-colors"
                >
                  Take the free 5-minute assessment first
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Refined */}
      <div className="relative z-10 bg-ink text-cream">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-medium font-display mb-3 text-cream">ThinkHaven</h3>
                <p className="text-cream/60 font-body mb-6 max-w-sm">
                  Transform strategic analysis from art into science. Make better decisions, faster.
                </p>
                <div className="space-y-2">
                  <a href="mailto:kevin@kevintholland.com" className="text-sm text-cream/60 hover:text-cream flex items-center gap-2 transition-colors">
                    <Mail className="w-4 h-4" />
                    kevin@kevintholland.com
                  </a>
                  <p className="text-sm text-cream/60 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Charleston, SC
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium font-display mb-4 text-cream/90">Resources</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="/assessment" className="text-cream/60 hover:text-cream transition-colors">
                      Free Assessment
                    </a>
                  </li>
                  <li>
                    <a href="/demo" className="text-cream/60 hover:text-cream transition-colors">
                      Live Demo
                    </a>
                  </li>
                  <li>
                    <span className="text-cream/30">Blog (Coming Soon)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium font-display mb-4 text-cream/90">Legal</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <span className="text-cream/30">Privacy Policy (Coming Soon)</span>
                  </li>
                  <li>
                    <span className="text-cream/30">Terms of Service (Coming Soon)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-cream/10 mt-12 pt-8 text-center">
              <p className="text-cream/40 text-sm">&copy; 2025 ThinkHaven. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
