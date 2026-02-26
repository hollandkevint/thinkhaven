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

// Board members used in chat preview mock
const mary = BOARD_MEMBERS.find(m => m.id === 'mary')!
const victoria = BOARD_MEMBERS.find(m => m.id === 'victoria')!

export default function Home() {
  return (
    <div className="min-h-screen bg-cream overflow-hidden">
      {/* Hero Section — Two-column layout */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Left Column: Copy */}
            <div className="text-center lg:text-left mb-12 lg:mb-0">
              {/* Alpha Badge */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-display font-medium tracking-wider uppercase mb-6 animate-fadeIn"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
                Alpha
              </span>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-medium font-display text-ink mb-6 leading-[1.1] tracking-tight animate-fadeIn"
              >
                AI-powered strategic advisors that
                {' '}
                <span className="text-rust italic">challenge your thinking</span>
                {' '}&mdash; not validate it.
              </h1>

              <p
                className="text-lg md:text-xl text-ink-light font-body mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fadeIn"
                style={{ animationDelay: '100ms' }}
              >
                ThinkHaven gives product leaders a personal board of directors:
                six AI advisors with distinct worldviews who pressure-test your
                strategy, surface blind spots, and help you make better decisions.
              </p>

              <div
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-4 animate-fadeIn"
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
              </div>

              <p
                className="text-sm text-slate-blue animate-fadeIn"
                style={{ animationDelay: '300ms' }}
              >
                No account needed. No credit card. 5 messages to see if it&apos;s for you.
              </p>
            </div>

            {/* Right Column: Chat Preview Mock */}
            <div className="flex justify-center lg:justify-end animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <div className="w-full max-w-[420px] bg-parchment rounded-xl border border-ink/10 shadow-lg overflow-hidden">
                {/* Mock Header */}
                <div className="bg-cream border-b border-ink/8 px-4 py-3 flex items-center justify-between">
                  <span className="font-display font-medium text-sm text-ink">ThinkHaven Session</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-ink/8" />
                    <div className="w-6 h-6 rounded bg-ink/8" />
                  </div>
                </div>

                {/* Mock Chat Area */}
                <div className="p-4 space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-terracotta text-cream rounded-xl rounded-br-sm p-3 text-sm font-body max-w-[85%]">
                      I&apos;m considering pivoting our B2B SaaS to focus on mid-market instead of enterprise.
                    </div>
                  </div>

                  {/* Mary's Response */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-cream font-display text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: mary.color }}
                    >
                      M
                    </div>
                    <div>
                      <p className="text-xs text-slate-blue font-display mb-1">
                        <span className="font-medium text-ink">{mary.name}</span> &middot; {mary.role}
                      </p>
                      <div
                        className="bg-cream rounded-lg rounded-tl-sm p-3 text-sm font-body text-ink border border-ink/6"
                        style={{ borderLeftColor: mary.color, borderLeftWidth: '3px' }}
                      >
                        That&apos;s a significant shift. Let me bring in Victoria, because this is really about whether the economics work.
                      </div>
                    </div>
                  </div>

                  {/* Victoria's Response */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-cream font-display text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: victoria.color }}
                    >
                      V
                    </div>
                    <div>
                      <p className="text-xs text-slate-blue font-display mb-1">
                        <span className="font-medium text-ink">{victoria.name}</span> &middot; {victoria.role}
                      </p>
                      <div
                        className="bg-cream rounded-lg rounded-tl-sm p-3 text-sm font-body text-ink border border-ink/6"
                        style={{ borderLeftColor: victoria.color, borderLeftWidth: '3px' }}
                      >
                        Walk me through your unit economics. What&apos;s your current CAC for enterprise vs. what you project for mid-market?
                      </div>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-cream font-display text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: victoria.color }}
                    >
                      V
                    </div>
                    <div className="flex items-center gap-1 px-3 py-2.5 bg-cream rounded-lg border border-ink/6">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>

                {/* Mock Input Bar */}
                <div className="bg-cream border-t border-ink/8 px-4 py-3 flex items-center gap-2">
                  <div className="flex-1 bg-parchment rounded-lg px-3 py-2 text-sm text-ink/40 font-body">
                    Type your strategic challenge...
                  </div>
                  <div className="bg-terracotta rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-cream" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-16 h-px bg-ink/10" />
          <div className="w-2 h-2 rounded-full bg-terracotta/40" />
          <div className="w-16 h-px bg-ink/10" />
        </div>
      </div>

      {/* Social Proof Bar */}
      <div className="relative z-10 py-6">
        <p className="text-center text-sm font-display text-ink-light tracking-wide">
          Join <strong className="text-ink">50+ product leaders and founders</strong> pressure-testing their strategies in Alpha
        </p>
      </div>

      {/* How It Works */}
      <div className="relative z-10 bg-parchment border-y border-ink/8">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="inline-block text-3xl md:text-4xl font-medium font-display text-ink relative">
                How It Works
                <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-terracotta/40 to-transparent" />
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-10 mb-12">
              {[
                {
                  step: 1,
                  title: 'Describe your strategic challenge',
                  description: 'Share what you\u2019re working on \u2014 a new product bet, a pivot decision, a go-to-market question. Whatever keeps you up at night.',
                },
                {
                  step: 2,
                  title: 'Your board pushes back',
                  description: 'An exploration agent iterates with you \u2014 asking hard questions, pushing back on assumptions, and surfacing blind spots through six distinct advisor lenses.',
                },
                {
                  step: 3,
                  title: 'Walk away with clarity',
                  description: 'Get your blind spots surfaced, your assumptions tested, and a sharper sense of whether to go, kill, or pivot.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-terracotta font-display font-bold text-lg">{item.step}</span>
                  </div>
                  <h3 className="font-display font-medium text-ink mb-2 text-lg">{item.title}</h3>
                  <p className="text-ink-light font-body text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
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
            </div>
          </div>
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
              Six AI advisors with distinct worldviews. They disagree with each other. That&apos;s the point.
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

      {/* What You Walk Away With */}
      <div className="relative z-10 bg-parchment border-y border-ink/8">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="inline-block text-3xl md:text-4xl font-medium font-display text-ink relative">
                What You Walk Away With
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
                  title: 'A session artifact worth sharing',
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
              <p className="text-ink-light font-body leading-relaxed max-w-2xl mx-auto italic mb-8">
                ThinkHaven exists because I kept watching smart people build the wrong thing. Not because the idea was bad, but because nobody challenged it hard enough, early enough.
              </p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative z-10 bg-terracotta">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-medium font-display text-cream mb-6 leading-tight">
              Stop building the wrong thing.
            </h2>
            <p className="text-cream/80 font-body text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Your next strategic decision deserves more than a yes-man chatbot.
              Get challenged by six advisors who aren&apos;t afraid to say what nobody else will.
            </p>

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
                  AI-powered strategic advisors for product leaders.
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
