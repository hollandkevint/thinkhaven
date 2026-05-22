/**
 * Artifact Parser for ThinkHaven
 *
 * Extracts artifacts from AI responses using explicit markers and
 * pattern detection for structured outputs.
 */

import {
  type Artifact,
  type ArtifactType,
  createArtifact,
  ARTIFACT_CONFIGS,
} from './artifact-types';

/**
 * Regex to match explicit artifact markers in AI responses
 * Format: <artifact type="type" title="title">content</artifact>
 */
const ARTIFACT_REGEX = /<artifact\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/artifact>/g;

/**
 * Regex to match code blocks that might be diagrams
 */
const MERMAID_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g;

/**
 * Parse result from extraction
 */
export interface ParseResult {
  artifacts: Artifact[];
  cleanedContent: string;
}

/**
 * Valid artifact type strings
 */
const VALID_ARTIFACT_TYPES = Object.keys(ARTIFACT_CONFIGS) as ArtifactType[];

/**
 * Check if a string is a valid artifact type
 */
function isValidArtifactType(type: string): type is ArtifactType {
  return VALID_ARTIFACT_TYPES.includes(type as ArtifactType);
}

/**
 * Extract artifacts from AI response text
 *
 * Supports:
 * 1. Explicit markers: <artifact type="..." title="...">content</artifact>
 * 2. Mermaid code blocks (converted to mermaid-diagram artifacts)
 *
 * @param response - The AI response text
 * @param sessionId - The session ID to associate with artifacts
 * @returns ParseResult with extracted artifacts and cleaned content
 */
export function parseArtifactsFromResponse(
  response: string,
  sessionId: string
): ParseResult {
  ARTIFACT_REGEX.lastIndex = 0;
  MERMAID_BLOCK_REGEX.lastIndex = 0;

  const artifacts: Artifact[] = [];
  let cleanedContent = response;

  // 1. Extract explicit artifact markers
  const explicitMatches = [...response.matchAll(ARTIFACT_REGEX)];

  for (const match of explicitMatches) {
    const [fullMatch, typeStr, title, content] = match;

    if (isValidArtifactType(typeStr)) {
      const artifact = createArtifact({
        type: typeStr,
        title: title.trim(),
        content: content.trim(),
        sessionId,
      });
      artifacts.push(artifact);

      // Replace the artifact marker with a placeholder reference
      cleanedContent = cleanedContent.replace(
        fullMatch,
        `[📄 ${title}](#artifact-${artifact.id})`
      );
    }
  }

  // 2. Extract Mermaid diagrams from code blocks
  const mermaidMatches = [...cleanedContent.matchAll(MERMAID_BLOCK_REGEX)];

  for (const match of mermaidMatches) {
    const [fullMatch, content] = match;

    // Try to extract a title from the first line comment or graph declaration
    const titleMatch = content.match(/^(?:%%\s*(.+)|(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)\s+(?:LR|TB|BT|RL)?\s*(?:%%.*)?\n)/);
    const title = titleMatch?.[1]?.trim() || 'Diagram';

    const artifact = createArtifact({
      type: 'mermaid-diagram',
      title,
      content: content.trim(),
      sessionId,
    });
    artifacts.push(artifact);

    // Replace the mermaid block with a placeholder
    cleanedContent = cleanedContent.replace(
      fullMatch,
      `[📊 ${title}](#artifact-${artifact.id})`
    );
  }

  return {
    artifacts,
    cleanedContent,
  };
}

/**
 * Check if a response contains any artifact markers
 *
 * @param response - The AI response text
 * @returns true if the response contains artifact markers
 */
export function hasArtifacts(response: string): boolean {
  ARTIFACT_REGEX.lastIndex = 0;
  MERMAID_BLOCK_REGEX.lastIndex = 0;
  const containsArtifact =
    ARTIFACT_REGEX.test(response) || MERMAID_BLOCK_REGEX.test(response);
  ARTIFACT_REGEX.lastIndex = 0;
  MERMAID_BLOCK_REGEX.lastIndex = 0;
  return containsArtifact;
}

/**
 * Create an artifact from generator output
 *
 * Used when existing generators (LeanCanvasGenerator, ProductBriefGenerator, etc.)
 * produce structured output that should be wrapped as an artifact.
 *
 * @param type - The artifact type
 * @param title - The artifact title
 * @param content - The generated content
 * @param sessionId - The session ID
 * @returns A new artifact
 */
export function createArtifactFromGenerator(
  type: ArtifactType,
  title: string,
  content: string,
  sessionId: string
): Artifact {
  return createArtifact({
    type,
    title,
    content,
    sessionId,
  });
}

/**
 * Serialize an artifact to the explicit marker format
 *
 * Useful for including artifacts in prompts or exports.
 *
 * @param artifact - The artifact to serialize
 * @returns The serialized artifact string
 */
export function serializeArtifact(artifact: Artifact): string {
  return `<artifact type="${artifact.type}" title="${artifact.title}">\n${artifact.content}\n</artifact>`;
}
