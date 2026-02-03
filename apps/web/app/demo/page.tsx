'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth/AuthContext'
import { demoScenarios } from '../../lib/demo/demoData'
import { Clock, MessageCircle, Target, ArrowLeft, Rocket, MessageSquare, ChevronRight } from 'lucide-react'

export default function DemoHub() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-cream overflow-hidden">
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Demo Header */}
      <div className="relative z-10 bg-parchment border-b border-ink/8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium font-display text-ink">
                Strategic Analysis Demo
              </h1>
              <p className="text-slate-blue text-sm mt-1">
                Experience Mary's strategic framework in action{user ? ' — Welcome back!' : ' — No signup required'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-ink/15 text-ink hover:bg-cream hover:border-ink/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Hub Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">

          {/* Introduction */}
          <div className="text-center mb-16 animate-fadeIn">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-3 border border-ink/8 rounded-sm" />
              <Badge className="relative px-5 py-2 bg-parchment text-ink border-0 font-display text-sm tracking-wide">
                <Target className="w-4 h-4 mr-2 inline text-terracotta" />
                Live Strategic Analysis Sessions
              </Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium font-display text-ink mb-6">
              Choose Your Strategic Challenge
            </h2>
            <p className="text-xl text-ink-light font-body max-w-2xl mx-auto leading-relaxed">
              Each demo shows a complete strategic thinking session. Select a scenario
              and see Mary's systematic approach in action.
            </p>
          </div>

          {/* Demo Scenario Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {demoScenarios.map((scenario, index) => (
              <div
                key={index}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card
                  className="group h-full bg-parchment border-ink/8 hover:border-terracotta/40 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/demo/${index}`)}
                >
                  {/* Decorative corner */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-terracotta/20 rounded-tl-lg transition-colors group-hover:border-terracotta/40" />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs border-ink/15 text-slate-blue font-display">
                        Demo {index + 1}
                      </Badge>
                      <Target className="w-5 h-5 text-terracotta/60 group-hover:text-terracotta transition-colors" />
                    </div>
                    <CardTitle className="text-xl leading-tight font-display text-ink group-hover:text-terracotta transition-colors">
                      {scenario.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-ink-light text-sm mb-5 leading-relaxed font-body">
                      {scenario.description}
                    </p>

                    {/* Demo Stats */}
                    <div className="flex items-center gap-5 mb-5 text-xs text-slate-blue">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{scenario.chat_context.length} messages</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~5 min read</span>
                      </div>
                    </div>

                    {/* Strategic Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {scenario.chat_context
                        .filter(msg => msg.metadata?.strategic_tags)
                        .slice(0, 1)
                        .map(msg =>
                          msg.metadata!.strategic_tags!.slice(0, 2).map(tag => (
                            <Badge key={tag} className="text-xs px-2.5 py-0.5 bg-ink text-cream font-normal">
                              {tag}
                            </Badge>
                          ))
                        )}
                    </div>

                    <Button
                      className="w-full justify-between border-ink/15 text-ink hover:bg-ink hover:text-cream hover:border-ink transition-all group/btn"
                      variant="outline"
                    >
                      <span>View Strategic Session</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Method Explanation */}
          <div className="bg-parchment rounded-xl p-10 border border-ink/8 shadow-sm mb-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-medium font-display text-ink mb-3">
                Strategic Framework in Action
              </h3>
              <p className="text-ink-light font-body">
                Each demo demonstrates core principles for systematic strategic thinking
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  number: '1',
                  color: 'terracotta',
                  title: 'Structured Inquiry',
                  description: 'Numbered options protocol guides systematic exploration of strategic alternatives'
                },
                {
                  number: '2',
                  color: 'forest',
                  title: 'Evidence-Based',
                  description: 'All insights grounded in research, data, and verifiable strategic frameworks'
                },
                {
                  number: '3',
                  color: 'mustard',
                  title: 'Actionable Output',
                  description: 'Strategic sessions produce concrete next steps and implementation guidance'
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                    item.color === 'terracotta' ? 'bg-terracotta/10' :
                    item.color === 'forest' ? 'bg-forest/10' : 'bg-mustard/10'
                  }`}>
                    <span className={`text-xl font-display font-medium ${
                      item.color === 'terracotta' ? 'text-terracotta' :
                      item.color === 'forest' ? 'text-forest' : 'text-mustard'
                    }`}>
                      {item.number}
                    </span>
                  </div>
                  <h4 className="font-medium font-display text-ink mb-2">{item.title}</h4>
                  <p className="text-sm text-ink-light font-body leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion CTA */}
          <div className="relative bg-terracotta rounded-xl overflow-hidden shadow-lg">
            {/* Decorative circles */}
            <div className="absolute top-6 left-6 w-20 h-20 border border-cream/10 rounded-full" />
            <div className="absolute bottom-6 right-6 w-28 h-28 border border-cream/10 rounded-full" />
            <div className="absolute top-1/2 right-1/4 w-12 h-12 border border-cream/5 rounded-full" />

            <div className="relative p-10 md:p-12 text-center">
              <h3 className="text-3xl md:text-4xl font-medium font-display mb-4 text-cream">
                Ready to Start Your Strategic Analysis?
              </h3>
              <p className="text-cream/85 mb-8 max-w-2xl mx-auto text-lg font-body">
                These demos show real strategic thinking sessions. Experience Mary's systematic approach
                to unlock insights for your own business challenges.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {user ? (
                  <Button
                    size="lg"
                    className="px-8 py-5 bg-cream text-terracotta hover:bg-parchment font-medium font-display shadow-md hover:shadow-lg transition-all"
                    onClick={() => router.push('/app')}
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Access Your Dashboard
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="px-8 py-5 bg-cream text-terracotta hover:bg-parchment font-medium font-display shadow-md hover:shadow-lg transition-all"
                    onClick={() => router.push('/signup')}
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Free Strategic Session
                  </Button>
                )}
                <Button
                  size="lg"
                  className="px-8 py-5 bg-transparent border-2 border-cream text-cream hover:bg-cream hover:text-terracotta font-medium font-display transition-all"
                  onClick={() => window.open('mailto:kevin@kevintholland.com', '_blank')}
                >
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
