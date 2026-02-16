import { Message } from '@/lib/ai/types'

export interface BrainstormSummary {
  title: string
  sessionDate: Date
  duration: string
  keyInsights: string[]
  mainTopics: TopicSummary[]
  actionItems: ActionItem[]
  decisions: string[]
  openQuestions: string[]
  nextSteps: string[]
  metadata: {
    messageCount: number
    participantCount: number
    generatedAt: Date
  }
}

export interface TopicSummary {
  topic: string
  summary: string
  keyPoints: string[]
  relatedInsights: string[]
}

export interface ActionItem {
  description: string
  priority: 'high' | 'medium' | 'low'
  owner?: string
  deadline?: string
}

export interface BrainstormGeneratorOptions {
  format: 'markdown' | 'html' | 'json'
  includeTranscript: boolean
  includeMetrics: boolean
}

/**
 * Brainstorm Summary Generator
 * Creates structured summaries from chat conversations
 */
export class BrainstormSummaryGenerator {
  generateSummary(
    messages: Message[],
    sessionName: string,
    options: BrainstormGeneratorOptions = {
      format: 'markdown',
      includeTranscript: false,
      includeMetrics: true
    }
  ): BrainstormSummary {
    const insights = this.extractInsights(messages)
    const topics = this.identifyTopics(messages)
    const actions = this.extractActionItems(messages)
    const decisions = this.extractDecisions(messages)
    const questions = this.extractOpenQuestions(messages)

    return {
      title: sessionName || 'Brainstorm Session Summary',
      sessionDate: new Date(messages[0]?.created_at || Date.now()),
      duration: this.calculateDuration(messages),
      keyInsights: insights,
      mainTopics: topics,
      actionItems: actions,
      decisions,
      openQuestions: questions,
      nextSteps: this.generateNextSteps(actions, questions),
      metadata: {
        messageCount: messages.length,
        participantCount: 2, // User + AI
        generatedAt: new Date()
      }
    }
  }

  formatSummary(summary: BrainstormSummary, format: 'markdown' | 'html' | 'json'): string {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(summary)
      case 'html':
        return this.formatAsHTML(summary)
      case 'json':
        return JSON.stringify(summary, null, 2)
      default:
        return this.formatAsMarkdown(summary)
    }
  }

  private extractInsights(messages: Message[]): string[] {
    const insights: string[] = []
    const insightPatterns = [
      /key insight[s]?:?\s*(.+)/i,
      /important[ly]?:?\s*(.+)/i,
      /the main (?:point|takeaway|insight)[s]?:?\s*(.+)/i,
      /this means:?\s*(.+)/i,
      /in summary:?\s*(.+)/i,
    ]

    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        insightPatterns.forEach(pattern => {
          const match = msg.content.match(pattern)
          if (match && match[1]) {
            insights.push(match[1].trim().slice(0, 200))
          }
        })
      }
    })

    // If no explicit insights found, extract from bullet points
    if (insights.length === 0) {
      messages.filter(m => m.role === 'assistant').slice(-3).forEach(msg => {
        const bullets = msg.content.match(/[-*]\s+(.+)/g)
        if (bullets) {
          bullets.slice(0, 3).forEach(b => {
            insights.push(b.replace(/^[-*]\s+/, '').trim())
          })
        }
      })
    }

    return [...new Set(insights)].slice(0, 10)
  }

  private identifyTopics(messages: Message[]): TopicSummary[] {
    const topics: Map<string, TopicSummary> = new Map()

    // Extract headers/topics from AI responses
    messages.filter(m => m.role === 'assistant').forEach(msg => {
      const headers = msg.content.match(/(?:##?\s*|^\*\*|^\d+\.)\s*([^*\n:]+)/gm)
      if (headers) {
        headers.forEach(header => {
          const cleanHeader = header.replace(/^[#*\d.\s]+/, '').trim()
          if (cleanHeader.length > 3 && cleanHeader.length < 100) {
            if (!topics.has(cleanHeader)) {
              topics.set(cleanHeader, {
                topic: cleanHeader,
                summary: '',
                keyPoints: [],
                relatedInsights: []
              })
            }
          }
        })
      }
    })

    // Default topics if none found
    if (topics.size === 0) {
      topics.set('Session Overview', {
        topic: 'Session Overview',
        summary: 'Key discussion points from the brainstorming session',
        keyPoints: this.extractInsights(messages).slice(0, 3),
        relatedInsights: []
      })
    }

    return Array.from(topics.values()).slice(0, 5)
  }

  private extractActionItems(messages: Message[]): ActionItem[] {
    const actions: ActionItem[] = []
    const actionPatterns = [
      /(?:action|todo|next step|should|need to|must):?\s*(.+)/i,
      /(?:^|\n)\s*[-*]\s*\[?\s*\]?\s*(.+)/gm,
    ]

    messages.forEach(msg => {
      if (msg.role === 'assistant') {
        actionPatterns.forEach(pattern => {
          const matches = msg.content.matchAll(pattern)
          for (const match of matches) {
            if (match[1] && match[1].length > 10 && match[1].length < 200) {
              const text = match[1].trim()
              if (this.isActionable(text)) {
                actions.push({
                  description: text,
                  priority: this.determinePriority(text)
                })
              }
            }
          }
        })
      }
    })

    return [...new Map(actions.map(a => [a.description, a])).values()].slice(0, 10)
  }

  private isActionable(text: string): boolean {
    const actionVerbs = ['create', 'build', 'develop', 'implement', 'test', 'validate', 'research', 'analyze', 'design', 'plan', 'schedule', 'contact', 'review', 'prepare', 'draft', 'define', 'establish']
    return actionVerbs.some(verb => text.toLowerCase().includes(verb))
  }

  private determinePriority(text: string): 'high' | 'medium' | 'low' {
    const highPriorityWords = ['critical', 'urgent', 'immediately', 'asap', 'priority', 'first', 'important']
    const lowPriorityWords = ['eventually', 'later', 'might', 'could', 'optional', 'nice to have']

    const lowerText = text.toLowerCase()
    if (highPriorityWords.some(w => lowerText.includes(w))) return 'high'
    if (lowPriorityWords.some(w => lowerText.includes(w))) return 'low'
    return 'medium'
  }

  private extractDecisions(messages: Message[]): string[] {
    const decisions: string[] = []
    const decisionPatterns = [
      /(?:decided|decision|we'll|let's go with|going with|chosen|selected):?\s*(.+)/i,
      /(?:the approach|the strategy|the plan) (?:is|will be):?\s*(.+)/i,
    ]

    messages.forEach(msg => {
      decisionPatterns.forEach(pattern => {
        const match = msg.content.match(pattern)
        if (match && match[1]) {
          decisions.push(match[1].trim().slice(0, 200))
        }
      })
    })

    return [...new Set(decisions)].slice(0, 5)
  }

  private extractOpenQuestions(messages: Message[]): string[] {
    const questions: string[] = []

    messages.forEach(msg => {
      // Extract questions from both user and AI messages
      const questionMatches = msg.content.match(/(?:^|\n)\s*(?:[-*]?\s*)([^.!]*\?)/gm)
      if (questionMatches) {
        questionMatches.forEach(q => {
          const clean = q.replace(/^[\s\n*-]+/, '').trim()
          if (clean.length > 15 && clean.length < 200) {
            questions.push(clean)
          }
        })
      }
    })

    // Keep only unanswered/open questions from later in conversation
    return [...new Set(questions)].slice(-5)
  }

  private generateNextSteps(actions: ActionItem[], questions: string[]): string[] {
    const steps: string[] = []

    // Add high-priority actions as next steps
    actions.filter(a => a.priority === 'high').forEach(a => {
      steps.push(a.description)
    })

    // Add medium-priority actions
    actions.filter(a => a.priority === 'medium').slice(0, 3).forEach(a => {
      steps.push(a.description)
    })

    // Add a step for open questions if any
    if (questions.length > 0) {
      steps.push(`Address open questions: ${questions.slice(0, 2).join('; ')}`)
    }

    return steps.slice(0, 5)
  }

  private calculateDuration(messages: Message[]): string {
    if (messages.length < 2) return 'N/A'

    const first = new Date(messages[0]?.created_at || 0)
    const last = new Date(messages[messages.length - 1]?.created_at || 0)
    const diffMs = last.getTime() - first.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return 'Less than 1 minute'
    if (diffMins < 60) return `${diffMins} minutes`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  private formatAsMarkdown(summary: BrainstormSummary): string {
    let md = `# ${summary.title}\n\n`
    md += `**Date:** ${summary.sessionDate.toLocaleDateString()}\n`
    md += `**Duration:** ${summary.duration}\n`
    md += `**Messages:** ${summary.metadata.messageCount}\n\n`

    md += `## Key Insights\n\n`
    summary.keyInsights.forEach(insight => {
      md += `- ${insight}\n`
    })

    md += `\n## Main Topics\n\n`
    summary.mainTopics.forEach(topic => {
      md += `### ${topic.topic}\n`
      if (topic.summary) md += `${topic.summary}\n\n`
      topic.keyPoints.forEach(point => {
        md += `- ${point}\n`
      })
      md += '\n'
    })

    if (summary.decisions.length > 0) {
      md += `## Decisions Made\n\n`
      summary.decisions.forEach(decision => {
        md += `- ${decision}\n`
      })
      md += '\n'
    }

    md += `## Action Items\n\n`
    summary.actionItems.forEach(action => {
      const priorityEmoji = action.priority === 'high' ? '!' : action.priority === 'low' ? '' : ''
      md += `- [${priorityEmoji}] ${action.description}\n`
    })

    if (summary.openQuestions.length > 0) {
      md += `\n## Open Questions\n\n`
      summary.openQuestions.forEach(q => {
        md += `- ${q}\n`
      })
    }

    md += `\n## Next Steps\n\n`
    summary.nextSteps.forEach((step, i) => {
      md += `${i + 1}. ${step}\n`
    })

    md += `\n---\n*Generated on ${summary.metadata.generatedAt.toLocaleString()}*\n`

    return md
  }

  private formatAsHTML(summary: BrainstormSummary): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${summary.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2C2416; border-bottom: 2px solid #C4785C; padding-bottom: 10px; }
    h2 { color: #4A3D2E; margin-top: 30px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .metadata { background: #F5F0E6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .action-high { color: #8B4D3B; font-weight: 600; }
    .action-medium { color: #D4A84B; }
    .action-low { color: #6B7B8C; }
  </style>
</head>
<body>
  <h1>${summary.title}</h1>
  <div class="metadata">
    <p><strong>Date:</strong> ${summary.sessionDate.toLocaleDateString()}</p>
    <p><strong>Duration:</strong> ${summary.duration}</p>
    <p><strong>Messages:</strong> ${summary.metadata.messageCount}</p>
  </div>

  <h2>Key Insights</h2>
  <ul>
    ${summary.keyInsights.map(i => `<li>${i}</li>`).join('\n')}
  </ul>

  <h2>Action Items</h2>
  <ul>
    ${summary.actionItems.map(a => `<li class="action-${a.priority}">${a.description}</li>`).join('\n')}
  </ul>

  <h2>Next Steps</h2>
  <ol>
    ${summary.nextSteps.map(s => `<li>${s}</li>`).join('\n')}
  </ol>

  <footer style="margin-top: 40px; color: #6B7B8C; font-size: 0.875rem;">
    Generated on ${summary.metadata.generatedAt.toLocaleString()}
  </footer>
</body>
</html>`
  }
}

export function createBrainstormSummaryGenerator(): BrainstormSummaryGenerator {
  return new BrainstormSummaryGenerator()
}
