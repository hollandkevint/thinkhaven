'use client'

export function FirstSessionWelcome() {
  return (
    <div className="max-w-2xl w-full mb-10 border-l-0 border-t border-ink/10 pt-6">
      <p className="font-body text-sm text-ink-light leading-relaxed mb-3">
        ThinkHaven sessions produce three things, in this order:
      </p>
      <p className="font-body text-base text-ink leading-relaxed mb-3">
        <span className="font-display font-medium">An artifact</span> you can share.{' '}
        <span className="font-display font-medium">A decision</span> you can defend.{' '}
        <span className="font-display font-medium">Confidence</span> in where it&rsquo;s strong and where
        it isn&rsquo;t.
      </p>
      <p className="font-body text-sm text-ink-light leading-relaxed">
        Start by describing the decision you&rsquo;re trying to make.
      </p>
    </div>
  )
}
