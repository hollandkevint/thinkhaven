'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth/AuthContext'
import { demoScenarios } from '../../lib/demo/demoData'
import { Clock, MessageCircle, Target, ArrowLeft, Rocket, MessageSquare } from 'lucide-react'

export default function DemoHub() {
  const router = useRouter()
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-cream">
      {/* Demo Header */}
      <div className="bg-parchment border-b border-ink/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-ink">
                Strategic Analysis Demo
              </h1>
              <p className="text-slate-blue">
                Experience Mary's strategic framework in action{user ? ' - Welcome back!' : ' - No signup required'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-ink/20 text-ink hover:bg-cream"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Hub Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">

          {/* Introduction */}
          <div className="text-center mb-12">
            <Badge className="mb-4 px-6 py-2 bg-parchment text-ink border border-ink/10 font-display">
              <Target className="w-4 h-4 mr-2 inline" />
              Live Strategic Analysis Sessions
            </Badge>
            <h2 className="text-4xl font-bold font-display text-ink mb-4">
              Choose Your Strategic Challenge
            </h2>
            <p className="text-xl text-ink-light font-body max-w-3xl mx-auto">
              Each demo shows a complete strategic thinking session.
              Select a scenario that matches your interests and see Mary's systematic approach in action.
            </p>
          </div>

          {/* Demo Scenario Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {demoScenarios.map((scenario, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer border-ink/10 bg-parchment hover:border-terracotta/50"
                onClick={() => router.push(`/demo/${index}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs border-ink/20 text-ink font-display">
                      Demo {index + 1}
                    </Badge>
                    <Target className="w-5 h-5 text-terracotta" />
                  </div>
                  <CardTitle className="text-lg leading-tight font-display text-ink">
                    {scenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-ink-light text-sm mb-4 leading-relaxed font-body">
                    {scenario.description}
                  </p>

                  {/* Demo Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-slate-blue">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{scenario.chat_context.length} messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>~5 min read</span>
                    </div>
                  </div>

                  {/* Strategic Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {scenario.chat_context
                      .filter(msg => msg.metadata?.strategic_tags)
                      .slice(0, 1)
                      .map(msg =>
                        msg.metadata!.strategic_tags!.slice(0, 2).map(tag => (
                          <Badge key={tag} className="text-xs px-2 py-0 bg-ink text-cream">
                            {tag}
                          </Badge>
                        ))
                      )}
                  </div>

                  <Button className="w-full border-ink/20 text-ink hover:bg-cream hover:text-terracotta" variant="outline">
                    View Strategic Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Method Explanation */}
          <div className="bg-parchment rounded-xl p-8 border border-ink/10 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold font-display text-ink mb-2">
                Strategic Framework in Action
              </h3>
              <p className="text-ink-light font-body">
                Each demo demonstrates core principles for systematic strategic thinking
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-terracotta/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-terracotta font-bold font-display">1</span>
                </div>
                <h4 className="font-semibold font-display text-ink mb-2">Structured Inquiry</h4>
                <p className="text-sm text-ink-light font-body">
                  Numbered options protocol guides systematic exploration of strategic alternatives
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-forest/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-forest font-bold font-display">2</span>
                </div>
                <h4 className="font-semibold font-display text-ink mb-2">Evidence-Based</h4>
                <p className="text-sm text-ink-light font-body">
                  All insights grounded in research, data, and verifiable strategic frameworks
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-mustard/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-mustard font-bold font-display">3</span>
                </div>
                <h4 className="font-semibold font-display text-ink mb-2">Actionable Output</h4>
                <p className="text-sm text-ink-light font-body">
                  Strategic sessions produce concrete next steps and implementation guidance
                </p>
              </div>
            </div>
          </div>

          {/* Conversion CTA */}
          <div className="text-center mt-12">
            <div className="bg-terracotta rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold font-display mb-4 text-cream">
                Ready to Start Your Strategic Analysis?
              </h3>
              <p className="text-cream/90 mb-6 max-w-2xl mx-auto text-lg font-body">
                These demos show real strategic thinking sessions. Experience Mary's systematic approach
                to unlock insights for your own business challenges.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {user ? (
                  <Button size="lg" className="px-8 py-4 bg-cream text-terracotta hover:bg-parchment font-semibold font-display" onClick={() => router.push('/app')}>
                    <Rocket className="w-5 h-5 mr-2" />
                    Access Your Dashboard
                  </Button>
                ) : (
                  <Button size="lg" className="px-8 py-4 bg-cream text-terracotta hover:bg-parchment font-semibold font-display" onClick={() => router.push('/signup')}>
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Free Strategic Session
                  </Button>
                )}
                <Button size="lg" className="px-8 py-4 bg-terracotta-hover border-2 border-cream text-cream hover:bg-cream hover:text-terracotta font-semibold font-display" onClick={() => window.open('mailto:kevin@kevintholland.com', '_blank')}>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Talk to Our Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
