'use client'

/**
 * Executive badge shown in the session header for executive-prep sessions.
 * Changes the AI label from "Mary" to "ThinkHaven Advisor".
 */
export default function ExecutiveBadge() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-ink">ThinkHaven Advisor</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-ink text-cream uppercase tracking-wide">
        Executive
      </span>
    </div>
  );
}
