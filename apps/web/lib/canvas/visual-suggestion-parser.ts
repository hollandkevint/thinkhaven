/**
 * Visual Suggestion Parser
 *
 * Extracts visual suggestions from AI assistant responses
 * and converts them into canvas elements (diagrams, flowcharts, sketches)
 */

export type VisualSuggestionType =
  | 'flowchart'
  | 'sequence'
  | 'gantt'
  | 'class'
  | 'state'
  | 'user-journey'
  | 'mindmap'
  | 'sketch'

export interface VisualSuggestion {
  id: string
  type: VisualSuggestionType
  title: string
  description: string
  diagramCode?: string // Mermaid.js code
  sketchHints?: string[] // Hints for manual sketching
  confidence: number // 0-1 confidence score
  messageId: string // Source message ID
  timestamp: Date
}

export interface ParsedMessageVisuals {
  messageId: string
  suggestions: VisualSuggestion[]
  hasVisualContent: boolean
}

/**
 * Visual trigger patterns that indicate diagram opportunities
 */
const VISUAL_PATTERNS = {
  flowchart: [
    /\b(flow|process|workflow|steps|sequence|pipeline)\b/i,
    /\b(if|then|else|decision)\b/i,
    /\b(start|end|begin|finish)\b/i,
  ],
  sequence: [
    /\b(interaction|communication|sequence|timeline)\b/i,
    /\b(actor|participant|user|system)\b/i,
    /\b(sends?|receives?|requests?|responds?)\b/i,
  ],
  gantt: [
    /\b(timeline|schedule|roadmap|phases)\b/i,
    /\b(sprint|milestone|deadline)\b/i,
    /\b(Q[1-4]|quarter|month|week)\b/i,
  ],
  class: [
    /\b(class|object|entity|model)\b/i,
    /\b(inherit|extends|implements)\b/i,
    /\b(relationship|association|dependency)\b/i,
  ],
  state: [
    /\b(state|status|lifecycle|transition)\b/i,
    /\b(pending|active|complete|cancelled)\b/i,
    /\b(flow|machine|diagram)\b/i,
  ],
  'user-journey': [
    /\b(journey|experience|touchpoint|persona)\b/i,
    /\b(user|customer|visitor)\b/i,
    /\b(step|stage|phase|moment)\b/i,
  ],
  mindmap: [
    /\b(brainstorm|ideas?|concepts?)\b/i,
    /\b(branches?|connections?|relationships?)\b/i,
    /\b(organize|structure|map)\b/i,
  ],
}

/**
 * Numbered/bulleted list patterns (potential flowcharts)
 */
const LIST_PATTERNS = {
  numbered: /^\d+\.\s+(.+)$/gm,
  bulleted: /^[\-\*]\s+(.+)$/gm,
}

/**
 * Parse assistant message for visual suggestions
 */
export class VisualSuggestionParser {
  /**
   * Parse a message and extract visual suggestions
   */
  static parseMessage(
    messageId: string,
    content: string,
    role: 'user' | 'assistant'
  ): ParsedMessageVisuals {
    // Only parse assistant messages
    if (role !== 'assistant') {
      return {
        messageId,
        suggestions: [],
        hasVisualContent: false,
      }
    }

    const suggestions: VisualSuggestion[] = []

    // 1. Extract explicit Mermaid diagrams
    const mermaidDiagrams = this.extractMermaidDiagrams(messageId, content)
    suggestions.push(...mermaidDiagrams)

    // 2. Detect implicit diagram opportunities
    const implicitSuggestions = this.detectImplicitDiagrams(messageId, content)
    suggestions.push(...implicitSuggestions)

    // 3. Extract structured lists (potential flowcharts)
    const listSuggestions = this.extractStructuredLists(messageId, content)
    suggestions.push(...listSuggestions)

    return {
      messageId,
      suggestions,
      hasVisualContent: suggestions.length > 0,
    }
  }

  /**
   * Extract explicit Mermaid code blocks
   */
  private static extractMermaidDiagrams(
    messageId: string,
    content: string
  ): VisualSuggestion[] {
    const suggestions: VisualSuggestion[] = []
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
    let match

    while ((match = mermaidRegex.exec(content)) !== null) {
      const diagramCode = match[1].trim()
      const type = this.detectMermaidType(diagramCode)

      suggestions.push({
        id: `visual-${messageId}-${suggestions.length}`,
        type,
        title: `${this.formatType(type)} Diagram`,
        description: 'Diagram found in assistant response',
        diagramCode,
        confidence: 1.0, // Explicit diagram = 100% confidence
        messageId,
        timestamp: new Date(),
      })
    }

    return suggestions
  }

  /**
   * Detect implicit diagram opportunities based on content patterns
   */
  private static detectImplicitDiagrams(
    messageId: string,
    content: string
  ): VisualSuggestion[] {
    const suggestions: VisualSuggestion[] = []

    // Check each diagram type pattern
    for (const [type, patterns] of Object.entries(VISUAL_PATTERNS)) {
      let matchCount = 0

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matchCount++
        }
      }

      // If 2+ patterns match, suggest this diagram type
      if (matchCount >= 2) {
        const confidence = Math.min(matchCount / patterns.length, 0.9)

        suggestions.push({
          id: `visual-${messageId}-${suggestions.length}`,
          type: type as VisualSuggestionType,
          title: `Suggested ${this.formatType(type as VisualSuggestionType)}`,
          description: this.generateDescription(type as VisualSuggestionType, content),
          diagramCode: this.generateTemplateDiagram(type as VisualSuggestionType),
          confidence,
          messageId,
          timestamp: new Date(),
        })
      }
    }

    return suggestions
  }

  /**
   * Extract structured lists that could become flowcharts
   */
  private static extractStructuredLists(
    messageId: string,
    content: string
  ): VisualSuggestion[] {
    const suggestions: VisualSuggestion[] = []

    // Extract numbered lists
    const numberedMatches = Array.from(content.matchAll(LIST_PATTERNS.numbered))

    if (numberedMatches.length >= 3) {
      const steps = numberedMatches.map(m => m[1].trim())
      const diagramCode = this.convertListToFlowchart(steps)

      suggestions.push({
        id: `visual-${messageId}-${suggestions.length}`,
        type: 'flowchart',
        title: 'Process Flowchart',
        description: `${steps.length}-step process from conversation`,
        diagramCode,
        confidence: 0.75,
        messageId,
        timestamp: new Date(),
      })
    }

    return suggestions
  }

  /**
   * Detect Mermaid diagram type from code
   */
  private static detectMermaidType(code: string): VisualSuggestionType {
    if (code.includes('graph') || code.includes('flowchart')) return 'flowchart'
    if (code.includes('sequenceDiagram')) return 'sequence'
    if (code.includes('gantt')) return 'gantt'
    if (code.includes('classDiagram')) return 'class'
    if (code.includes('stateDiagram')) return 'state'
    if (code.includes('journey')) return 'user-journey'
    return 'flowchart' // Default
  }

  /**
   * Format type name for display
   */
  private static formatType(type: VisualSuggestionType): string {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Generate description based on diagram type and content
   */
  private static generateDescription(type: VisualSuggestionType, content: string): string {
    const preview = content.substring(0, 100).replace(/\n/g, ' ')
    return `Detected ${this.formatType(type).toLowerCase()} opportunity: "${preview}..."`
  }

  /**
   * Generate template diagram code based on content
   */
  private static generateTemplateDiagram(type: VisualSuggestionType): string {
    switch (type) {
      case 'flowchart':
        return this.generateFlowchartTemplate()
      case 'sequence':
        return this.generateSequenceTemplate()
      case 'gantt':
        return this.generateGanttTemplate()
      case 'state':
        return this.generateStateTemplate()
      case 'user-journey':
        return this.generateJourneyTemplate()
      default:
        return `graph LR\n  Start --> End`
    }
  }

  /**
   * Convert numbered list to flowchart
   */
  private static convertListToFlowchart(steps: string[]): string {
    let mermaid = 'flowchart TD\n'
    mermaid += '  Start([Start])\n'

    steps.forEach((step, index) => {
      const nodeId = `Step${index + 1}`
      const label = step.substring(0, 50) // Truncate long labels
      mermaid += `  ${nodeId}[${label}]\n`

      if (index === 0) {
        mermaid += `  Start --> ${nodeId}\n`
      } else {
        mermaid += `  Step${index} --> ${nodeId}\n`
      }
    })

    mermaid += `  Step${steps.length} --> End([End])\n`
    return mermaid
  }

  /**
   * Generate flowchart template
   */
  private static generateFlowchartTemplate(): string {
    return `flowchart TD
  Start([Start])
  Decision{Decision?}
  ActionA[Action A]
  ActionB[Action B]
  End([End])

  Start --> Decision
  Decision -->|Yes| ActionA
  Decision -->|No| ActionB
  ActionA --> End
  ActionB --> End`
  }

  /**
   * Generate sequence diagram template
   */
  private static generateSequenceTemplate(): string {
    return `sequenceDiagram
  participant User
  participant System
  participant Database

  User->>System: Request
  System->>Database: Query
  Database-->>System: Results
  System-->>User: Response`
  }

  /**
   * Generate Gantt chart template
   */
  private static generateGanttTemplate(): string {
    return `gantt
  title Project Timeline
  dateFormat YYYY-MM-DD

  section Phase 1
    Task 1: 2025-01-01, 14d
    Task 2: 2025-01-15, 7d

  section Phase 2
    Task 3: 2025-01-22, 10d
    Task 4: 2025-02-01, 5d`
  }

  /**
   * Generate state diagram template
   */
  private static generateStateTemplate(): string {
    return `stateDiagram-v2
  [*] --> Draft
  Draft --> Review
  Review --> Approved
  Review --> Rejected
  Approved --> [*]
  Rejected --> Draft`
  }

  /**
   * Generate user journey template
   */
  private static generateJourneyTemplate(): string {
    return `journey
  title User Journey
  section Discovery
    Find product: 5: User
    Read reviews: 3: User
  section Purchase
    Add to cart: 4: User
    Checkout: 2: User
  section Post-Purchase
    Receive product: 5: User
    Leave review: 3: User`
  }
}

/**
 * Filter suggestions by confidence threshold
 */
export function filterByConfidence(
  suggestions: VisualSuggestion[],
  minConfidence: number = 0.5
): VisualSuggestion[] {
  return suggestions.filter(s => s.confidence >= minConfidence)
}

/**
 * Group suggestions by type
 */
export function groupByType(
  suggestions: VisualSuggestion[]
): Record<VisualSuggestionType, VisualSuggestion[]> {
  return suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = []
    }
    acc[suggestion.type].push(suggestion)
    return acc
  }, {} as Record<VisualSuggestionType, VisualSuggestion[]>)
}
