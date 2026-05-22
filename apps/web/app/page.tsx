import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'
import { ArrowRight, BookOpen, Github, Mail, MapPin } from 'lucide-react'
import { BOARD_MEMBERS, getBoardMember } from '@/lib/ai/board-members'
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
const mary = getBoardMember('mary')
const victoria = getBoardMember('victoria')

export default function Home() {
  return (
    <div className="min-h-screen bg-cream overflow-hidden">
      {/* Hero Section: two-column layout */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Left Column: Copy */}
            <div className="text-center lg:text-left mb-12 lg:mb-0">
              {/* Beta Badge */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-display font-medium tracking-wider uppercase mb-6 animate-fadeIn"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-forest animate-beta-pulse" />
                Beta
              </span>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-medium font-display text-ink mb-6 leading-[1.1] tracking-tight animate-fadeIn"
              >
                Six advisors that{' '}
                <span className="font-semibold">challenge your thinking, not validate it.</span>
              </h1>

              <p
                className="text-lg md:text-xl text-ink-light font-body mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fadeIn"
                style={{ animationDelay: '100ms' }}
              >
                A personal board with distinct worldviews. They pressure-test your
                strategy, surface blind spots, and sharpen your decision before you
                have to defend it.
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
                <Button
                  size="lg"
                  variant="outline"
                  className="group px-8 py-5 text-lg font-medium font-display border-ink/20 text-ink hover:bg-parchment transition-all duration-200"
                  asChild
                >
                  <Link href="/try?mode=plan-grill">
                    Grill a Plan
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              <p
                className="text-sm text-slate-blue animate-fadeIn"
                style={{ animationDelay: '300ms' }}
              >
                No account needed. No credit card. 10 free messages to see if it&apos;s for you.
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
                        className="bg-cream rounded-lg rounded-tl-sm p-3 text-sm font-body text-ink border border-ink/10"
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
                        className="bg-cream rounded-lg rounded-tl-sm p-3 text-sm font-body text-ink border border-ink/10"
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
          Currently in beta with product leaders and founders pressure-testing real strategic decisions.
        </p>
      </div>

      {/* Product Sequence */}
      <div className="relative z-10 bg-parchment border-y border-ink/8">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl mb-12">
              <h2 className="text-3xl md:text-4xl font-medium font-display text-ink">
                Artifact. Decision. Confidence.
              </h2>
              <p className="text-ink-light font-body text-lg leading-relaxed mt-4">
                ThinkHaven is a decision architecture platform. Chat is the input. The work product is a shareable artifact that makes the case for what to build, kill, pivot, defer, or defend.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  label: 'Artifact',
                  title: 'A written output, not a transcript.',
                  description: 'The session is shaped around the brief, scorecard, canvas, or structured analysis you can hand to someone else.',
                },
                {
                  label: 'Decision',
                  title: 'A clear call with reasoning behind it.',
                  description: 'The board pressures the choice until the weak points are visible and the next move is named plainly.',
                },
                {
                  label: 'Confidence',
                  title: 'Know where the case is strong and fragile.',
                  description: 'You leave sharper, not validated. The point is to defend the decision with the risks still in view.',
                },
              ].map((item) => (
                <div key={item.label} className="border-t border-ink/12 pt-5">
                  <p className="text-xs font-display font-medium tracking-wider uppercase text-terracotta mb-3">{item.label}</p>
                  <h3 className="font-display font-medium text-ink mb-3 text-lg">{item.title}</h3>
                  <p className="text-ink-light font-body text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open Method Section */}
      <div className="relative z-10 bg-cream border-y border-ink/8">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 items-start">
              <div>
                <p className="text-xs font-display font-medium tracking-wider uppercase text-terracotta mb-4">
                  Open method
                </p>
                <h2 className="text-3xl md:text-4xl font-medium font-display text-ink leading-tight">
                  The method is public. The platform makes it adaptive.
                </h2>
              </div>

              <div>
                <p className="text-ink-light font-body text-lg leading-relaxed mb-8">
                  ThinkHaven publishes its decision architecture techniques as an open
                  Method Kit: prompts, playbooks, and pressure-testing drills you can
                  run manually. Use the hosted product when you want those methods
                  facilitated live with memory, artifacts, and a board that adapts as
                  the decision gets sharper.
                </p>

                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="border-t border-ink/12 pt-5">
                    <BookOpen className="w-5 h-5 text-terracotta mb-4" aria-hidden="true" />
                    <h3 className="font-display font-medium text-ink mb-2">Run the kit manually</h3>
                    <p className="text-ink-light font-body text-sm leading-relaxed">
                      Fork the public Method Kit, copy a playbook, and pressure-test a
                      positioning, product, or client decision in your own workspace.
                    </p>
                  </div>

                  <div className="border-t border-ink/12 pt-5">
                    <Github className="w-5 h-5 text-terracotta mb-4" aria-hidden="true" />
                    <h3 className="font-display font-medium text-ink mb-2">Bring it into ThinkHaven</h3>
                    <p className="text-ink-light font-body text-sm leading-relaxed">
                      The app turns the same method into guided sessions, durable
                      artifacts, and board-style pressure from advisors who disagree.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="group bg-ink text-cream hover:bg-ink/90 font-display"
                    asChild
                  >
                    <a href="https://github.com/hollandkevint/thinkhaven-method-kit" target="_blank" rel="noreferrer">
                      View Method Kit
                      <Github className="w-4 h-4 ml-2" aria-hidden="true" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="group border-ink/20 text-ink hover:bg-parchment font-display"
                    asChild
                  >
                    <Link href="/try?mode=plan-grill">
                      Grill a Plan
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board of Directors Section */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl mb-10">
              <h2 className="text-3xl md:text-4xl font-medium font-display text-ink">
                Six advisors, one decision under pressure.
              </h2>
              <p className="text-ink-light font-body text-lg leading-relaxed mt-4">
                Mary facilitates. Victoria, Casey, Elaine, Omar, and Taylor bring different lenses to the same strategic question. They are useful because they do not all agree.
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
              <div className="space-y-3">
                {boardMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 py-2 border-b border-ink/8 last:border-b-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-cream font-display font-bold text-xs"
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
                ))}
              </div>

              <div className="bg-parchment rounded-lg border border-ink/10 p-6 md:p-8">
                <p className="text-xs font-display font-medium tracking-wider uppercase text-terracotta mb-4">Example pressure</p>
                <div className="space-y-5">
                  {[mary, victoria].map((member) => (
                    <div key={member.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-cream font-display font-bold text-xs flex-shrink-0"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-xs text-slate-blue font-display mb-1">
                          <span className="font-medium text-ink">{member.name}</span> &middot; {member.role}
                        </p>
                        <p className="text-ink-light font-body text-sm leading-relaxed italic">
                          &ldquo;{LANDING_QUOTES[member.id]}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              The next decision you have to defend deserves more than a yes-man chatbot.
              Get pressure-tested by six advisors who aren&apos;t afraid to disagree with you, or each other.
            </p>

            <div className="mb-10">
              <Button
                size="lg"
                className="group px-10 py-6 text-lg font-medium font-display bg-cream text-ink hover:bg-parchment transition-all duration-200"
                asChild
              >
                <Link href="/try">
                  Try a Free Session
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
                  A personal board of advisors for product leaders.
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
                      Try a Free Session
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
