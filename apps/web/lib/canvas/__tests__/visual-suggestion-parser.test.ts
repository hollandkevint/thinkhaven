/**
 * Visual Suggestion Parser Tests
 */

import { VisualSuggestionParser, filterByConfidence, type VisualSuggestion } from '../visual-suggestion-parser'

describe('VisualSuggestionParser', () => {
  describe('Explicit Mermaid Diagrams', () => {
    it('should extract explicit Mermaid flowchart', () => {
      const content = `Here's a flowchart for the process:

\`\`\`mermaid
flowchart TD
  Start --> Process --> End
\`\`\`

Let me know if you need changes.`

      const result = VisualSuggestionParser.parseMessage('msg-1', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions.length).toBeGreaterThanOrEqual(1)
      const explicitSuggestion = result.suggestions.find(s => s.confidence === 1.0)
      expect(explicitSuggestion).toBeDefined()
      expect(explicitSuggestion?.type).toBe('flowchart')
      expect(explicitSuggestion?.diagramCode).toContain('flowchart TD')
    })

    it('should detect sequence diagram type', () => {
      const content = `\`\`\`mermaid
sequenceDiagram
  User->>System: Request
  System-->>User: Response
\`\`\``

      const result = VisualSuggestionParser.parseMessage('msg-2', content, 'assistant')

      expect(result.suggestions[0].type).toBe('sequence')
    })

    it('should detect Gantt chart type', () => {
      const content = `\`\`\`mermaid
gantt
  title Project Timeline
  Task 1: 2025-01-01, 7d
\`\`\``

      const result = VisualSuggestionParser.parseMessage('msg-3', content, 'assistant')

      expect(result.suggestions[0].type).toBe('gantt')
    })
  })

  describe('Implicit Pattern Detection', () => {
    it('should detect flowchart opportunity from process language', () => {
      const content = `Let's break down the workflow into steps:
1. User starts the process
2. System validates input
3. If valid, proceed to processing
4. Otherwise, return error
5. Complete and notify user`

      const result = VisualSuggestionParser.parseMessage('msg-4', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions.some(s => s.type === 'flowchart')).toBe(true)
    })

    it('should detect sequence diagram from interaction language', () => {
      const content = `The interaction between components works like this:
- User sends a request to the API
- API receives the request and validates it
- System communicates with the database
- Database responds with data
- API sends response back to user`

      const result = VisualSuggestionParser.parseMessage('msg-5', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions.some(s => s.type === 'sequence')).toBe(true)
    })

    it('should detect Gantt from timeline language', () => {
      const content = `Here's the project timeline:
- Q1: Research and planning phase
- Q2: Development sprint 1
- Q3: Development sprint 2
- Q4: Testing and deployment milestone`

      const result = VisualSuggestionParser.parseMessage('msg-6', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions.some(s => s.type === 'gantt')).toBe(true)
    })

    it('should detect state diagram from lifecycle language', () => {
      const content = `The order goes through several states:
- Pending: Initial state when order is created
- Active: Order is being processed
- Complete: Order has been fulfilled
- Cancelled: Order was cancelled by user
Transitions happen based on actions taken.`

      const result = VisualSuggestionParser.parseMessage('msg-7', content, 'assistant')

      expect(result.hasVisualContent).toBe(true)
      expect(result.suggestions.some(s => s.type === 'state')).toBe(true)
    })
  })

  describe('Structured List Conversion', () => {
    it('should convert numbered list to flowchart', () => {
      const content = `Here are the steps:
1. Collect user requirements
2. Design the solution
3. Implement the features
4. Test thoroughly
5. Deploy to production`

      const result = VisualSuggestionParser.parseMessage('msg-8', content, 'assistant')

      const flowchartSuggestion = result.suggestions.find(s => s.type === 'flowchart')
      expect(flowchartSuggestion).toBeDefined()
      expect(flowchartSuggestion?.diagramCode).toContain('Start([Start])')
      expect(flowchartSuggestion?.diagramCode).toContain('End([End])')
      expect(flowchartSuggestion?.diagramCode).toContain('Step1')
    })

    it('should not suggest diagram for short lists', () => {
      const content = `Two options:
1. Option A
2. Option B`

      const result = VisualSuggestionParser.parseMessage('msg-9', content, 'assistant')

      // Should not generate flowchart for < 3 items
      const flowchartSuggestions = result.suggestions.filter(s => s.type === 'flowchart')
      expect(flowchartSuggestions.length).toBe(0)
    })
  })

  describe('User Messages', () => {
    it('should not parse user messages', () => {
      const content = `Can you create a flowchart showing the process?`

      const result = VisualSuggestionParser.parseMessage('msg-10', content, 'user')

      expect(result.hasVisualContent).toBe(false)
      expect(result.suggestions.length).toBe(0)
    })
  })

  describe('Confidence Filtering', () => {
    it('should filter suggestions by confidence', () => {
      const suggestions = [
        { id: '1', confidence: 0.9, type: 'flowchart' },
        { id: '2', confidence: 0.6, type: 'sequence' },
        { id: '3', confidence: 0.3, type: 'gantt' },
      ] as Partial<VisualSuggestion>[] as VisualSuggestion[]

      const filtered = filterByConfidence(suggestions, 0.5)

      expect(filtered.length).toBe(2)
      expect(filtered.map(s => s.id)).toEqual(['1', '2'])
    })
  })

  describe('Multiple Diagrams', () => {
    it('should extract multiple diagrams from single message', () => {
      const content = `Here are two diagrams:

First, the flowchart:
\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

And the sequence:
\`\`\`mermaid
sequenceDiagram
  A->>B: Message
\`\`\``

      const result = VisualSuggestionParser.parseMessage('msg-11', content, 'assistant')

      expect(result.suggestions.length).toBeGreaterThanOrEqual(2)
      expect(result.suggestions.some(s => s.type === 'flowchart')).toBe(true)
      expect(result.suggestions.some(s => s.type === 'sequence')).toBe(true)
    })
  })
})
