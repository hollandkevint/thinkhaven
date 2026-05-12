# ThinkHaven

Decision architecture platform for people who need to pressure-test strategic choices before they build, pitch, publish, or defend them.

ThinkHaven turns a messy idea into a defensible artifact: what to build, kill, pivot, defer, or defend, and why. The hosted product provides adaptive sessions, memory, artifact generation, and a board of advisors with distinct worldviews.

**Live application:** https://thinkhaven.co

## Open Method

ThinkHaven's public method layer lives in the open-source [ThinkHaven Method Kit](https://github.com/hollandkevint/thinkhaven-method-kit). Use the kit to run prompts and playbooks manually; use the hosted product when you want guided sessions, memory, artifacts, and board-style pressure-testing.

## Local Development

Run commands from `apps/web/`:

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Product Shape

- **Artifact first:** chat is the input; the work product is a shareable decision artifact.
- **Anti-sycophancy:** the system challenges assumptions instead of validating them.
- **Board of advisors:** Mary facilitates while Victoria, Casey, Elaine, Omar, and Taylor apply distinct decision lenses.
- **Hosted execution layer:** the app turns open decision methods into adaptive, persistent sessions.

## Repository Structure

```text
thinkhaven/
├── apps/web/       # Next.js application
├── docs/           # Product, architecture, plans, stories, and operations docs
├── packages/       # Shared packages
└── supabase/       # Database migrations and support files
```

## Quality

Primary checks:

```bash
npm run lint
npm run test:run
npm run test:e2e
```

See `AGENTS.md` for project-specific commands, constraints, and known test status.

## Contact

Kevin Holland

kevin@thinkhaven.co
