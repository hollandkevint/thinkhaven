import { Message } from '@/lib/ai/types'

export interface ProjectBrief {
  title: string
  projectId: string
  version: string
  createdDate: Date
  lastUpdated: Date
  summary: ProjectSummary
  scope: ProjectScope
  objectives: Objective[]
  deliverables: Deliverable[]
  milestones: Milestone[]
  stakeholders: Stakeholder[]
  constraints: Constraint[]
  assumptions: string[]
  dependencies: Dependency[]
  communicationPlan: CommunicationPlan
  metadata: {
    generatedAt: Date
    sourceMessages: number
    completenessScore: number
  }
}

export interface ProjectSummary {
  projectName: string
  description: string
  sponsor: string
  projectManager: string
  startDate: string
  endDate: string
  budget: string
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed'
}

export interface ProjectScope {
  inScope: string[]
  outOfScope: string[]
  boundaries: string[]
}

export interface Objective {
  id: string
  description: string
  measurable: string
  targetDate: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface Deliverable {
  id: string
  name: string
  description: string
  acceptanceCriteria: string[]
  dueDate: string
  owner: string
  status: 'not-started' | 'in-progress' | 'review' | 'completed'
}

export interface Milestone {
  id: string
  name: string
  description: string
  targetDate: string
  deliverables: string[]
  dependencies: string[]
}

export interface Stakeholder {
  name: string
  role: string
  interest: 'high' | 'medium' | 'low'
  influence: 'high' | 'medium' | 'low'
  communicationNeeds: string
}

export interface Constraint {
  type: 'time' | 'budget' | 'resource' | 'technical' | 'regulatory'
  description: string
  impact: 'high' | 'medium' | 'low'
  mitigation: string
}

export interface Dependency {
  id: string
  description: string
  type: 'internal' | 'external'
  status: 'resolved' | 'pending' | 'blocked'
  owner: string
}

export interface CommunicationPlan {
  statusReports: { frequency: string; audience: string; format: string }
  meetings: { type: string; frequency: string; attendees: string }[]
  escalationPath: string[]
}

export interface ProjectBriefOptions {
  format: 'markdown' | 'html' | 'json'
  includeGantt: boolean
  includeRisks: boolean
  detailLevel: 'executive' | 'detailed' | 'comprehensive'
}

/**
 * Project Brief Generator
 * Creates structured project briefs from brainstorming conversations
 */
export class ProjectBriefGenerator {
  generateBrief(
    messages: Message[],
    projectName: string,
    options: ProjectBriefOptions = {
      format: 'markdown',
      includeGantt: false,
      includeRisks: true,
      detailLevel: 'detailed'
    }
  ): ProjectBrief {
    const summary = this.extractSummary(messages, projectName)
    const scope = this.extractScope(messages)
    const objectives = this.extractObjectives(messages)
    const deliverables = this.extractDeliverables(messages)
    const milestones = this.generateMilestones(deliverables)
    const stakeholders = this.extractStakeholders(messages)
    const constraints = this.extractConstraints(messages)
    const assumptions = this.extractAssumptions(messages)
    const dependencies = this.extractDependencies(messages)
    const communicationPlan = this.generateCommunicationPlan()

    return {
      title: `Project Brief: ${projectName}`,
      projectId: this.generateProjectId(projectName),
      version: '1.0',
      createdDate: new Date(),
      lastUpdated: new Date(),
      summary,
      scope,
      objectives,
      deliverables,
      milestones,
      stakeholders,
      constraints,
      assumptions,
      dependencies,
      communicationPlan,
      metadata: {
        generatedAt: new Date(),
        sourceMessages: messages.length,
        completenessScore: this.calculateCompleteness(messages)
      }
    }
  }

  formatBrief(brief: ProjectBrief, format: 'markdown' | 'html' | 'json'): string {
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

  private generateProjectId(name: string): string {
    const prefix = name.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3)
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase()
    return `${prefix}-${timestamp}`
  }

  private extractSummary(messages: Message[], projectName: string): ProjectSummary {
    const content = messages.map(m => m.content).join('\n')

    // Extract description
    const descMatch = content.match(/(?:project|initiative|program)[:\s]+(.{50,300})/i)
    const description = descMatch?.[1]?.trim() || this.summarizeProject(content)

    // Extract dates
    const startMatch = content.match(/(?:start|begin|kick-?off)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{4})/i)
    const endMatch = content.match(/(?:end|complete|deadline|due)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{4})/i)

    // Extract budget
    const budgetMatch = content.match(/(?:budget|cost|investment)[:\s]+\$?([\d,]+[kmb]?)/i)

    return {
      projectName,
      description,
      sponsor: 'TBD',
      projectManager: 'TBD',
      startDate: startMatch?.[1] || 'TBD',
      endDate: endMatch?.[1] || 'TBD',
      budget: budgetMatch ? `$${budgetMatch[1]}` : 'TBD',
      status: 'planning'
    }
  }

  private summarizeProject(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30)
    return sentences[0]?.trim()?.slice(0, 300) || 'Project to be defined through planning sessions.'
  }

  private extractScope(messages: Message[]): ProjectScope {
    const content = messages.map(m => m.content).join('\n')

    return {
      inScope: this.extractScopeItems(content, 'in'),
      outOfScope: this.extractScopeItems(content, 'out'),
      boundaries: this.extractBoundaries(content)
    }
  }

  private extractScopeItems(content: string, type: 'in' | 'out'): string[] {
    const items: string[] = []
    const patterns = type === 'in'
      ? [/(?:in scope|included|will include)[:\s]*([^.]+\.)/gi, /(?:^|\n)\s*[-*]\s*(?:include|build|develop|create):?\s*(.+)/gim]
      : [/(?:out of scope|excluded|will not include)[:\s]*([^.]+\.)/gi, /(?:^|\n)\s*[-*]\s*(?:exclude|not include|skip):?\s*(.+)/gim]

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) items.push(match[1].trim())
      }
    })

    if (items.length === 0 && type === 'in') {
      items.push('Core functionality as discussed', 'User-facing features', 'Essential integrations')
    }

    return [...new Set(items)].slice(0, 8)
  }

  private extractBoundaries(content: string): string[] {
    const boundaries: string[] = []
    const boundaryMatch = content.match(/(?:boundary|boundaries|limit|limits)[:\s]*([^.]+\.)/gi)

    if (boundaryMatch) {
      boundaryMatch.forEach(b => {
        boundaries.push(b.replace(/^[^:]+:\s*/, '').trim())
      })
    }

    if (boundaries.length === 0) {
      boundaries.push('Project scope as defined in this document', 'Changes require change request process')
    }

    return boundaries.slice(0, 4)
  }

  private extractObjectives(messages: Message[]): Objective[] {
    const content = messages.map(m => m.content).join('\n')
    const objectives: Objective[] = []

    const objectivePatterns = [
      /(?:objective|goal|aim)[s]?[:\s]*([^.]+\.)/gi,
      /(?:^|\n)\s*\d+\.\s*([^.\n]+goal[^.\n]*\.)/gi,
      /(?:achieve|accomplish|deliver)[:\s]*([^.]+\.)/gi
    ]

    objectivePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 20) {
          objectives.push({
            id: `OBJ-${objectives.length + 1}`,
            description: match[1].trim(),
            measurable: 'TBD',
            targetDate: 'TBD',
            priority: objectives.length < 2 ? 'critical' : objectives.length < 4 ? 'high' : 'medium'
          })
        }
      }
    })

    if (objectives.length === 0) {
      objectives.push(
        { id: 'OBJ-1', description: 'Successfully deliver project on time', measurable: 'Launch date met', targetDate: 'TBD', priority: 'critical' },
        { id: 'OBJ-2', description: 'Meet quality standards', measurable: 'Pass all acceptance criteria', targetDate: 'TBD', priority: 'high' },
        { id: 'OBJ-3', description: 'Stay within budget', measurable: 'Final cost within 10% of budget', targetDate: 'TBD', priority: 'high' }
      )
    }

    return objectives.slice(0, 6)
  }

  private extractDeliverables(messages: Message[]): Deliverable[] {
    const content = messages.map(m => m.content).join('\n')
    const deliverables: Deliverable[] = []

    const deliverablePatterns = [
      /(?:deliverable|output|produce)[s]?[:\s]*([^.]+\.)/gi,
      /(?:^|\n)\s*[-*]\s*(?:deliver|create|build):?\s*(.+)/gim
    ]

    deliverablePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          deliverables.push({
            id: `DEL-${deliverables.length + 1}`,
            name: match[1].slice(0, 50).trim(),
            description: match[1].trim(),
            acceptanceCriteria: ['Meets specifications', 'Reviewed and approved'],
            dueDate: 'TBD',
            owner: 'TBD',
            status: 'not-started'
          })
        }
      }
    })

    if (deliverables.length === 0) {
      deliverables.push(
        { id: 'DEL-1', name: 'Project Documentation', description: 'Complete project documentation', acceptanceCriteria: ['All sections complete'], dueDate: 'TBD', owner: 'TBD', status: 'not-started' },
        { id: 'DEL-2', name: 'Working Solution', description: 'Functional implementation', acceptanceCriteria: ['Passes testing', 'Meets requirements'], dueDate: 'TBD', owner: 'TBD', status: 'not-started' },
        { id: 'DEL-3', name: 'User Training', description: 'Training materials and sessions', acceptanceCriteria: ['Materials complete', 'Training delivered'], dueDate: 'TBD', owner: 'TBD', status: 'not-started' }
      )
    }

    return deliverables.slice(0, 10)
  }

  private generateMilestones(deliverables: Deliverable[]): Milestone[] {
    return [
      {
        id: 'MS-1',
        name: 'Project Kickoff',
        description: 'Project officially starts, team aligned',
        targetDate: 'Week 1',
        deliverables: ['Project brief approved', 'Team assigned'],
        dependencies: []
      },
      {
        id: 'MS-2',
        name: 'Design Complete',
        description: 'All design work finalized',
        targetDate: 'Week 3-4',
        deliverables: deliverables.slice(0, 2).map(d => d.name),
        dependencies: ['MS-1']
      },
      {
        id: 'MS-3',
        name: 'Development Complete',
        description: 'Core development finished',
        targetDate: 'Week 8-10',
        deliverables: deliverables.slice(2, 4).map(d => d.name),
        dependencies: ['MS-2']
      },
      {
        id: 'MS-4',
        name: 'Testing Complete',
        description: 'All testing passed',
        targetDate: 'Week 11-12',
        deliverables: ['Test results', 'Bug fixes'],
        dependencies: ['MS-3']
      },
      {
        id: 'MS-5',
        name: 'Project Launch',
        description: 'Project goes live',
        targetDate: 'Week 13',
        deliverables: ['Deployed solution', 'Training complete'],
        dependencies: ['MS-4']
      }
    ]
  }

  private extractStakeholders(messages: Message[]): Stakeholder[] {
    const content = messages.map(m => m.content).join('\n')
    const stakeholders: Stakeholder[] = []

    // Look for role mentions
    const rolePatterns = [
      /(?:stakeholder|sponsor|lead|manager|owner|team)[:\s]*([^.]+)/gi,
      /(?:report to|work with|collaborate with)[:\s]*([^.]+)/gi
    ]

    rolePatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 3) {
          stakeholders.push({
            name: 'TBD',
            role: match[1].trim().slice(0, 50),
            interest: 'high',
            influence: 'medium',
            communicationNeeds: 'Regular updates'
          })
        }
      }
    })

    if (stakeholders.length === 0) {
      stakeholders.push(
        { name: 'TBD', role: 'Project Sponsor', interest: 'high', influence: 'high', communicationNeeds: 'Weekly status reports' },
        { name: 'TBD', role: 'Project Manager', interest: 'high', influence: 'high', communicationNeeds: 'Daily standups' },
        { name: 'TBD', role: 'End Users', interest: 'high', influence: 'medium', communicationNeeds: 'Milestone updates' },
        { name: 'TBD', role: 'Technical Team', interest: 'medium', influence: 'high', communicationNeeds: 'Sprint reviews' }
      )
    }

    return stakeholders.slice(0, 8)
  }

  private extractConstraints(messages: Message[]): Constraint[] {
    const content = messages.map(m => m.content).join('\n')
    const constraints: Constraint[] = []

    const constraintPatterns = [
      /(?:constraint|limitation|restrict)[s]?[:\s]*([^.]+\.)/gi,
      /(?:must|cannot|should not)[:\s]*([^.]+\.)/gi
    ]

    constraintPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          constraints.push({
            type: this.detectConstraintType(match[1]),
            description: match[1].trim(),
            impact: 'medium',
            mitigation: 'To be defined'
          })
        }
      }
    })

    if (constraints.length === 0) {
      constraints.push(
        { type: 'time', description: 'Fixed timeline', impact: 'high', mitigation: 'Prioritize critical path' },
        { type: 'budget', description: 'Budget constraints', impact: 'medium', mitigation: 'Track spend closely' },
        { type: 'resource', description: 'Limited team capacity', impact: 'medium', mitigation: 'Focus on priorities' }
      )
    }

    return constraints.slice(0, 6)
  }

  private detectConstraintType(text: string): 'time' | 'budget' | 'resource' | 'technical' | 'regulatory' {
    const lower = text.toLowerCase()
    if (lower.includes('time') || lower.includes('deadline') || lower.includes('schedule')) return 'time'
    if (lower.includes('budget') || lower.includes('cost') || lower.includes('money')) return 'budget'
    if (lower.includes('resource') || lower.includes('team') || lower.includes('people')) return 'resource'
    if (lower.includes('compliance') || lower.includes('regulatory') || lower.includes('legal')) return 'regulatory'
    return 'technical'
  }

  private extractAssumptions(messages: Message[]): string[] {
    const content = messages.map(m => m.content).join('\n')
    const assumptions: string[] = []

    const assumptionPatterns = [
      /(?:assum)[e|ing|ption][s]?[:\s]*([^.]+\.)/gi,
      /(?:expect|anticipate)[:\s]*([^.]+\.)/gi
    ]

    assumptionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) assumptions.push(match[1].trim())
      }
    })

    if (assumptions.length === 0) {
      assumptions.push(
        'Resources will be available as planned',
        'Stakeholders will be available for decisions',
        'Third-party dependencies will be delivered on schedule',
        'Requirements are stable and well-defined'
      )
    }

    return [...new Set(assumptions)].slice(0, 8)
  }

  private extractDependencies(messages: Message[]): Dependency[] {
    const content = messages.map(m => m.content).join('\n')
    const dependencies: Dependency[] = []

    const depPatterns = [
      /(?:depend|relies on|requires|blocked by)[s]?[:\s]*([^.]+\.)/gi,
      /(?:before|after|once)[:\s]*([^.]+\.)/gi
    ]

    depPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          dependencies.push({
            id: `DEP-${dependencies.length + 1}`,
            description: match[1].trim(),
            type: match[1].toLowerCase().includes('external') ? 'external' : 'internal',
            status: 'pending',
            owner: 'TBD'
          })
        }
      }
    })

    return dependencies.slice(0, 8)
  }

  private generateCommunicationPlan(): CommunicationPlan {
    return {
      statusReports: {
        frequency: 'Weekly',
        audience: 'Project Sponsor, Stakeholders',
        format: 'Email summary with dashboard link'
      },
      meetings: [
        { type: 'Daily Standup', frequency: 'Daily', attendees: 'Project Team' },
        { type: 'Sprint Review', frequency: 'Bi-weekly', attendees: 'Team + Stakeholders' },
        { type: 'Steering Committee', frequency: 'Monthly', attendees: 'Leadership' }
      ],
      escalationPath: [
        'Project Manager',
        'Project Sponsor',
        'Executive Steering Committee'
      ]
    }
  }

  private calculateCompleteness(messages: Message[]): number {
    const content = messages.map(m => m.content).join(' ').toLowerCase()
    let score = 50

    const indicators = [
      'objective', 'deliverable', 'timeline', 'budget',
      'stakeholder', 'risk', 'scope', 'milestone',
      'dependency', 'resource', 'constraint'
    ]

    indicators.forEach(indicator => {
      if (content.includes(indicator)) score += 4
    })

    score += Math.min(messages.length * 2, 20)

    return Math.min(score, 95)
  }

  private formatAsMarkdown(brief: ProjectBrief): string {
    let md = `# ${brief.title}\n\n`
    md += `**Project ID:** ${brief.projectId} | **Version:** ${brief.version}\n`
    md += `**Created:** ${brief.createdDate.toLocaleDateString()} | **Last Updated:** ${brief.lastUpdated.toLocaleDateString()}\n\n`

    // Summary
    md += `## Project Summary\n\n`
    md += `**Project Name:** ${brief.summary.projectName}\n\n`
    md += `${brief.summary.description}\n\n`
    md += `| Field | Value |\n|-------|-------|\n`
    md += `| Sponsor | ${brief.summary.sponsor} |\n`
    md += `| Project Manager | ${brief.summary.projectManager} |\n`
    md += `| Start Date | ${brief.summary.startDate} |\n`
    md += `| End Date | ${brief.summary.endDate} |\n`
    md += `| Budget | ${brief.summary.budget} |\n`
    md += `| Status | ${brief.summary.status} |\n\n`

    // Scope
    md += `## Project Scope\n\n`
    md += `### In Scope\n`
    brief.scope.inScope.forEach(item => {
      md += `- ${item}\n`
    })
    md += `\n### Out of Scope\n`
    brief.scope.outOfScope.forEach(item => {
      md += `- ${item}\n`
    })
    md += '\n'

    // Objectives
    md += `## Objectives\n\n`
    md += `| ID | Description | Priority | Target Date |\n`
    md += `|----|-------------|----------|-------------|\n`
    brief.objectives.forEach(obj => {
      md += `| ${obj.id} | ${obj.description.slice(0, 60)}... | ${obj.priority} | ${obj.targetDate} |\n`
    })
    md += '\n'

    // Deliverables
    md += `## Deliverables\n\n`
    brief.deliverables.forEach(del => {
      md += `### ${del.id}: ${del.name}\n`
      md += `${del.description}\n`
      md += `- **Due:** ${del.dueDate}\n`
      md += `- **Owner:** ${del.owner}\n`
      md += `- **Status:** ${del.status}\n\n`
    })

    // Milestones
    md += `## Milestones\n\n`
    md += `| ID | Milestone | Target Date |\n`
    md += `|----|-----------|-------------|\n`
    brief.milestones.forEach(ms => {
      md += `| ${ms.id} | ${ms.name} | ${ms.targetDate} |\n`
    })
    md += '\n'

    // Stakeholders
    md += `## Stakeholders\n\n`
    md += `| Role | Interest | Influence | Communication |\n`
    md += `|------|----------|-----------|---------------|\n`
    brief.stakeholders.forEach(sh => {
      md += `| ${sh.role} | ${sh.interest} | ${sh.influence} | ${sh.communicationNeeds} |\n`
    })
    md += '\n'

    // Constraints
    md += `## Constraints\n\n`
    brief.constraints.forEach(c => {
      md += `- **${c.type}:** ${c.description} (Impact: ${c.impact})\n`
    })
    md += '\n'

    // Assumptions
    md += `## Assumptions\n\n`
    brief.assumptions.forEach(a => {
      md += `- ${a}\n`
    })
    md += '\n'

    // Communication Plan
    md += `## Communication Plan\n\n`
    md += `**Status Reports:** ${brief.communicationPlan.statusReports.frequency} to ${brief.communicationPlan.statusReports.audience}\n\n`
    md += `### Meetings\n`
    brief.communicationPlan.meetings.forEach(m => {
      md += `- **${m.type}:** ${m.frequency} - ${m.attendees}\n`
    })

    md += `\n---\n*Completeness Score: ${brief.metadata.completenessScore}% | Generated: ${brief.metadata.generatedAt.toLocaleString()}*\n`

    return md
  }

  private formatAsHTML(brief: ProjectBrief): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${brief.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1a1a1a; }
    h1 { color: #2C2416; border-bottom: 3px solid #C4785C; padding-bottom: 10px; }
    h2 { color: #4A3D2E; margin-top: 30px; border-bottom: 1px solid #F5F0E6; padding-bottom: 8px; }
    .meta { background: #F5F0E6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #F5F0E6; padding: 10px; text-align: left; }
    th { background: #FAF7F2; font-weight: 600; }
    .priority-critical { color: #8B4D3B; font-weight: 600; }
    .priority-high { color: #C4785C; font-weight: 600; }
    .priority-medium { color: #D4A84B; }
    .priority-low { color: #4A6741; }
    .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
    .status-planning { background: #F5F0E6; color: #B56A4E; }
    .deliverable-card { background: #FAF7F2; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #C4785C; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #F5F0E6; color: #6B7B8C; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>${brief.title}</h1>
  <div class="meta">
    <strong>Project ID:</strong> ${brief.projectId} |
    <strong>Version:</strong> ${brief.version} |
    <strong>Status:</strong> <span class="status-badge status-${brief.summary.status}">${brief.summary.status}</span>
  </div>

  <h2>Project Summary</h2>
  <p>${brief.summary.description}</p>
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Sponsor</td><td>${brief.summary.sponsor}</td></tr>
    <tr><td>Project Manager</td><td>${brief.summary.projectManager}</td></tr>
    <tr><td>Start Date</td><td>${brief.summary.startDate}</td></tr>
    <tr><td>End Date</td><td>${brief.summary.endDate}</td></tr>
    <tr><td>Budget</td><td>${brief.summary.budget}</td></tr>
  </table>

  <h2>Project Scope</h2>
  <h3>In Scope</h3>
  <ul>
    ${brief.scope.inScope.map(i => `<li>${i}</li>`).join('\n')}
  </ul>
  <h3>Out of Scope</h3>
  <ul>
    ${brief.scope.outOfScope.map(i => `<li>${i}</li>`).join('\n')}
  </ul>

  <h2>Objectives</h2>
  <table>
    <tr><th>ID</th><th>Description</th><th>Priority</th><th>Target Date</th></tr>
    ${brief.objectives.map(o => `
      <tr>
        <td>${o.id}</td>
        <td>${o.description}</td>
        <td class="priority-${o.priority}">${o.priority}</td>
        <td>${o.targetDate}</td>
      </tr>
    `).join('\n')}
  </table>

  <h2>Deliverables</h2>
  ${brief.deliverables.map(d => `
    <div class="deliverable-card">
      <strong>${d.id}: ${d.name}</strong>
      <p>${d.description}</p>
      <small>Due: ${d.dueDate} | Owner: ${d.owner} | Status: ${d.status}</small>
    </div>
  `).join('\n')}

  <h2>Milestones</h2>
  <table>
    <tr><th>ID</th><th>Milestone</th><th>Target Date</th></tr>
    ${brief.milestones.map(m => `<tr><td>${m.id}</td><td>${m.name}</td><td>${m.targetDate}</td></tr>`).join('\n')}
  </table>

  <h2>Stakeholders</h2>
  <table>
    <tr><th>Role</th><th>Interest</th><th>Influence</th><th>Communication</th></tr>
    ${brief.stakeholders.map(s => `<tr><td>${s.role}</td><td>${s.interest}</td><td>${s.influence}</td><td>${s.communicationNeeds}</td></tr>`).join('\n')}
  </table>

  <footer>
    Completeness Score: ${brief.metadata.completenessScore}% | Generated: ${brief.metadata.generatedAt.toLocaleString()}
  </footer>
</body>
</html>`
  }
}

export function createProjectBriefGenerator(): ProjectBriefGenerator {
  return new ProjectBriefGenerator()
}
