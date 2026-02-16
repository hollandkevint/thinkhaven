import { Message } from '@/lib/ai/types'
import {
  extractAssumptions,
  formatAssumptionsAsMarkdown,
  formatAssumptionsAsHtml,
  Assumption,
} from './assumption-extractor'

export interface ProductBrief {
  title: string
  version: string
  createdDate: Date
  overview: ProductOverview
  problemStatement: ProblemStatement
  targetUsers: TargetUser[]
  proposedSolution: ProposedSolution
  successCriteria: SuccessCriterion[]
  risks: Risk[]
  timeline: TimelinePhase[]
  resources: ResourceRequirement[]
  assumptions: Assumption[] // Story 3.5: Track assumptions from conversation
  metadata: {
    generatedAt: Date
    sourceMessages: number
    confidenceScore: number
  }
}

export interface ProductOverview {
  productName: string
  tagline: string
  description: string
  category: string
  stage: 'concept' | 'discovery' | 'development' | 'launch' | 'growth'
}

export interface ProblemStatement {
  coreProblems: string[]
  impact: string
  currentAlternatives: string[]
  whyNow: string
}

export interface TargetUser {
  persona: string
  description: string
  painPoints: string[]
  goals: string[]
  priority: 'primary' | 'secondary'
}

export interface ProposedSolution {
  coreConcept: string
  keyFeatures: Feature[]
  uniqueValue: string
  differentiators: string[]
}

export interface Feature {
  name: string
  description: string
  priority: 'must-have' | 'should-have' | 'nice-to-have'
  complexity: 'low' | 'medium' | 'high'
}

export interface SuccessCriterion {
  metric: string
  target: string
  timeline: string
}

export interface Risk {
  description: string
  severity: 'high' | 'medium' | 'low'
  mitigation: string
}

export interface TimelinePhase {
  phase: string
  duration: string
  deliverables: string[]
  dependencies: string[]
}

export interface ResourceRequirement {
  type: 'engineering' | 'design' | 'marketing' | 'operations' | 'other'
  description: string
  allocation: string
}

export interface ProductBriefOptions {
  format: 'markdown' | 'html' | 'json'
  includeTimeline: boolean
  includeResources: boolean
  detailLevel: 'summary' | 'detailed'
}

/**
 * Product Brief Generator
 * Creates structured product briefs from brainstorming conversations
 */
export class ProductBriefGenerator {
  generateBrief(
    messages: Message[],
    productName: string,
    options: ProductBriefOptions = {
      format: 'markdown',
      includeTimeline: true,
      includeResources: true,
      detailLevel: 'detailed'
    }
  ): ProductBrief {
    const overview = this.extractOverview(messages, productName)
    const problem = this.extractProblemStatement(messages)
    const users = this.extractTargetUsers(messages)
    const solution = this.extractSolution(messages)
    const criteria = this.extractSuccessCriteria(messages)
    const risks = this.extractRisks(messages)
    const timeline = options.includeTimeline ? this.generateTimeline(messages) : []
    const resources = options.includeResources ? this.generateResourceRequirements(messages) : []
    // Story 3.5: Extract assumptions from conversation
    const assumptions = extractAssumptions(messages)

    return {
      title: `Product Brief: ${productName}`,
      version: '1.0',
      createdDate: new Date(),
      overview,
      problemStatement: problem,
      targetUsers: users,
      proposedSolution: solution,
      successCriteria: criteria,
      risks,
      timeline,
      resources,
      assumptions,
      metadata: {
        generatedAt: new Date(),
        sourceMessages: messages.length,
        confidenceScore: this.calculateConfidence(messages)
      }
    }
  }

  formatBrief(brief: ProductBrief, format: 'markdown' | 'html' | 'json'): string {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(brief)
      case 'html':
        return this.formatAsHTML(brief)
      case 'json':
        return JSON.stringify(brief, null, 2)
      default:
        return this.formatAsMarkdown(brief)
    }
  }

  private extractOverview(messages: Message[], productName: string): ProductOverview {
    const aiContent = messages.filter(m => m.role === 'assistant').map(m => m.content).join(' ')

    // Extract tagline (often short phrases after the product name)
    const taglineMatch = aiContent.match(/(?:tagline|motto|slogan|summary)[:\s]+["']?([^"'\n.]+)/i)
    const tagline = taglineMatch?.[1]?.trim() || this.generateTagline(aiContent)

    // Extract description
    const descMatch = aiContent.match(/(?:description|overview|about|what is)[:\s]+(.{50,300})/i)
    const description = descMatch?.[1]?.trim() || this.summarizeContent(aiContent)

    // Detect category
    const category = this.detectCategory(aiContent)

    // Detect stage
    const stage = this.detectStage(messages)

    return {
      productName,
      tagline,
      description,
      category,
      stage
    }
  }

  private generateTagline(content: string): string {
    // Extract a compelling short phrase from the content
    const phrases = content.match(/\b[A-Z][^.!?]*(?:better|easier|faster|simpler|smarter)[^.!?]*/gi)
    if (phrases && phrases[0]) {
      return phrases[0].slice(0, 80).trim()
    }
    return 'Transforming how you work'
  }

  private summarizeContent(content: string): string {
    // Take first meaningful paragraph
    const paragraphs = content.split(/\n\n+/).filter(p => p.length > 50)
    if (paragraphs[0]) {
      return paragraphs[0].slice(0, 300).trim() + '...'
    }
    return 'A solution designed to address key market needs.'
  }

  private detectCategory(content: string): string {
    const categoryKeywords: Record<string, string[]> = {
      'SaaS': ['saas', 'subscription', 'cloud', 'software as a service'],
      'Mobile App': ['mobile', 'app', 'ios', 'android'],
      'Marketplace': ['marketplace', 'platform', 'two-sided', 'buyers and sellers'],
      'E-commerce': ['e-commerce', 'ecommerce', 'shop', 'store', 'retail'],
      'AI/ML': ['ai', 'machine learning', 'ml', 'artificial intelligence'],
      'Developer Tools': ['developer', 'api', 'sdk', 'devtools', 'engineering'],
      'Healthcare': ['health', 'medical', 'patient', 'clinical'],
      'Fintech': ['finance', 'fintech', 'banking', 'payments']
    }

    const lowerContent = content.toLowerCase()
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        return category
      }
    }
    return 'Technology'
  }

  private detectStage(messages: Message[]): 'concept' | 'discovery' | 'development' | 'launch' | 'growth' {
    const content = messages.map(m => m.content).join(' ').toLowerCase()

    if (content.includes('launched') || content.includes('live') || content.includes('production')) {
      return content.includes('growth') || content.includes('scale') ? 'growth' : 'launch'
    }
    if (content.includes('building') || content.includes('developing') || content.includes('coding')) {
      return 'development'
    }
    if (content.includes('research') || content.includes('interview') || content.includes('validate')) {
      return 'discovery'
    }
    return 'concept'
  }

  private extractProblemStatement(messages: Message[]): ProblemStatement {
    const content = messages.map(m => m.content).join('\n')

    return {
      coreProblems: this.extractProblems(content),
      impact: this.extractImpact(content),
      currentAlternatives: this.extractAlternatives(content),
      whyNow: this.extractWhyNow(content)
    }
  }

  private extractProblems(content: string): string[] {
    const problems: string[] = []
    const patterns = [
      /problem[s]?:?\s*([^.]+\.)/gi,
      /challenge[s]?:?\s*([^.]+\.)/gi,
      /pain point[s]?:?\s*([^.]+\.)/gi,
      /struggle[s]? with:?\s*([^.]+\.)/gi,
      /difficulty:?\s*([^.]+\.)/gi
    ]

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          problems.push(match[1].trim())
        }
      }
    })

    return [...new Set(problems)].slice(0, 5)
  }

  private extractImpact(content: string): string {
    const impactMatch = content.match(/(?:impact|result|consequence|cost)[:\s]+([^.]+\.)/i)
    return impactMatch?.[1]?.trim() || 'Significant impact on productivity and efficiency'
  }

  private extractAlternatives(content: string): string[] {
    const alternatives: string[] = []
    const patterns = [
      /(?:alternative|competitor|existing solution|current option)[s]?:?\s*([^.]+\.)/gi,
      /(?:currently|today|now)[,\s]+(?:people|users|customers)\s+([^.]+\.)/gi
    ]

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          alternatives.push(match[1].trim())
        }
      }
    })

    return [...new Set(alternatives)].slice(0, 3) || ['Manual processes', 'Existing tools with limited functionality']
  }

  private extractWhyNow(content: string): string {
    const whyNowMatch = content.match(/(?:why now|timing|opportunity|market shift)[:\s]+([^.]+\.)/i)
    return whyNowMatch?.[1]?.trim() || 'Market conditions and technological advances create a unique opportunity'
  }

  private extractTargetUsers(messages: Message[]): TargetUser[] {
    const content = messages.map(m => m.content).join('\n')
    const users: TargetUser[] = []

    // Look for explicit user/persona mentions
    const userPatterns = [
      /(?:target|primary|main)\s+(?:user|customer|audience)[s]?:?\s*([^.]+\.)/gi,
      /(?:persona|segment)[s]?:?\s*([^.]+\.)/gi,
      /(?:designed for|built for|made for):?\s*([^.]+\.)/gi
    ]

    userPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          users.push({
            persona: match[1].trim().slice(0, 50),
            description: match[1].trim(),
            painPoints: [],
            goals: [],
            priority: users.length === 0 ? 'primary' : 'secondary'
          })
        }
      }
    })

    // Default user if none found
    if (users.length === 0) {
      users.push({
        persona: 'Primary User',
        description: 'Target customers who will benefit most from this solution',
        painPoints: this.extractProblems(content).slice(0, 3),
        goals: ['Improve efficiency', 'Reduce costs', 'Better outcomes'],
        priority: 'primary'
      })
    }

    return users.slice(0, 3)
  }

  private extractSolution(messages: Message[]): ProposedSolution {
    const content = messages.map(m => m.content).join('\n')

    return {
      coreConcept: this.extractCoreConcept(content),
      keyFeatures: this.extractFeatures(content),
      uniqueValue: this.extractUniqueValue(content),
      differentiators: this.extractDifferentiators(content)
    }
  }

  private extractCoreConcept(content: string): string {
    const conceptMatch = content.match(/(?:core concept|main idea|solution|approach)[:\s]+([^.]+\.)/i)
    return conceptMatch?.[1]?.trim() || 'A comprehensive solution addressing key user needs'
  }

  private extractFeatures(content: string): Feature[] {
    const features: Feature[] = []
    const featurePatterns = [
      /(?:feature|capability|functionality)[s]?:?\s*([^.]+\.)/gi,
      /(?:^|\n)\s*[-*]\s*([^.]+\.)/gm
    ]

    featurePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          features.push({
            name: match[1].slice(0, 50).trim(),
            description: match[1].trim(),
            priority: features.length < 3 ? 'must-have' : 'should-have',
            complexity: 'medium'
          })
        }
      }
    })

    return features.slice(0, 8)
  }

  private extractUniqueValue(content: string): string {
    const uvpMatch = content.match(/(?:unique value|uvp|differentiator|what makes)[:\s]+([^.]+\.)/i)
    return uvpMatch?.[1]?.trim() || 'Unique combination of features designed for specific user needs'
  }

  private extractDifferentiators(content: string): string[] {
    const diffs: string[] = []
    const patterns = [
      /(?:different|unique|unlike|better than)[:\s]+([^.]+\.)/gi,
      /(?:competitive advantage|edge|moat)[:\s]+([^.]+\.)/gi
    ]

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          diffs.push(match[1].trim())
        }
      }
    })

    return [...new Set(diffs)].slice(0, 4) || ['Novel approach', 'Better user experience', 'Superior technology']
  }

  private extractSuccessCriteria(messages: Message[]): SuccessCriterion[] {
    const content = messages.map(m => m.content).join('\n')
    const criteria: SuccessCriterion[] = []

    const metricPatterns = [
      /(?:success|metric|kpi|measure)[:\s]+([^.]+\.)/gi,
      /(?:goal|target|objective)[:\s]+(\d+[^.]+\.)/gi
    ]

    metricPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          criteria.push({
            metric: match[1].trim(),
            target: 'TBD',
            timeline: '3-6 months'
          })
        }
      }
    })

    // Default criteria if none found
    if (criteria.length === 0) {
      criteria.push(
        { metric: 'User acquisition', target: '1,000 users', timeline: '6 months' },
        { metric: 'User retention', target: '40% monthly', timeline: '3 months' },
        { metric: 'Revenue', target: '$10K MRR', timeline: '12 months' }
      )
    }

    return criteria.slice(0, 6)
  }

  private extractRisks(messages: Message[]): Risk[] {
    const content = messages.map(m => m.content).join('\n')
    const risks: Risk[] = []

    const riskPatterns = [
      /(?:risk|challenge|concern|obstacle)[s]?:?\s*([^.]+\.)/gi,
      /(?:might fail|could fail|potential issue)[:\s]+([^.]+\.)/gi
    ]

    riskPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          risks.push({
            description: match[1].trim(),
            severity: 'medium',
            mitigation: 'To be defined'
          })
        }
      }
    })

    // Default risks if none found
    if (risks.length === 0) {
      risks.push(
        { description: 'Market adoption uncertainty', severity: 'medium', mitigation: 'Early user validation' },
        { description: 'Technical complexity', severity: 'medium', mitigation: 'Phased development approach' },
        { description: 'Competitive pressure', severity: 'low', mitigation: 'Focus on differentiation' }
      )
    }

    return risks.slice(0, 5)
  }

  private generateTimeline(messages: Message[]): TimelinePhase[] {
    return [
      {
        phase: 'Discovery',
        duration: '2-4 weeks',
        deliverables: ['User research', 'Requirements definition', 'Technical feasibility'],
        dependencies: []
      },
      {
        phase: 'MVP Development',
        duration: '6-8 weeks',
        deliverables: ['Core features', 'Basic UI', 'Integration setup'],
        dependencies: ['Discovery complete']
      },
      {
        phase: 'Beta Launch',
        duration: '4-6 weeks',
        deliverables: ['Beta release', 'User feedback collection', 'Iteration'],
        dependencies: ['MVP ready']
      },
      {
        phase: 'Public Launch',
        duration: '2-4 weeks',
        deliverables: ['Full release', 'Marketing push', 'Support setup'],
        dependencies: ['Beta feedback incorporated']
      }
    ]
  }

  private generateResourceRequirements(messages: Message[]): ResourceRequirement[] {
    return [
      { type: 'engineering', description: 'Full-stack development', allocation: '2-3 engineers' },
      { type: 'design', description: 'UX/UI design', allocation: '1 designer' },
      { type: 'marketing', description: 'Go-to-market strategy', allocation: '0.5 FTE' },
      { type: 'operations', description: 'Customer success and support', allocation: '1 person post-launch' }
    ]
  }

  private calculateConfidence(messages: Message[]): number {
    // Higher confidence with more detailed discussions
    const messageCount = messages.length
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messageCount

    let confidence = 50
    if (messageCount > 10) confidence += 15
    if (messageCount > 20) confidence += 10
    if (avgLength > 200) confidence += 15
    if (avgLength > 500) confidence += 10

    return Math.min(confidence, 95)
  }

  private formatAsMarkdown(brief: ProductBrief): string {
    let md = `# ${brief.title}\n\n`
    md += `**Version:** ${brief.version} | **Created:** ${brief.createdDate.toLocaleDateString()}\n\n`

    // Overview
    md += `## Product Overview\n\n`
    md += `**${brief.overview.productName}** - ${brief.overview.tagline}\n\n`
    md += `${brief.overview.description}\n\n`
    md += `- **Category:** ${brief.overview.category}\n`
    md += `- **Stage:** ${brief.overview.stage}\n\n`

    // Problem
    md += `## Problem Statement\n\n`
    md += `### Core Problems\n`
    brief.problemStatement.coreProblems.forEach(p => {
      md += `- ${p}\n`
    })
    md += `\n**Impact:** ${brief.problemStatement.impact}\n\n`
    md += `**Why Now:** ${brief.problemStatement.whyNow}\n\n`

    // Target Users
    md += `## Target Users\n\n`
    brief.targetUsers.forEach(user => {
      md += `### ${user.persona} (${user.priority})\n`
      md += `${user.description}\n\n`
    })

    // Solution
    md += `## Proposed Solution\n\n`
    md += `**Core Concept:** ${brief.proposedSolution.coreConcept}\n\n`
    md += `**Unique Value:** ${brief.proposedSolution.uniqueValue}\n\n`
    md += `### Key Features\n`
    brief.proposedSolution.keyFeatures.forEach(f => {
      md += `- **${f.name}** (${f.priority}): ${f.description}\n`
    })

    // Success Criteria
    md += `\n## Success Criteria\n\n`
    md += `| Metric | Target | Timeline |\n`
    md += `|--------|--------|----------|\n`
    brief.successCriteria.forEach(c => {
      md += `| ${c.metric} | ${c.target} | ${c.timeline} |\n`
    })

    // Risks
    md += `\n## Risks & Mitigations\n\n`
    brief.risks.forEach(r => {
      md += `- **${r.description}** (${r.severity}) - Mitigation: ${r.mitigation}\n`
    })

    // Timeline
    if (brief.timeline.length > 0) {
      md += `\n## Timeline\n\n`
      brief.timeline.forEach(phase => {
        md += `### ${phase.phase} (${phase.duration})\n`
        phase.deliverables.forEach(d => {
          md += `- ${d}\n`
        })
        md += '\n'
      })
    }

    // Story 3.5: Include assumptions section
    if (brief.assumptions && brief.assumptions.length > 0) {
      md += formatAssumptionsAsMarkdown(brief.assumptions)
    }

    md += `\n---\n*Confidence Score: ${brief.metadata.confidenceScore}% | Generated: ${brief.metadata.generatedAt.toLocaleString()}*\n`

    return md
  }

  private formatAsHTML(brief: ProductBrief): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${brief.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1a1a1a; }
    h1 { color: #2C2416; border-bottom: 3px solid #C4785C; padding-bottom: 10px; }
    h2 { color: #4A3D2E; margin-top: 30px; border-bottom: 1px solid #F5F0E6; padding-bottom: 8px; }
    h3 { color: #4A3D2E; }
    .header-meta { color: #6B7B8C; margin-bottom: 30px; }
    .overview-box { background: linear-gradient(135deg, #FAF7F2, #F5F0E6); padding: 20px; border-radius: 12px; margin: 20px 0; }
    .tagline { font-size: 1.25rem; color: #B56A4E; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #F5F0E6; padding: 10px; text-align: left; }
    th { background: #FAF7F2; }
    .risk-high { color: #8B4D3B; }
    .risk-medium { color: #D4A84B; }
    .risk-low { color: #4A6741; }
    .feature-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px; }
    .must-have { background: #f5e6e3; color: #8B4D3B; }
    .should-have { background: #f5ecd0; color: #92400e; }
    .nice-to-have { background: #d4e5d0; color: #4A6741; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #F5F0E6; color: #6B7B8C; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>${brief.title}</h1>
  <p class="header-meta">Version ${brief.version} | Created ${brief.createdDate.toLocaleDateString()}</p>

  <div class="overview-box">
    <h2 style="margin-top: 0; border: none;">${brief.overview.productName}</h2>
    <p class="tagline">${brief.overview.tagline}</p>
    <p>${brief.overview.description}</p>
    <p><strong>Category:</strong> ${brief.overview.category} | <strong>Stage:</strong> ${brief.overview.stage}</p>
  </div>

  <h2>Problem Statement</h2>
  <ul>
    ${brief.problemStatement.coreProblems.map(p => `<li>${p}</li>`).join('\n')}
  </ul>
  <p><strong>Impact:</strong> ${brief.problemStatement.impact}</p>
  <p><strong>Why Now:</strong> ${brief.problemStatement.whyNow}</p>

  <h2>Target Users</h2>
  ${brief.targetUsers.map(u => `
    <h3>${u.persona} (${u.priority})</h3>
    <p>${u.description}</p>
  `).join('\n')}

  <h2>Proposed Solution</h2>
  <p><strong>Core Concept:</strong> ${brief.proposedSolution.coreConcept}</p>
  <p><strong>Unique Value:</strong> ${brief.proposedSolution.uniqueValue}</p>
  <h3>Key Features</h3>
  <ul>
    ${brief.proposedSolution.keyFeatures.map(f => `
      <li><strong>${f.name}</strong><span class="feature-tag ${f.priority}">${f.priority}</span>: ${f.description}</li>
    `).join('\n')}
  </ul>

  <h2>Success Criteria</h2>
  <table>
    <tr><th>Metric</th><th>Target</th><th>Timeline</th></tr>
    ${brief.successCriteria.map(c => `<tr><td>${c.metric}</td><td>${c.target}</td><td>${c.timeline}</td></tr>`).join('\n')}
  </table>

  <h2>Risks & Mitigations</h2>
  <ul>
    ${brief.risks.map(r => `<li class="risk-${r.severity}"><strong>${r.description}</strong> (${r.severity}) - ${r.mitigation}</li>`).join('\n')}
  </ul>

  ${brief.assumptions && brief.assumptions.length > 0 ? formatAssumptionsAsHtml(brief.assumptions) : ''}

  <footer>
    Confidence Score: ${brief.metadata.confidenceScore}% | Generated: ${brief.metadata.generatedAt.toLocaleString()}
  </footer>
</body>
</html>`
  }
}

export function createProductBriefGenerator(): ProductBriefGenerator {
  return new ProductBriefGenerator()
}
