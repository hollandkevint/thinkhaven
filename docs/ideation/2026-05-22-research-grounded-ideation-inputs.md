---
date: 2026-05-22
topic: research-grounded-ideation-inputs
focus: docs/research
mode: repo-grounded
---

# Ideation Inputs: Research Folder

## Source Inventory

- `docs/research/README.md` frames the folder as intellectual foundations for ThinkHaven positioning, mode design, target user, and roadmap decisions.
- `docs/research/dan-hock-how-to-use-ai.md` maps structured exploration, valley-of-despair avoidance, No-Man mode, Executive Prep, and Early Adopter targeting.
- `docs/research/nate-jones-prompting-to-briefing.md` maps the six-field senior-partner brief: goal, context, sources, constraints, quality bar, and definition of done.
- `docs/research/nate-jones-ai-communication-prompt-kit.md` maps Useful Question Builder to Assessment, Vague Ask Auditor to Stress Test, and Definition-of-Done Generator to Executive Prep.
- `docs/research/strategy_adlib.md` collects John Cutler strategy mad libs that force contrast, trade-offs, defensible differentiation, and anti-fuzzy strategy language.

## Ideation-Relevant Themes

### 1. Brief quality is a product surface

The research argues that generic AI output usually reflects a thin or ambiguous assignment. ThinkHaven can turn brief completeness into an explicit product surface: not a form, but a conversational spine that ensures goal, context, sources, constraints, quality bar, and definition of done exist before serious output starts.

**Possible ideas:**

- Brief Completeness Meter inside sessions.
- Mary asks only the missing brief field instead of generic follow-up questions.
- Artifact footer showing which brief fields are strong, weak, or absent.

### 2. The scaffold is the deliverable before the answer

Nate Jones's prompt kit refuses to start the real task until the ask is clarified. That maps directly to ThinkHaven's pressure-test identity: the first value is not the recommendation, but the sharper assignment that makes the recommendation possible.

**Possible ideas:**

- "Vague Ask Auditor" mode inside hosted ThinkHaven.
- Pre-output gate: Mary must restate the decision under review and quality bar before producing an artifact.
- Method Kit benchmark comparing hosted sessions against standalone prompt-kit outputs.

### 3. Definition of done should become a first-class artifact

The research treats definition of done as the stopping rule that prevents drift. ThinkHaven currently emphasizes decision records and lean canvases; it could add a smaller artifact that names what finished means for the decision, client recommendation, or executive room.

**Possible ideas:**

- Definition-of-Done artifact type.
- "Will this survive the room?" Executive Prep checklist.
- Session wrap-up that states the stopping point and what evidence would reopen the decision.

### 4. No-Man mode is the valley-of-despair countermeasure

Dan Hock's note says many users stop when AI becomes shallow or agreeable. ThinkHaven's anti-sycophancy and board disagreement should be designed to force the session through that moment instead of letting the user accept a polished shallow answer.

**Possible ideas:**

- "You are entering the hard part" moment when Mary detects vague confidence.
- Board disagreement receipt that records which advisor refused the easy answer.
- Confidence cannot rise until the weakest assumption has a named test.

### 5. Strategy tension is reusable pressure-test material

The Cutler strategy ad-libs are useful because they force contrast: what the product will and will not do, which competitor strengths it will not chase, and where ambiguity is acceptable. This fits ThinkHaven's board-style pressure-testing and consultant artifact needs.

**Possible ideas:**

- Strategy Mad-Lib pressure-test template for product leaders and consultants.
- Artifact section: "The strategic tension this decision creates."
- Mary uses one Cutler-style fill-in when a user gives fuzzy strategy language.

## How Future Ideation Should Use This Folder

When running `ce-ideate` for ThinkHaven product direction, include `docs/research` as grounding alongside `STRATEGY.md`, `README.md`, and recent solution notes.

Treat the research folder as:

- **Constraint:** Do not generate ideas that make ThinkHaven a generic answer engine. The research points toward scaffolded judgment before output.
- **Opportunity map:** Look for product surfaces around brief completeness, vague-ask auditing, definition of done, structured exploration, and strategy tension.
- **Quality bar:** Strong ideas should reduce the activation cost of expert-level AI use without turning the product into a long form or prompt library.
- **Evaluation input:** Compare hosted ThinkHaven sessions against the standalone prompts and strategy ad-libs. If the hosted session produces a thinner brief or weaker tension than the prompt, the hosted mode is underperforming.

## Research-Grounded Candidate Ideas

### 1. Brief Completeness Meter

A subtle session-side indicator that tracks whether the decision has a clear goal, context, sources, constraints, quality bar, and definition of done.

**Why it matters:** It operationalizes Nate Jones's senior-partner brief without making the user fill a form.

### 2. Definition-of-Done Artifact

A short artifact that states what finished means, what evidence would reopen the decision, and what the user should stop doing.

**Why it matters:** It gives Executive Prep and consultant workflows a durable stopping rule.

### 3. Vague Ask Auditor

A hosted pressure-test mode that takes a messy request, identifies missing brief fields, and rewrites the ask before any execution.

**Why it matters:** It productizes the research folder's strongest shared claim: most AI work fails upstream of the answer.

### 4. Strategy Tension Generator

Use Cutler-style prompts to force contrast: what ThinkHaven, a client strategy, or a product bet will and will not optimize for.

**Why it matters:** It makes fuzzy strategy audible and gives consultants stronger language for recommendations.

### 5. Hosted-vs-Prompt Benchmark

Run the same user task through the standalone prompt kit and ThinkHaven. Compare whether ThinkHaven produces a stronger brief, clearer assumptions, better definition of done, and more defensible next move.

**Why it matters:** It creates an evaluation loop for the hosted execution layer and gives the Method Kit credible open-source testing material.
