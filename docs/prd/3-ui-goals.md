# User Interface Design Goals

## Overall UX Vision

### Primary UX Principles
The ThinkHaven interface embodies **"Decision Architecture"** - providing sophisticated strategic thinking capabilities through a conversation-first experience that delivers polished, portable outputs.

**Core Experience Goals:**
- **Conversational Depth:** AI interactions feel like pressure-testing with an expert who provides genuine pushback
- **Structured Progression:** Enforced methodology that can't be skipped, with clear pathway guidance
- **Output Excellence:** Professional documents (Lean Canvas, PRD/Spec) that travel to next tools
- **Confident Guidance:** Interface provides clear direction while challenging assumptions when warranted

### User Mental Model
Users should experience the platform as a **"Decision Architecture Platform"** rather than a tool:
- Conversation feels like a strategic partner that challenges AND encourages
- Sub-persona modes (Inquisitive, Devil's Advocate, Encouraging, Realistic) provide balanced feedback
- Session progression feels structured with enforced methodology
- Output focus: users leave with polished documents, not just conversation history

## Key Interaction Paradigms

### Conversation-First Design
- **Text Output Primary:** Structured documents (Lean Canvas, PRD/Spec) are the core deliverables
- **Visual Workspace Secondary:** Canvas/diagrams are nice-to-have, not critical path
- **Sub-Persona Balancing:** AI dynamically shifts between modes based on user state
- **Anti-Sycophancy:** System provides genuine pushback, not just validation

### Conversational Interface Patterns
- **Streaming Responses:** Real-time AI text generation with smooth typing animation
- **Context Awareness:** Previous conversation history influences current response suggestions
- **Progressive Questioning:** Questions become more sophisticated as session develops
- **Mode Transparency:** Users can see/influence which sub-persona mode is active (post-MVP)

### Session Flow Management
- **Pathway Selection:** Clear entry points for "New Idea," "Business Model," "Feature Refinement"
- **Progress Indicators:** Visual representation of session phase progression
- **Session Duration:** 10-30 minutes target (not 3 minutes, not hour-long)
- **Output Generation:** Clear transition to polished document export at session completion

### Visual Workspace (Post-MVP)
- **Low-Fi Visuals:** Excalidraw-style sketches for workflow diagrams and concept maps
- **Mermaid Diagrams:** Complex diagrams created through conversation when needed
- **Export Options:** PNG, SVG for visual artifacts
- **Note:** Canvas is a downstream enhancement, not core value proposition

## Core Screens and Views

### Session Launcher Screen
- **Pathway Cards:** Three prominent cards for "New Idea," "Business Model Problem," "Feature Refinement"
- **Previous Sessions:** Quick access to resume or review past strategic thinking sessions
- **Onboarding Flow:** First-time user guidance without overwhelming experienced users
- **Settings Access:** Profile and preferences accessible but not prominent

### Main Conversation Workspace
- **Chat Interface (Primary):** Conversational interface with Mary
  - Message history with clear threading
  - Typing indicators and response streaming
  - Session timer and phase indicators
  - Sub-persona mode indicator (which mode is currently active)
- **Output Preview (Secondary):** Document generation preview
  - Real-time Lean Canvas population
  - PRD/Spec section building
  - Export controls and format selection

### Session Summary & Export View
- **Outcome Overview:** Key insights and decisions from strategic thinking session
- **Viability Assessment:** Kill score / viability rating when warranted
- **Generated Documents:** Lean Canvas, PRD/Spec ready for export
- **Export Options:** PDF, Markdown formats with professional formatting

### Settings & Profile Management
- **Session Preferences:** Default pathway, session duration preferences
- **Output Preferences:** Default export format, branding options
- **Account Management:** Subscription, usage analytics, and privacy controls

## Accessibility Requirements

### WCAG AA Compliance
- **Keyboard Navigation:** All functionality accessible via keyboard shortcuts
- **Screen Reader Support:** Proper ARIA labels and semantic HTML structure
- **Color Contrast:** Minimum 4.5:1 contrast ratio for all text and interactive elements
- **Focus Management:** Clear focus indicators and logical tab order throughout interface
- **Alternative Text:** Meaningful descriptions for all visual content and generated diagrams

### Cognitive Accessibility
- **Clear Language:** Avoid jargon and provide definitions for strategic thinking terminology
- **Consistent Patterns:** Predictable interaction models throughout the platform
- **Error Prevention:** Clear validation and confirmation for important actions
- **Help Context:** Contextual assistance without overwhelming primary workflow

## Branding & Visual Identity

### Design Language
- **Professional Warmth:** Sophisticated but approachable aesthetic suitable for business contexts
- **Strategic Focus:** Visual hierarchy emphasizes content and thinking over decorative elements
- **Collaborative Feel:** Design suggests partnership rather than tool usage
- **Growth Orientation:** Visual metaphors suggest progress, development, and strategic advancement

### Color Palette & Typography (Implemented)
- **Design System:** Wes Anderson-inspired palette — cream, parchment, terracotta, forest, ink
- **Typography:** Jost (display), Libre Baskerville (body), JetBrains Mono (code) — loaded via `next/font`
- **Accent Colors:** Strategic use of color to guide attention and indicate status/progress
- **Iconography:** Simple, consistent icons that support rather than distract from strategic thinking

### Beta Waitlist UX (Implemented)
- **Waitlist Signup:** Landing page form captures email, creates `beta_access` row
- **Pending State:** "You're on the list" page for unapproved users (no blank screens)
- **Approval Flow:** Admin sets `approved_at` → JWT claim updates → user gains `/app/*` access
- **Error States:** Skeleton loaders, retry buttons, clear error messages across all async operations

## Target Device and Platforms

### Web Responsive (Primary)
- **Desktop First:** Optimized for large screens where strategic thinking sessions typically occur
- **Tablet Adaptive:** Touch-friendly interactions for iPad and similar devices
- **Mobile Aware:** Core functionality accessible on mobile but optimized for larger screens

### Performance Considerations
- **Progressive Loading:** Canvas and AI features load incrementally based on session needs
- **Offline Capability:** Essential functionality works during network interruptions
- **Resource Management:** Efficient handling of large conversation histories and visual content