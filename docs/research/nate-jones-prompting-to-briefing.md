# 68% of AI Power Users Do One Thing Differently — And It Is Not a Prompt Trick
*By Nate Jones*
Source: https://natesnewsletter.substack.com/

## Summary

Jones argues the dominant pattern of AI interaction has shifted under most users' feet. The Opus 4.7 and GPT-5.5 capability jump produced agents that run for hours on a single request, edit files, search archives, and return close-to-finished artifacts. The old guidance, talk to AI like a careful junior who needs every step spelled out, was right for the models we had and wrong for the ones we now use. The new pattern is briefing a senior partner: a complete enough work order that another intelligence can act on it without guessing.

The brief has six fields: **goal** (the outcome, not the activity), **context** (what a colleague joining late would need to know), **sources** (which materials to use, with their role and hierarchy), **constraints** (boundaries that keep the work from being technically correct and practically wrong), **quality bar** (what makes the output good, not what makes it look like the thing), and **definition of done** (the exact deliverable and the stopping point). Jones's worked example fits in one paragraph. The discipline is short; the practice is hard because it forces the user to decide what they mean before the agent runs.

Jones's central diagnostic: when AI returns generic, polished, useless work, the easy move is to blame the model. The accurate move is to recognize generic output as a mirror of the assignment. Most users are still writing September-2024 prompts into November-2025 agents and concluding the model is mediocre. The model is being honest about the brief.

## Mapping to Thinkhaven

Thinkhaven productizes the briefing pattern Jones describes, instead of leaving it as a discipline each user has to invent for themselves.

**1. The three modes are pre-built briefs.** Assessment, Stress Test, and Executive Prep encode the six-field brief structure (bounded scope, persistent context, sequencing of question types) so the user doesn't have to construct it from scratch each session. The mode is the goal-and-quality-bar half of the brief; the session captures the context and sources.

**2. The senior-partner shift is the product's wedge.** Jones's article assumes the user can do the briefing work themselves. Thinkhaven's bet is that most users can't, even when they want to. They default to "junior employee" prompting because the tooling treats them that way. Thinkhaven removes the activation cost of the brief.

**3. The generic-output trap is the failure mode Thinkhaven solves.** Jones names polished-but-useless output as a mirror of the assignment, not the model. Thinkhaven's session structure forces the assignment to evolve before the AI starts working, not after the output disappoints. The No-Man mode is the operational version of Jones's Vague Ask Auditor: take the user's request, surface what's missing field by field, push back before drafting.

**4. This article is a candidate POV anchor.** The Hock article anchors structured exploration as Thinkhaven's intellectual foundation. This Jones article anchors briefing-as-discipline. Together they triangulate the product thesis: structured exploration plus briefing discipline equals the value Thinkhaven productizes. Hock explains the workflow; Jones explains the input contract.

## Implication for the roadmap

If Jones is right that the gap between junior prompting and senior briefing is where most AI value now lives, Thinkhaven's mode-design should explicitly surface the six fields (goal, context, sources, constraints, quality bar, definition of done) at session start, not as a form but as conversation. The current mode UX should be audited against whether all six fields get established before the user gets useful output. Anything that ships polished output from a thin brief is a regression toward the failure mode Jones names, and risks producing the same valley-of-despair moment Hock describes from the opposite direction: the user concludes the product is shallow when the user's input was.

The Executive Prep mode in particular should adopt definition-of-done as a first-class artifact, not a closing flourish. Jones's framing ("a definition of done is mercy; it tells the agent where to stop") applies double to a product whose value depends on the user trusting the session to converge.
