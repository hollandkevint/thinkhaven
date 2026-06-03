'use client'

import { useEffect, useMemo } from 'react'
import { Artifact } from '@/app/components/artifact'
import {
  hasArtifacts,
  parseArtifactsFromResponse,
  useSafeArtifacts,
} from '@/lib/artifact'
import MarkdownRenderer from './MarkdownRenderer'

interface ArtifactAwareContentProps {
  content: string
  sessionId?: string
  isStreaming?: boolean
  onPopOutArtifact?: (id: string) => void
}

export default function ArtifactAwareContent({
  content,
  sessionId,
  isStreaming = false,
  onPopOutArtifact,
}: ArtifactAwareContentProps) {
  const artifactContext = useSafeArtifacts()
  const artifactSessionId = sessionId || artifactContext?.sessionId || 'default'
  const addArtifacts = artifactContext?.addArtifacts

  const { artifacts, cleanedContent } = useMemo(() => {
    if (!content || isStreaming || !hasArtifacts(content)) {
      return { artifacts: [], cleanedContent: content }
    }

    return parseArtifactsFromResponse(content, artifactSessionId)
  }, [artifactSessionId, content, isStreaming])

  useEffect(() => {
    if (!isStreaming && artifacts.length > 0) {
      addArtifacts?.(artifacts)
    }
  }, [addArtifacts, artifacts, isStreaming])

  return (
    <div className="space-y-4">
      <MarkdownRenderer content={cleanedContent} />

      {!isStreaming && artifactContext && artifacts.length > 0 && (
        <div className="space-y-3 mt-4">
          {artifacts.map((artifact) => (
            <Artifact
              key={artifact.id}
              artifact={artifact}
              onPopOut={onPopOutArtifact}
            />
          ))}
        </div>
      )}
    </div>
  )
}
