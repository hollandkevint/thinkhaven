import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'
import { ArrowRight, Mail, MapPin } from 'lucide-react'
import { BOARD_MEMBERS } from '@/lib/ai/board-members'
import type { BoardMemberId } from '@/lib/ai/board-types'

const LANDING_QUOTES: Record<BoardMemberId, string> = {
  mary: 'Let me bring in Victoria here, because this is really a question about whether the economics work.',
  victoria: 'Who signs the check? Walk me through your unit economics.',
  casey: 'Real talk, do you actually want to spend two years on this?',
  elaine: 'I have seen this pattern before. What usually happens next is...',
  omar: 'What ships this quarter? Who is building this? What is the critical path?',
  taylor: 'How does this decision sit with you emotionally?',
}

const boardMembers = BOARD_MEMBERS.map(member => ({
  ...member,
  quote: LANDING_QUOTES[member.id],
  cssColor: `var(--board-${member.id})`,
}))

export default function Home() {
  return (
    <div className="min-h-screen bg-cream overflow-hidden">
      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-medium font-display text-ink mb-8 leading-[1.1] tracking-tight animate-fadeIn"
            >
              Pressure-test your strategy
              <br />
              <span className="text-rust italic">before the room does.</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-ink-light font-body mb-10 max-w-2xl mx-auto leading-relaxed animate-fadeIn"
              style={{ animationDelay: '100ms' }}
            >
              Your AI won&apos;t tell you your idea is bad.
              <br className="hidden md:block" />
              <strong className="text-ink">ThinkHaven will.</strong>
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fadeIn"
              style={{ animationDelay: '200ms' }}
            >
              <Button
                size="lg"
                className="group px-8 py-5 text-lg font-medium font-display bg-terracotta hover:bg-terracotta-hover text-cream transition-all duration-200"
                asChild
              >
                <Link href="/try">
                  Try a Free Session
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group px-8 py-5 text-lg font-medium font-display border-2 border-ink/20 hover:border-ink hover:bg-ink hover:text-cream transition-all duration-200"
                asChild
              >
                <Link href="/assessment">
                  Take the 5-Minute Assessment
                </Link>
              </Button>
            </div>

            <p
              className="text-sm text-slate-blue animate-fadeIn"
              style={{ animationDelay: '300ms' }}
            >
              No account required. 5 free messages to see if it&apos;s for you.
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

      {/* Board of Directors Section */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="inline-block text-3xl md:text-4xl font-medium font-display text-ink relative">
                Your Personal Board of Directors
                <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terracotta/40 to-transparent" />
              </h2>
            </div>
            <p className="text-center text-ink-light font-body max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
              Six AI advisors with distinct worldviews challenge your thinking from every angle. They disagree with each other. That&apos;s the point.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardMembers.map((member) => (
                <div
                  key={member.id}
                  className="relative bg-parchment rounded-lg p-6 border border-ink/8 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                    style={{ backgroundColor: member.cssColor }}
                  />

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-cream font-display font-bold text-sm"
                      style={{ backgroundColor: member.cssColor }}
                    >
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="font-display font-medium text-ink text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-blue">
                        {member.role}
                        {member.isOptIn && <span className="ml-1 text-ink/40">(opt-in)</span>}
                      </p>
                    </div>
                  </div>

                  <p className="text-ink-light font-body text-sm leading-relaxed italic">
                    &ldquo;{member.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What Actually Changes */}
      <div className="relative z-10 bg-parchment border-y border-ink/8">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="inline-block text-3xl md:text-4xl font-medium font-display text-ink relative">
                What Actually Changes
                <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terracotta/40 to-transparent" />
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {[
                {
                  title: 'Blind spots surfaced',
                  description: 'Six perspectives find gaps your thinking can\u2019t. The investor sees what the operator misses. The coach sees what the investor ignores.',
                },
                {
                  title: 'Kill-or-go decisions, faster',
                  description: 'Accelerates the decision you\u2019re avoiding. Not more data, just sharper questions from people who aren\u2019t afraid to ask them.',
                },
                {
                  title: 'Challenged thinking, not validated thinking',
                  description: 'Names tensions, pokes weak spots, surfaces the thing nobody in the room wants to say. That\u2019s the value.',
                },
                {
                  title: 'A session artifact you can share',
                  description: 'Scorecard and reasoning you can hand to a co-founder, advisor, or investor. Not a chatbot transcript.',
                },
              ].map((outcome, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center mt-0.5">
                    <span className="text-terracotta font-display font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-ink mb-1">{outcome.title}</h3>
                    <p className="text-ink-light font-body text-sm leading-relaxed">{outcome.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Who Built This */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="w-16 h-px bg-ink/10" />
              <span className="text-sm font-display text-ink/40 tracking-widest uppercase">Built by</span>
              <div className="w-16 h-px bg-ink/10" />
            </div>

            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-medium font-display text-ink mb-2">
                Kevin Holland
              </h3>
              <p className="text-ink-light font-body mb-6 text-sm">
                Naval officer. Healthcare data product leader. 15 years building products that ship. $9M ARR. 800+ hours in Claude Code.
              </p>
              <p className="text-ink-light font-body leading-relaxed max-w-2xl mx-auto italic">
                ThinkHaven exists because I kept watching smart people build the wrong thing. Not because the idea was bad, but because nobody challenged it hard enough, early enough.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative z-10 bg-terracotta">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-medium font-display text-cream mb-6 leading-tight">
              Building is easier than ever.
              <br />
              <span className="italic">Deciding what to build is hard.</span>
            </h2>

            <div className="mb-10">
              <Button
                size="lg"
                className="group px-10 py-6 text-lg font-medium font-display bg-cream text-ink hover:bg-parchment transition-all duration-200"
                asChild
              >
                <Link href="/try">
                  Start a Free Session
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="border-t border-cream/20 pt-8">
              <p className="text-cream/70 text-sm mb-4">Want updates instead? Leave your email.</p>
              <div className="max-w-md mx-auto">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-ink text-cream">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-1">
                <h3 className="text-2xl font-medium font-display mb-3 text-cream">ThinkHaven</h3>
                <p className="text-cream/60 font-body mb-6 max-w-sm">
                  Pressure-test your thinking before the room does.
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
                <h4 className="font-medium font-display mb-4 text-cream/90">Try It</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link href="/try" className="text-cream/60 hover:text-cream transition-colors">
                      Free Session
                    </Link>
                  </li>
                  <li>
                    <Link href="/assessment" className="text-cream/60 hover:text-cream transition-colors">
                      Strategy Assessment
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium font-display mb-4 text-cream/90">Connect</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="mailto:kevin@kevintholland.com" className="text-cream/60 hover:text-cream transition-colors">
                      Email Kevin
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-cream/10 mt-12 pt-8 text-center">
              <p className="text-cream/40 text-sm">&copy; 2026 ThinkHaven. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
