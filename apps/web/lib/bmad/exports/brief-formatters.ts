/**
 * Feature Brief Export Formatters
 * Story 2.4c: Convert feature briefs to multiple export formats
 */

import { FeatureBrief } from '../types';
import { EXPORT_FORMATS } from '../templates/feature-brief-templates';

/**
 * Format feature brief as Markdown
 * Enhanced with GFM (GitHub Flavored Markdown) tables and better formatting
 */
export function formatBriefAsMarkdown(brief: FeatureBrief): string {
  const markdown = `# ${brief.title}

> *Generated on ${new Date(brief.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}*

## 📋 Description

${brief.description}

## 🎯 Priority Context

| Metric | Value |
|--------|-------|
| **Priority Score** | ${brief.priorityContext.score.toFixed(2)} |
| **Category** | \`${brief.priorityContext.category}\` |
| **Quadrant** | ${brief.priorityContext.quadrant} |

## 👥 User Stories

${brief.userStories.map((story, index) => `${index + 1}. ${story}`).join('\n')}

## ✅ Acceptance Criteria

${brief.acceptanceCriteria.map((ac, index) => `${index + 1}. ${ac}`).join('\n')}

## 📊 Success Metrics

${brief.successMetrics.map((metric, index) => `${index + 1}. ${metric}`).join('\n')}

## 💡 Implementation Notes

${brief.implementationNotes.map((note, index) => `${index + 1}. ${note}`).join('\n')}

---

<details>
<summary><strong>Metadata</strong></summary>

- **Version**: ${brief.version}
- **Last Edited**: ${new Date(brief.lastEditedAt).toLocaleDateString()}
- **Generated with**: BMad Method Feature Refinement Pathway

</details>
`;

  return markdown;
}

/**
 * Format feature brief as Markdown (plain version without emojis)
 * For platforms that don't support emojis well
 */
export function formatBriefAsMarkdownPlain(brief: FeatureBrief): string {
  const markdown = `# ${brief.title}

> *Generated on ${new Date(brief.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}*

## Description

${brief.description}

## Priority Context

| Metric | Value |
|--------|-------|
| **Priority Score** | ${brief.priorityContext.score.toFixed(2)} |
| **Category** | \`${brief.priorityContext.category}\` |
| **Quadrant** | ${brief.priorityContext.quadrant} |

## User Stories

${brief.userStories.map((story, index) => `${index + 1}. ${story}`).join('\n')}

## Acceptance Criteria

${brief.acceptanceCriteria.map((ac, index) => `${index + 1}. ${ac}`).join('\n')}

## Success Metrics

${brief.successMetrics.map((metric, index) => `${index + 1}. ${metric}`).join('\n')}

## Implementation Notes

${brief.implementationNotes.map((note, index) => `${index + 1}. ${note}`).join('\n')}

---

*Feature Brief v${brief.version} | Last Edited: ${new Date(brief.lastEditedAt).toLocaleDateString()}*
*Generated with BMad Method Feature Refinement Pathway*
`;

  return markdown;
}

/**
 * Format feature brief as plain text
 * Simple text format for email or basic documentation
 */
export function formatBriefAsText(brief: FeatureBrief): string {
  const text = `${brief.title}
${'='.repeat(brief.title.length)}

Generated: ${new Date(brief.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}

DESCRIPTION
-----------
${brief.description}

PRIORITY CONTEXT
---------------
Priority Score: ${brief.priorityContext.score.toFixed(2)}
Category: ${brief.priorityContext.category}
Quadrant: ${brief.priorityContext.quadrant}

USER STORIES
-----------
${brief.userStories.map((story, index) => `${index + 1}. ${story}`).join('\n')}

ACCEPTANCE CRITERIA
------------------
${brief.acceptanceCriteria.map((ac, index) => `${index + 1}. ${ac}`).join('\n')}

SUCCESS METRICS
--------------
${brief.successMetrics.map((metric, index) => `${index + 1}. ${metric}`).join('\n')}

IMPLEMENTATION NOTES
-------------------
${brief.implementationNotes.map((note, index) => `${index + 1}. ${note}`).join('\n')}

---
Feature Brief v${brief.version} | Last Edited: ${new Date(brief.lastEditedAt).toLocaleDateString()}
Generated with BMad Method Feature Refinement Pathway
`;

  return text;
}

/**
 * Format feature brief as HTML
 * Professional HTML formatting for PDF conversion or web display
 */
export function formatBriefAsHTML(brief: FeatureBrief): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brief.title} - Feature Brief</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      color: #2C2416;
      border-bottom: 3px solid #C4785C;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #4A3D2E;
      border-bottom: 1px solid #F5F0E6;
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .meta {
      color: #6B7B8C;
      font-style: italic;
      margin-bottom: 30px;
    }
    .priority-context {
      background: #FAF7F2;
      border-left: 4px solid #C4785C;
      padding: 15px;
      margin: 20px 0;
    }
    .priority-context strong {
      color: #B56A4E;
    }
    ol {
      padding-left: 25px;
    }
    li {
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #F5F0E6;
      text-align: center;
      color: #6B7B8C;
      font-size: 14px;
    }
    .category-critical { color: #8B4D3B; font-weight: bold; }
    .category-high { color: #C4785C; font-weight: bold; }
    .category-medium { color: #D4A84B; font-weight: bold; }
    .category-low { color: #6B7B8C; }
    .quadrant {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    }
    .quadrant-quick-wins { background: #d4e5d0; color: #4A6741; }
    .quadrant-major-projects { background: #F5F0E6; color: #B56A4E; }
    .quadrant-fill-ins { background: #f5ecd0; color: #744210; }
    .quadrant-time-wasters { background: #f5e6e3; color: #8B4D3B; }
  </style>
</head>
<body>
  <h1>${brief.title}</h1>

  <p class="meta">Generated on ${new Date(brief.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</p>

  <h2>Description</h2>
  <p>${brief.description}</p>

  <div class="priority-context">
    <h2 style="margin-top: 0; border: none;">Priority Context</h2>
    <p><strong>Priority Score:</strong> ${brief.priorityContext.score.toFixed(2)}</p>
    <p><strong>Category:</strong> <span class="category-${brief.priorityContext.category.toLowerCase()}">${brief.priorityContext.category}</span></p>
    <p><strong>Quadrant:</strong> <span class="quadrant quadrant-${brief.priorityContext.quadrant.toLowerCase().replace(/ /g, '-')}">${brief.priorityContext.quadrant}</span></p>
  </div>

  <h2>User Stories</h2>
  <ol>
    ${brief.userStories.map(story => `<li>${story}</li>`).join('\n    ')}
  </ol>

  <h2>Acceptance Criteria</h2>
  <ol>
    ${brief.acceptanceCriteria.map(ac => `<li>${ac}</li>`).join('\n    ')}
  </ol>

  <h2>Success Metrics</h2>
  <ol>
    ${brief.successMetrics.map(metric => `<li>${metric}</li>`).join('\n    ')}
  </ol>

  <h2>Implementation Notes</h2>
  <ol>
    ${brief.implementationNotes.map(note => `<li>${note}</li>`).join('\n    ')}
  </ol>

  <div class="footer">
    <p>Feature Brief v${brief.version} | Last Edited: ${new Date(brief.lastEditedAt).toLocaleDateString()}</p>
    <p>Generated with BMad Method Feature Refinement Pathway</p>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Format feature brief as PDF
 * Uses HTML to PDF conversion (requires puppeteer or similar library)
 * For MVP, returns HTML string that can be converted client-side
 */
export async function formatBriefAsPDF(brief: FeatureBrief): Promise<string> {
  // For MVP implementation, return HTML that can be converted to PDF client-side
  // or using a browser print function
  //
  // In production, this could use:
  // - puppeteer for server-side PDF generation
  // - jsPDF for client-side PDF generation
  // - A PDF generation service API

  const html = formatBriefAsHTML(brief);

  // Return HTML for now - client can convert to PDF using browser print
  // or we can add puppeteer later for true server-side PDF generation
  return html;
}

/**
 * Get download file name for a brief
 */
export function getBriefFileName(brief: FeatureBrief, format: 'markdown' | 'text' | 'pdf'): string {
  const sanitizedTitle = brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const extension = EXPORT_FORMATS[format].extension;
  return `${sanitizedTitle}-brief${extension}`;
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: 'markdown' | 'text' | 'pdf'): string {
  return EXPORT_FORMATS[format].mimeType;
}

/**
 * Create download blob for export
 * (Client-side utility for browser downloads)
 */
export function createDownloadBlob(content: string, format: 'markdown' | 'text' | 'pdf'): Blob {
  const mimeType = getMimeType(format);
  return new Blob([content], { type: mimeType });
}

/**
 * Format brief as JSON (for API responses or data transfer)
 */
export function formatBriefAsJSON(brief: FeatureBrief): string {
  return JSON.stringify(brief, null, 2);
}

/**
 * Format brief summary (short version for previews)
 */
export function formatBriefSummary(brief: FeatureBrief): string {
  return `${brief.title}

${brief.description}

Priority: ${brief.priorityContext.category} (${brief.priorityContext.quadrant})
User Stories: ${brief.userStories.length}
Acceptance Criteria: ${brief.acceptanceCriteria.length}
Success Metrics: ${brief.successMetrics.length}`;
}

/**
 * Copy text to clipboard (client-side utility)
 * Returns promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  await navigator.clipboard.writeText(text);
}

/**
 * Download file (client-side utility)
 * Creates a download link and triggers it
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format brief for email
 * Plain text format optimized for email clients
 */
export function formatBriefForEmail(brief: FeatureBrief): string {
  const text = formatBriefAsText(brief);

  // Add email-friendly formatting
  const emailText = `Subject: Feature Brief: ${brief.title}

Hi team,

I've completed the feature brief for "${brief.title}". Here are the details:

${text}

Please review and let me know if you have any questions.

Best regards`;

  return emailText;
}

/**
 * Format brief for Jira/issue tracking
 * Simplified format for pasting into issue trackers
 */
export function formatBriefForIssueTracker(brief: FeatureBrief): string {
  return `*${brief.title}*

h2. Description
${brief.description}

h2. Priority
* Score: ${brief.priorityContext.score.toFixed(2)}
* Category: ${brief.priorityContext.category}
* Quadrant: ${brief.priorityContext.quadrant}

h2. User Stories
${brief.userStories.map((story, i) => `${i + 1}. ${story}`).join('\n')}

h2. Acceptance Criteria
${brief.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

h2. Success Metrics
${brief.successMetrics.map((metric, i) => `${i + 1}. ${metric}`).join('\n')}

h2. Implementation Notes
${brief.implementationNotes.map((note, i) => `${i + 1}. ${note}`).join('\n')}
`;
}