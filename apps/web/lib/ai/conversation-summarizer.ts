import { MessageRow, ConversationContextInsert, ConversationContextRow } from '@/lib/supabase/conversation-schema'
import { ConversationQueries } from '@/lib/supabase/conversation-queries'

export interface SummarizationOptions {
  messageThreshold?: number
  tokenThreshold?: number
  summaryLength?: 'brief' | 'detailed' | 'comprehensive'
  focusArea?: 'strategic' | 'coaching' | 'decision' | 'insight'
}

export interface SummaryResult {
  summary: string
  keyInsights: string[]
  decisionPoints: string[]
  actionItems: string[]
  tokensSaved: number
  messageRange: { start: number; end: number }
}

export class ConversationSummarizer {
  private static readonly DEFAULT_MESSAGE_THRESHOLD = 50
  private static readonly DEFAULT_TOKEN_THRESHOLD = 50000

  constructor(
    private conversationId: string,
    private options: SummarizationOptions = {}
  ) {}

  /**
   * Check if conversation needs summarization
   */
  async needsSummarization(): Promise<boolean> {
    const stats = await ConversationQueries.getConversationStats(this.conversationId)
    const messageThreshold = this.options.messageThreshold || ConversationSummarizer.DEFAULT_MESSAGE_THRESHOLD
    const tokenThreshold = this.options.tokenThreshold || ConversationSummarizer.DEFAULT_TOKEN_THRESHOLD

    return stats.messageCount >= messageThreshold || stats.totalTokens >= tokenThreshold
  }

  /**
   * Create summary for a range of messages
   */
  async summarizeMessageRange(
    startIndex: number,
    endIndex: number
  ): Promise<SummaryResult> {
    // Get messages in the specified range
    const messages = await this.getMessagesInRange(startIndex, endIndex)
    
    if (messages.length === 0) {
      throw new Error('No messages found in specified range')
    }

    // Generate summary using Claude
    const summaryPrompt = this.buildSummaryPrompt(messages)
    const summaryResponse = await this.generateSummary(summaryPrompt)
    
    // Parse the structured summary response
    const summaryResult = this.parseSummaryResponse(summaryResponse, messages)
    
    // Store the summary in the database
    await this.storeSummary(summaryResult, startIndex, endIndex)
    
    return summaryResult
  }

  /**
   * Auto-summarize conversation when thresholds are met
   */
  async autoSummarize(): Promise<SummaryResult | null> {
    if (!(await this.needsSummarization())) {
      return null
    }

    // Find the range of messages to summarize
    const summaryRange = await this.findSummarizationRange()
    if (!summaryRange) {
      return null
    }

    return await this.summarizeMessageRange(summaryRange.start, summaryRange.end)
  }

  /**
   * Get comprehensive conversation summary
   */
  async getConversationOverview(): Promise<{
    overallSummary: string
    keyThemes: string[]
    progressTimeline: Array<{phase: string, insights: string[], timestamp: string}>
    strategicOutcomes: string[]
  }> {
    const contextSummaries = await ConversationQueries.getConversationContext(
      this.conversationId, 
      'summary'
    )
    
    const keyInsights = await ConversationQueries.getConversationContext(
      this.conversationId, 
      'key_insight'
    )

    // If no summaries exist, create one from recent messages
    if (contextSummaries.length === 0) {
      await this.autoSummarize()
    }

    // Build comprehensive overview
    const overviewPrompt = this.buildOverviewPrompt(contextSummaries, keyInsights)
    const overviewResponse = await this.generateSummary(overviewPrompt)
    
    return this.parseOverviewResponse(overviewResponse)
  }

  /**
   * Get messages in a specific range
   */
  private async getMessagesInRange(
    startIndex: number, 
    endIndex: number
  ): Promise<MessageRow[]> {
    const allMessages = await ConversationQueries.getConversationMessages(this.conversationId)
    return allMessages.filter(msg => 
      msg.message_index >= startIndex && msg.message_index <= endIndex
    )
  }

  /**
   * Find optimal range for summarization
   */
  private async findSummarizationRange(): Promise<{start: number, end: number} | null> {
    const allMessages = await ConversationQueries.getConversationMessages(this.conversationId)
    const existingContexts = await ConversationQueries.getConversationContext(this.conversationId)
    
    if (allMessages.length === 0) return null

    // Find the last summarized message
    let lastSummarizedIndex = 0
    if (existingContexts.length > 0) {
      const latestContext = existingContexts
        .filter(ctx => ctx.context_type === 'summary')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      
      if (latestContext) {
        lastSummarizedIndex = latestContext.message_range_end
      }
    }

    // Calculate range to summarize
    const unsummarizedMessages = allMessages.filter(msg => 
      msg.message_index > lastSummarizedIndex
    )

    if (unsummarizedMessages.length < 20) {
      return null // Not enough new content to summarize
    }

    // Summarize up to current minus some recent messages to keep
    const keepRecentCount = 10
    const endIndex = Math.max(
      lastSummarizedIndex + 20,
      allMessages.length - keepRecentCount
    )

    return {
      start: lastSummarizedIndex + 1,
      end: endIndex
    }
  }

  /**
   * Build prompt for message summarization
   */
  private buildSummaryPrompt(messages: MessageRow[]): string {
    const focusArea = this.options.focusArea || 'coaching'
    const summaryLength = this.options.summaryLength || 'detailed'
    
    const conversationText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')

    return `You are analyzing a coaching conversation focused on strategic thinking and business development. Please provide a ${summaryLength} summary with the following structure:

CONVERSATION SUMMARY:
[Provide a coherent narrative summary of the discussion]

KEY INSIGHTS:
- [Bullet point list of important insights or breakthroughs]
- [Focus on strategic thinking and business insights]

DECISION POINTS:
- [Major decisions made or discussed]
- [Alternative options that were considered]

ACTION ITEMS:
- [Specific next steps or actions identified]
- [Commitments made by the user]

COACHING THEMES:
- [Main coaching patterns or themes observed]
- [Areas where the user showed growth or needed support]

Focus area: ${focusArea}
Summary detail level: ${summaryLength}

Conversation to summarize:

${conversationText}

Please provide the summary in the exact format shown above, with clear section headers.`
  }

  /**
   * Build prompt for conversation overview
   */
  private buildOverviewPrompt(
    summaries: ConversationContextRow[],
    insights: ConversationContextRow[]
  ): string {
    const summaryTexts = summaries.map(s => s.content).join('\n\n---\n\n')
    const insightTexts = insights.map(i => i.content).join('\n\n')

    return `Based on the conversation summaries and key insights below, provide a comprehensive overview of this coaching conversation:

OVERALL SUMMARY:
[High-level narrative of the entire conversation journey]

KEY THEMES:
- [Main strategic and coaching themes]
- [Recurring topics or challenges]

PROGRESS TIMELINE:
[Show how the conversation evolved over time]
- Phase 1: [Description] - [Key insights] - [Timestamp]
- Phase 2: [Description] - [Key insights] - [Timestamp]
- [Continue as needed]

STRATEGIC OUTCOMES:
- [Major strategic insights or frameworks developed]
- [Business decisions or directions identified]

Conversation Summaries:
${summaryTexts}

Key Insights:
${insightTexts}

Provide the response in the exact format shown above.`
  }

  /**
   * Generate summary using Claude API
   */
  private async generateSummary(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          model: 'claude-3-sonnet-20240229', // Use lighter model for summarization
          maxTokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`Summarization API error: ${response.status}`)
      }

      const data = await response.json()
      return data.summary || data.content || ''
    } catch (error) {
      console.error('Summary generation failed:', error)
      throw new Error('Failed to generate conversation summary')
    }
  }

  /**
   * Parse structured summary response
   */
  private parseSummaryResponse(
    summaryText: string, 
    messages: MessageRow[]
  ): SummaryResult {
    const sections = this.extractSections(summaryText)
    
    // Calculate tokens saved (rough estimate)
    const originalTokens = messages.reduce((sum, msg) => {
      return sum + (msg.metadata?.tokens_used || Math.ceil(msg.content.length / 4))
    }, 0)
    const summaryTokens = Math.ceil(summaryText.length / 4)
    
    return {
      summary: sections.summary || summaryText,
      keyInsights: this.parseListItems(sections.insights || ''),
      decisionPoints: this.parseListItems(sections.decisions || ''),
      actionItems: this.parseListItems(sections.actions || ''),
      tokensSaved: Math.max(0, originalTokens - summaryTokens),
      messageRange: {
        start: messages[0]?.message_index || 0,
        end: messages[messages.length - 1]?.message_index || 0
      }
    }
  }

  /**
   * Parse overview response
   */
  private parseOverviewResponse(overviewText: string): {
    overallSummary: string
    keyThemes: string[]
    progressTimeline: Array<{phase: string, insights: string[], timestamp: string}>
    strategicOutcomes: string[]
  } {
    const sections = this.extractSections(overviewText)
    
    return {
      overallSummary: sections.summary || '',
      keyThemes: this.parseListItems(sections.themes || ''),
      progressTimeline: this.parseTimeline(sections.timeline || ''),
      strategicOutcomes: this.parseListItems(sections.outcomes || '')
    }
  }

  /**
   * Extract sections from formatted response
   */
  private extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {}
    const sectionRegex = /([A-Z\s]+):\s*\n([\s\S]*?)(?=\n[A-Z\s]+:|$)/g
    let match

    while ((match = sectionRegex.exec(text)) !== null) {
      const sectionName = match[1].toLowerCase().trim().replace(/\s+/g, '_')
      const content = match[2].trim()
      
      if (sectionName.includes('summary')) sections.summary = content
      else if (sectionName.includes('insight')) sections.insights = content
      else if (sectionName.includes('decision')) sections.decisions = content
      else if (sectionName.includes('action')) sections.actions = content
      else if (sectionName.includes('theme')) sections.themes = content
      else if (sectionName.includes('timeline')) sections.timeline = content
      else if (sectionName.includes('outcome')) sections.outcomes = content
    }

    return sections
  }

  /**
   * Parse list items from text
   */
  private parseListItems(text: string): string[] {
    return text
      .split(/\n/)
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  /**
   * Parse timeline from text
   */
  private parseTimeline(text: string): Array<{phase: string, insights: string[], timestamp: string}> {
    const timeline: Array<{phase: string, insights: string[], timestamp: string}> = []
    const phaseRegex = /Phase\s+\d+:\s*(.*?)\s*-\s*(.*?)\s*-\s*(.*?)$/gm
    let match

    while ((match = phaseRegex.exec(text)) !== null) {
      timeline.push({
        phase: match[1].trim(),
        insights: [match[2].trim()],
        timestamp: match[3].trim()
      })
    }

    return timeline
  }

  /**
   * Store summary in database
   */
  private async storeSummary(
    result: SummaryResult,
    startIndex: number,
    endIndex: number
  ): Promise<void> {
    // Store main summary
    const summaryData: ConversationContextInsert = {
      conversation_id: this.conversationId,
      context_type: 'summary',
      content: result.summary,
      tokens_saved: result.tokensSaved,
      message_range_start: startIndex,
      message_range_end: endIndex
    }
    
    await ConversationQueries.addConversationContext(summaryData)

    // Store key insights separately
    for (const insight of result.keyInsights) {
      const insightData: ConversationContextInsert = {
        conversation_id: this.conversationId,
        context_type: 'key_insight',
        content: insight,
        tokens_saved: 0,
        message_range_start: startIndex,
        message_range_end: endIndex
      }
      
      await ConversationQueries.addConversationContext(insightData)
    }

    // Store decision points
    for (const decision of result.decisionPoints) {
      const decisionData: ConversationContextInsert = {
        conversation_id: this.conversationId,
        context_type: 'decision_point',
        content: decision,
        tokens_saved: 0,
        message_range_start: startIndex,
        message_range_end: endIndex
      }
      
      await ConversationQueries.addConversationContext(decisionData)
    }

    // Clean up old contexts to prevent unbounded growth
    await ConversationQueries.cleanupOldContexts(this.conversationId)
  }
}

/**
 * Factory function for creating conversation summarizers
 */
export function createConversationSummarizer(
  conversationId: string,
  options?: SummarizationOptions
): ConversationSummarizer {
  return new ConversationSummarizer(conversationId, options)
}