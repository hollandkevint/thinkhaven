# Integration Requirements

*Updated February 2026 — Decision Architecture Evolution*

## Claude API Integration

### API Configuration
- **Model**: Claude Sonnet 4 (via @anthropic-ai/sdk)
- **Max Tokens**: 4096 for strategic responses
- **Temperature**: 0.7 for balanced creativity and consistency
- **System Prompts**: Sub-persona weighted prompts with pathway-specific behavior
- **Tool Calling**: 9 agent-native tools with agentic loop (max 5 rounds per message)

### Sub-Persona System Integration (Implemented)

**System Prompt Structure:**
```
[Base Mary Persona]
[Current Pathway Context]
[Sub-Persona Weights: {inquisitive: X%, devilsAdvocate: Y%, encouraging: Z%, realistic: W%}]
[Current Mode: {active mode based on weights and dynamic shifting}]
[Kill Recommendation Framework: escalation sequence]
```

**Dynamic Mode Shifting Triggers:**
- User defensive → shift to Encouraging before returning to challenge
- User overconfident → lean into Devil's Advocate
- User spinning → bring in Realistic to ground

### Agent-Native Tool Integration (Implemented)

Mary has 9 tools that enable agent-controlled session progression:

| Tool | Purpose |
|------|---------|
| `discover_pathways` | List available strategic pathways |
| `discover_phase_actions` | List actions available in a phase |
| `discover_document_types` | List available document generators |
| `read_session_state` | Read current session phase/progress/mode |
| `complete_phase` | Signal phase completion and advance |
| `switch_persona_mode` | Change coaching mode dynamically |
| `recommend_action` | Provide viability recommendation (proceed/pivot/kill) |
| `generate_document` | Generate Lean Canvas, PRD, or other documents |
| `update_session_context` | Record insights for later document generation |

**Architecture:**
- Tool definitions in `lib/ai/tools/index.ts` (MARY_TOOLS array)
- Execution via `lib/ai/tool-executor.ts`
- Agentic loop in `/api/chat/stream/route.ts` (max 5 rounds)
- Results formatted via `ToolExecutor.formatResultsForClaude()`

### Conversation Management
- **Context Window**: Last 10-15 conversation turns
- **Message Format**: Structured JSON with sub-persona mode tracking
- **Session Continuity**: Persistent threads with mode state
- **Pathway Context**: Weights injected at session start based on pathway selection

### Streaming Implementation
- **Response Streaming**: Server-Sent Events for real-time responses
- **Partial Response Handling**: Progressive UI updates
- **Mode Indicators**: (Post-MVP) Show which mode is currently active

## Output Generation Integration

### Lean Canvas Generator
- **Data Source**: Extract from conversation history
- **Sections**: Problem, Solution, Key Metrics, Unique Value Proposition, etc.
- **Format**: Structured markdown/PDF with professional formatting

### PRD/Spec Generator
- **Data Source**: Extract from conversation history
- **Sections**: Overview, Goals, Requirements, User Stories, etc.
- **Format**: Detailed working document suitable for dev handoff

### Viability Score Integration
- **Kill Recommendation**: Include in output when applicable
- **Score Components**: Market fit, feasibility, risk factors
- **Display**: Clear viability rating with reasoning

## Session Management Integration

### Session Duration
- **Target Duration**: 10-30 minutes per session
- **Progress Tracking**: Phase indicators showing session progression
- **Auto-Save**: Session state saved every 30 seconds
- **Resume Capability**: Users can pause and resume sessions

### Trial Flow Integration
- **Message Limit**: 10 messages for guest users (up from 5)
- **Partial Output**: Provide partial Lean Canvas at gate
- **Value First**: Show real value before requiring signup
- **Smooth Conversion**: Preserve context through signup flow

## Error Handling & Resilience

### Claude API Error Management
- **Rate Limit Handling**: Graceful queuing and retry logic
- **Timeout Management**: 30-second timeout with retry option
- **Service Degradation**: Fallback modes when Claude API is unavailable
- **Error Logging**: Comprehensive error tracking for debugging

### User Experience Continuity
- **Session Recovery**: Automatic restoration after connection issues
- **Data Validation**: Client and server-side validation
- **Graceful Degradation**: Core functionality available during AI issues

## Performance Optimization

### Response Optimization
- **Streaming**: Server-Sent Events for real-time responses
- **Compression**: Gzip compression for streaming
- **CDN Integration**: Static assets served through CDN
- **Database Optimization**: Efficient queries for conversation history

### Scaling Considerations
- **Connection Pooling**: Efficient database connection management
- **API Rate Management**: Intelligent batching for Claude API calls
- **Memory Management**: Efficient conversation history in browser