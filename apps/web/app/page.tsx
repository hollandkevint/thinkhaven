'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'
import { Search, ClipboardCheck, FileText, CheckCircle, Mail, MapPin } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section - Idea Validation Hook */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold font-display mb-6 bg-parchment text-ink border border-ink/10">
            Join the Beta - Limited Spots Available
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold font-display text-ink mb-6 leading-tight">
            Don&apos;t waste 6 months building something
            <br />
            <span className="text-rust">nobody wants</span>
          </h1>

          <p className="text-2xl text-ink-light font-body mb-8 max-w-3xl mx-auto">
            Get your startup idea validated by AI in 30 minutes. <strong>Know if you should build it</strong> before you invest your time and money.
          </p>

          {/* Primary CTA - Waitlist Form */}
          <div className="mb-8">
            <WaitlistForm />
          </div>

          <div className="flex justify-center mb-4">
            <Button
              size="lg"
              variant="outline"
              className="px-12 py-6 text-xl font-bold font-display border-ink/20 hover:bg-parchment"
              onClick={() => router.push('/assessment')}
            >
              Try Free Assessment First
            </Button>
          </div>

          <p className="text-sm text-slate-blue mb-12 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-forest" /> 30-minute AI validation</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-forest" /> 10 critical questions</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-forest" /> Professional report</span>
          </p>

          {/* Value Proposition - What You Get */}
          <div className="bg-parchment rounded-2xl shadow-lg p-8 mb-12 border border-ink/5">
            <h2 className="text-3xl font-bold font-display text-ink mb-6">
              What you get in your 30-minute validation session:
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-left">
                <div className="w-16 h-16 bg-terracotta/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <Search className="w-8 h-8 text-terracotta" />
                </div>
                <h3 className="text-xl font-bold font-display text-ink mb-3">10 Critical Questions Answered</h3>
                <p className="text-ink-light font-body">
                  Problem clarity, target market, competition, differentiation, business model - the questions that matter.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-forest/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <ClipboardCheck className="w-8 h-8 text-forest" />
                </div>
                <h3 className="text-xl font-bold font-display text-ink mb-3">Validation Scorecard</h3>
                <p className="text-ink-light font-body">
                  Clear verdict: Build it, Pivot, or Kill it - with specific scores and reasoning you can share with co-founders.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-mustard/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <FileText className="w-8 h-8 text-mustard" />
                </div>
                <h3 className="text-xl font-bold font-display text-ink mb-3">Professional PDF Report</h3>
                <p className="text-ink-light font-body">
                  Export your validation report to share with advisors, investors, or your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-parchment py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-center text-ink mb-12">
              What Strategic Thinkers Are Saying
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="bg-cream border-ink/10 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <p className="text-ink-light font-body mb-4 italic">
                    "The assessment pinpointed exactly where my strategic thinking was weak. Within 2 weeks of using ThinkHaven, my recommendations started getting approved consistently."
                  </p>
                  <p className="text-ink font-semibold font-display">Sarah Chen</p>
                  <p className="text-slate-blue text-sm">Senior Product Manager, Healthcare SaaS</p>
                </CardContent>
              </Card>

              <Card className="bg-cream border-ink/10 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <p className="text-ink-light font-body mb-4 italic">
                    "I've tried other strategic frameworks, but ThinkHaven is the first that felt systematic enough for someone with a technical background. Game changer."
                  </p>
                  <p className="text-ink font-semibold font-display">Marcus Rodriguez</p>
                  <p className="text-slate-blue text-sm">Engineering Director, Biotech</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="text-center">
              <div className="text-5xl font-bold font-display text-terracotta mb-2">50+</div>
              <div className="text-lg text-slate-blue font-body">Sparring Sessions Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-terracotta py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold font-display text-cream mb-6">
              Stop guessing. Start validating.
            </h2>
            <p className="text-xl text-cream/90 font-body mb-8">
              73% of startups fail because they build something nobody wants. Join the beta and validate before you build.
            </p>

            <div className="bg-cream/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <WaitlistForm />
            </div>

            <p className="text-cream/80 text-sm flex items-center justify-center gap-6 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Limited beta spots</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Early access pricing</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Direct founder support</span>
            </p>

            <div className="mt-8 pt-8 border-t border-cream/20">
              <p className="text-cream text-sm">
                Not ready to commit? <a href="/assessment" className="underline font-semibold text-cream hover:text-parchment">Take the free 5-minute assessment first</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-ink text-cream py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold font-display mb-4">ThinkHaven</h3>
              <p className="text-cream/70 font-body mb-4">
                Transform strategic analysis from art into science
              </p>
              <div className="space-y-2">
                <p className="text-sm text-cream/70 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> kevin@kevintholland.com
                </p>
                <p className="text-sm text-cream/70 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Charleston, SC
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold font-display mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-cream/70">
                <li><a href="/assessment" className="hover:text-cream transition-colors">Free Assessment</a></li>
                <li><a href="/demo" className="hover:text-cream transition-colors">Live Demo</a></li>
                <li><span className="text-cream/50">Blog (Coming Soon)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-display mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-cream/70">
                <li><span className="text-cream/50">Privacy Policy (Coming Soon)</span></li>
                <li><span className="text-cream/50">Terms of Service (Coming Soon)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cream/20 mt-8 pt-8 text-center text-cream/70 text-sm">
            <p>&copy; 2025 ThinkHaven. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
