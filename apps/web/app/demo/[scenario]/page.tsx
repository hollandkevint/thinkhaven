'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getScenarioByIndex } from '../../../lib/demo/demoData'
import { DemoScenario, DemoMessage } from '../../../types/demo'
import { MessageCircle, ArrowLeft, Clock, Target, Play, Pause } from 'lucide-react'
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer'

export default function DemoScenarioViewer() {
  const params = useParams()
  const router = useRouter()
  const [scenario, setScenario] = useState<DemoScenario | null>(null)
  const [visibleMessages, setVisibleMessages] = useState(1)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [showConversion, setShowConversion] = useState(false)

  useEffect(() => {
    const scenarioIndex = parseInt(params.scenario as string)
    const loadedScenario = getScenarioByIndex(scenarioIndex)
    setScenario(loadedScenario)
  }, [params.scenario])

  useEffect(() => {
    if (autoAdvance && scenario && visibleMessages < scenario.chat_context.length) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => Math.min(prev + 1, scenario.chat_context.length))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [autoAdvance, visibleMessages, scenario])

  useEffect(() => {
    if (scenario && visibleMessages >= Math.floor(scenario.chat_context.length * 0.5) && !showConversion) {
      setShowConversion(true)
    }
  }, [visibleMessages, scenario])

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="loading-shimmer h-8 w-48 rounded mb-4"></div>
          <p className="text-slate-blue">Loading strategic session...</p>
        </div>
      </div>
    )
  }

  const progress = (visibleMessages / scenario.chat_context.length) * 100

  return (
    <div className="min-h-screen bg-cream">
      {/* Demo Navigation Header */}
      <div className="bg-parchment border-b border-ink/8 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/demo')}
                className="text-ink hover:bg-cream"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Demo Hub
              </Button>
              <div className="h-6 w-px bg-ink/15"></div>
              <div>
                <h1 className="font-semibold text-ink text-sm font-display">
                  {scenario.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-blue">
                  <MessageCircle className="w-3 h-3" />
                  <span>{visibleMessages}/{scenario.chat_context.length} messages</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress Bar */}
              <div className="w-32 bg-ink/10 rounded-full h-2">
                <div
                  className="bg-terracotta h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Auto-advance Toggle */}
              <Button
                variant={autoAdvance ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={autoAdvance ? '' : 'border-ink/15 text-ink hover:bg-cream'}
              >
                {autoAdvance ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">

            {/* Main Conversation Display */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg bg-white border-ink/8">
                <CardHeader className="border-b border-ink/8 bg-parchment">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-terracotta rounded-full flex items-center justify-center">
                      <span className="text-cream font-bold text-sm font-display">M</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink font-display">Strategic Analysis Session</h3>
                      <p className="text-sm text-ink-light">{scenario.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    {scenario.chat_context.slice(0, visibleMessages).map((message, index) => (
                      <div key={message.id} className="animate-fadeIn">
                        <div className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-forest text-cream'
                              : 'bg-terracotta text-cream'
                          }`}>
                            <span className="text-xs font-semibold font-display">
                              {message.role === 'user' ? 'Y' : 'M'}
                            </span>
                          </div>

                          <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block p-4 rounded-lg max-w-4xl ${
                              message.role === 'user'
                                ? 'bg-forest/5 border border-forest/15'
                                : 'bg-parchment border border-ink/8'
                            }`}>
                              <div className={`text-sm font-medium mb-2 font-display ${
                                message.role === 'user' ? 'text-forest' : 'text-terracotta'
                              }`}>
                                {message.role === 'user' ? 'You' : 'Mary (Strategic AI)'}
                              </div>
                              <div className="text-ink">
                                <MarkdownRenderer content={message.content} />
                              </div>

                              {/* Strategic Tags */}
                              {message.metadata?.strategic_tags && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {message.metadata.strategic_tags.map(tag => (
                                    <Badge key={tag} className="text-xs px-2.5 py-0.5 bg-ink text-cream font-normal">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-slate-blue mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {visibleMessages < scenario.chat_context.length && (
                    <div className="text-center mt-6 pt-6 border-t border-ink/8">
                      <Button
                        onClick={() => setVisibleMessages(prev => Math.min(prev + 1, scenario.chat_context.length))}
                        variant="outline"
                        className="px-6 border-ink/15 text-ink hover:bg-parchment"
                      >
                        Continue Session
                        <span className="ml-2 text-xs text-slate-blue">
                          ({scenario.chat_context.length - visibleMessages} more messages)
                        </span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Strategic Insights Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">

                {/* Strategic Analysis Tracker */}
                <Card className="bg-white border-ink/8">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-terracotta" />
                      <h4 className="font-semibold text-sm font-display text-ink">Strategic Analysis</h4>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-ink-light">Structured Inquiry</span>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </div>
                      <div className="w-full bg-ink/10 rounded-full h-1">
                        <div className="bg-terracotta h-1 rounded-full w-3/4"></div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-ink-light">Evidence-Based</span>
                        <Badge variant="outline" className="text-xs">75%</Badge>
                      </div>
                      <div className="w-full bg-ink/10 rounded-full h-1">
                        <div className="bg-forest h-1 rounded-full w-3/4"></div>
                      </div>
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-ink-light">Numbered Options</span>
                        <Badge variant="secondary" className="text-xs">In Use</Badge>
                      </div>
                      <div className="w-full bg-ink/10 rounded-full h-1">
                        <div className="bg-mustard h-1 rounded-full w-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Stats */}
                <Card className="bg-white border-ink/8">
                  <CardContent className="pt-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-blue">Session Length</span>
                        <span className="font-medium text-ink">~5 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-blue">Strategic Depth</span>
                        <span className="font-medium text-ink">Advanced</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-blue">Framework Used</span>
                        <span className="font-medium text-ink">Strategic Analysis</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps CTA */}
                {progress > 50 && (
                  <Card className="border-terracotta/20 bg-terracotta/5">
                    <CardContent className="pt-6 text-center">
                      <h4 className="font-semibold text-ink mb-2 font-display">
                        Ready for Your Session?
                      </h4>
                      <p className="text-sm text-ink-light mb-4">
                        Start your strategic analysis with Mary's guidance
                      </p>
                      <Button size="sm" className="w-full" onClick={() => router.push('/signup')}>
                        Begin Strategic Session
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Overlay */}
      {showConversion && progress > 80 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white border-ink/8">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-forest" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-ink font-display">Impressed with Mary's Analysis?</h3>
              <p className="text-ink-light mb-6">
                This is just one example of systematic strategic thinking. Get personalized analysis for your business challenge.
              </p>
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={() => router.push('/signup')}>
                  Start My Strategic Session
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-ink/15 text-ink hover:bg-parchment"
                  onClick={() => setShowConversion(false)}
                >
                  Continue Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
