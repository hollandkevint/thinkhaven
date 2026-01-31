'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section - Idea Validation Hook */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold mb-6">
            🚀 Join the Beta - Limited Spots Available
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Don&apos;t waste 6 months building something
            <br />
            <span className="text-red-600">nobody wants</span>
          </h1>

          <p className="text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
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
              className="px-12 py-6 text-xl font-bold"
              onClick={() => router.push('/assessment')}
            >
              Try Free Assessment First
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-12">
            ✓ 30-minute AI validation session • ✓ 10 critical questions answered • ✓ Professional report
          </p>

          {/* Value Proposition - What You Get */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What you get in your 30-minute validation session:
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-left">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">10 Critical Questions Answered</h3>
                <p className="text-gray-600">
                  Problem clarity, target market, competition, differentiation, business model - the questions that matter.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Validation Scorecard</h3>
                <p className="text-gray-600">
                  Clear verdict: Build it, Pivot, or Kill it - with specific scores and reasoning you can share with co-founders.
                </p>
              </div>

              <div className="text-left">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Professional PDF Report</h3>
                <p className="text-gray-600">
                  Export your validation report to share with advisors, investors, or your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              What Strategic Thinkers Are Saying
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 italic">
                    "The assessment pinpointed exactly where my strategic thinking was weak. Within 2 weeks of using ThinkHaven, my recommendations started getting approved consistently."
                  </p>
                  <p className="text-gray-900 font-semibold">Sarah Chen</p>
                  <p className="text-gray-600 text-sm">Senior Product Manager, Healthcare SaaS</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 italic">
                    "I've tried other strategic frameworks, but ThinkHaven is the first that felt systematic enough for someone with a technical background. Game changer."
                  </p>
                  <p className="text-gray-900 font-semibold">Marcus Rodriguez</p>
                  <p className="text-gray-600 text-sm">Engineering Director, Biotech</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-lg text-gray-600">Sparring Sessions Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stop guessing. Start validating.
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              73% of startups fail because they build something nobody wants. Join the beta and validate before you build.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <WaitlistForm />
            </div>

            <p className="text-blue-200 text-sm">
              ✓ Limited beta spots • ✓ Early access pricing • ✓ Direct founder support
            </p>

            <div className="mt-8 pt-8 border-t border-blue-400">
              <p className="text-blue-100 text-sm">
                Not ready to commit? <a href="/assessment" className="underline hover:text-white">Take the free 5-minute assessment first</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">ThinkHaven</h3>
              <p className="text-gray-400 mb-4">
                Transform strategic analysis from art into science
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">📧 kevin@kevintholland.com</p>
                <p className="text-sm text-gray-400">📍 Charleston, SC</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/assessment" className="hover:text-white transition-colors">Free Assessment</a></li>
                <li><a href="/demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><span className="text-gray-500">Blog (Coming Soon)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-gray-500">Privacy Policy (Coming Soon)</span></li>
                <li><span className="text-gray-500">Terms of Service (Coming Soon)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 ThinkHaven. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
