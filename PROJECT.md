# ThinkHaven - Project Overview

**AI-Powered Strategic Thinking Workspace**

## Quick Start

```bash
# Clone and setup
cd apps/web
npm install
cp .env.example .env.local  # Add your keys

# Development
npm run dev                 # http://localhost:3000

# Testing
npm test                    # Unit tests
npm run test:e2e           # E2E tests

# Deploy
vercel --prod              # Deploy to production
```

## Project Structure

```
thinkhaven/
├── apps/
│   └── web/               # Main Next.js application
│       ├── app/           # Next.js App Router pages
│       ├── lib/           # Core business logic
│       │   ├── bmad/      # BMad Method engine
│       │   ├── ai/        # AI integration (Claude)
│       │   ├── auth/      # Supabase authentication
│       │   └── monetization/ # Stripe + credits
│       ├── components/    # React components
│       └── tests/         # Test suites
├── docs/                  # Documentation
└── CLAUDE.md             # Development guide
```

## Core Features

### 1. BMad Method Engine
Strategic thinking framework with AI-powered analysis
- **Location**: `apps/web/lib/bmad/`
- **Key files**: session-orchestrator.ts, pathway-router.ts
- **Pathways**: New idea, business model, feature refinement

### 2. AI Integration
Claude-powered conversations with streaming responses
- **Location**: `apps/web/lib/ai/`
- **API**: Anthropic Claude (Sonnet 4)
- **Persona**: Mary (business analyst)

### 3. Credit System
Session-based monetization with Stripe integration
- **Location**: `apps/web/lib/monetization/`
- **Trial**: 2 free credits on signup
- **Transactions**: Atomic with row-level locking

### 4. Canvas Workspace
Visual thinking with tldraw and Mermaid diagrams
- **Location**: `apps/web/lib/canvas/`
- **Features**: Real-time AI sync, export to PNG/SVG

## Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, tldraw
- **Backend**: Next.js API routes, Supabase
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Deployment**: Vercel (project: `thinkhaven`)

## Environment Setup

Required services:
1. **Supabase** - Database and authentication
   - Create project at supabase.com
   - Run migrations from `apps/web/supabase/migrations/`

2. **Anthropic** - AI API
   - Get API key from console.anthropic.com

3. **Stripe** - Payments (optional for development)
   - Get keys from dashboard.stripe.com

See `apps/web/.env.example` for complete list of environment variables.

## Development Workflow

### Local Development
```bash
cd apps/web
npm run dev              # Start with Turbopack
npm run lint             # Check code quality
npm run build            # Test production build
```

### Testing
```bash
npm test                 # Unit tests (Vitest)
npm run test:e2e         # E2E tests (7 smoke tests)
```

### Deployment
```bash
# Production deployment
cd apps/web
vercel link              # Link to thinkhaven project
vercel --prod            # Deploy to production
```

## Database

**Platform**: Supabase (PostgreSQL)

**Key Tables**:
- `bmad_sessions` - User sessions and progress
- `conversations` / `messages` - Chat history
- `user_credits` / `credit_transactions` - Monetization
- `credit_packages` / `payment_history` - Stripe integration

**Migrations**: Run in order (001 → 006) from `apps/web/supabase/migrations/`

## Active Vercel Projects

1. **thinkhaven** - This project
   - URL: https://thinkhaven.co

2. **neurobot** - Separate project
   - URL: https://neurobot-delta.vercel.app

3. **pmarchetype** - Separate project
   - URL: https://www.pmarchetype.com

## Key Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `vercel --prod` | Deploy to production |

## Documentation

- **CLAUDE.md** - Comprehensive development guide for AI assistants
- **docs/stories/** - Feature requirements and stories
- **docs/architecture/** - System architecture documentation
- **apps/web/tests/README.md** - Testing infrastructure guide

## Support

- **Repository**: https://github.com/hollandkevint/thinkhaven
- **Vercel Dashboard**: https://vercel.com/hollandkevints-projects/thinkhaven
- **Issues**: Create GitHub issues for bugs/features

---

## Strategic Direction (Feb 2026)

**Expanded Positioning:** ThinkHaven is evolving from pure idea validation into a **decision architecture** platform. The core insight: when build cost approaches zero, the bottleneck isn't ideas or even coding — it's specification and decision-making. ThinkHaven owns the gap between "I have information" and "I know what to do."

**Two Audience Tiers:**
- **Entry (Solo Entrepreneurs):** Validation sessions — "should I build this?" Structured methodology that produces artifacts, not just conversation. Competes with free prompt kits by offering persistent outputs and session continuity.
- **Growth (Executives & Product Leaders):** Strategy stress-testing — "will this hold up in the room?" Higher willingness to pay, less competition from free alternatives. Natural fit for anti-sycophancy positioning.

**"Dashboards to Decisions" Thesis:** Both audiences share the same problem — converting inputs (ideas, data, dashboards, market signals) into outputs (decisions, specs, go/no-go calls). The methodology is the same. The framing and pricing change.

**Full strategic context:** See vault note `Nate-Jones-Play-vs-Strategy-ThinkHaven-Analysis.md` in the Obsidian vault.

---

*Last Updated: February 8, 2026*

## CI/CD Status

**Active Workflows:**
- `e2e-tests.yml` - 7 smoke tests on push to main (✅ passing)
- `claude-code-review.yml` - Claude reviews on PRs
