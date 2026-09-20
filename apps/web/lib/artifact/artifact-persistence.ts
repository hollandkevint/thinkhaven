/**
 * Artifact Persistence Service
 *
 * Session-artifact persistence uses the application-owned PostgreSQL pool.
 * The verified Railway snapshot does not contain session_artifacts, so those
 * operations fail closed until that table is intentionally migrated.
 */

import 'next/dist/compiled/server-only'

import { getDatabasePool } from '@/lib/db/pool'
import type { Artifact, ArtifactRenderMode, ArtifactType, ArtifactViewMode } from './artifact-types'

interface ArtifactRow {
  id: string
  session_id: string
  type: string
  title: string
  content: string
  metadata: Record<string, unknown> | null
  view_mode: string
  render_mode: string
  created_at: string | Date
  updated_at: string | Date
}

type Queryable = Pick<ReturnType<typeof getDatabasePool>, 'query'>

function timestamp(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

function rowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    sessionId: row.session_id,
    type: row.type as ArtifactType,
    title: row.title,
    content: row.content,
    metadata: row.metadata ?? {},
    viewMode: row.view_mode as ArtifactViewMode,
    renderMode: row.render_mode as ArtifactRenderMode,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  }
}

function isMissingTable(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '42P01'
}

function persistenceError(operation: string, error: unknown): Error {
  if (isMissingTable(error)) {
    return new Error(`Failed to ${operation}: session_artifacts is not present in the verified Railway schema`)
  }

  return new Error(
    `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown database error'}`,
  )
}

function artifactValues(artifact: Artifact, sessionId: string, updatedAt: string): unknown[] {
  return [
    artifact.id,
    sessionId,
    artifact.type,
    artifact.title,
    artifact.content,
    artifact.metadata || {},
    artifact.viewMode,
    artifact.renderMode,
    updatedAt,
  ]
}

async function upsertArtifacts(
  artifacts: Artifact[],
  sessionId: string,
  pool: Queryable,
): Promise<void> {
  const updatedAt = new Date().toISOString()
  const values = artifacts.flatMap((artifact) => artifactValues(artifact, sessionId, updatedAt))
  const placeholders = artifacts.map((_, index) => {
    const offset = index * 9
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
  })

  await pool.query(
    `
      INSERT INTO "public"."session_artifacts" (
        "id", "session_id", "type", "title", "content",
        "metadata", "view_mode", "render_mode", "updated_at"
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT ("id") DO UPDATE SET
        "session_id" = EXCLUDED."session_id",
        "type" = EXCLUDED."type",
        "title" = EXCLUDED."title",
        "content" = EXCLUDED."content",
        "metadata" = EXCLUDED."metadata",
        "view_mode" = EXCLUDED."view_mode",
        "render_mode" = EXCLUDED."render_mode",
        "updated_at" = EXCLUDED."updated_at"
    `,
    values,
  )
}

/** Save an artifact, updating an existing row with the same ID. */
export async function saveArtifact(artifact: Artifact, sessionId: string): Promise<void> {
  try {
    await upsertArtifacts([artifact], sessionId, getDatabasePool())
  } catch (error) {
    console.error('Failed to save artifact:', error)
    throw persistenceError('save artifact', error)
  }
}

/** Load artifacts for one session. There is deliberately no unscoped listing. */
export async function loadArtifacts(sessionId: string): Promise<Artifact[]> {
  try {
    const { rows } = await getDatabasePool().query<ArtifactRow>(
      `
        SELECT
          "id", "session_id", "type", "title", "content", "metadata",
          "view_mode", "render_mode", "created_at", "updated_at"
        FROM "public"."session_artifacts"
        WHERE "session_id" = $1
        ORDER BY "created_at" ASC
      `,
      [sessionId],
    )

    return rows.map(rowToArtifact)
  } catch (error) {
    console.error('Failed to load artifacts:', error)
    throw persistenceError('load artifacts', error)
  }
}

/** Delete one artifact by ID. */
export async function deleteArtifact(artifactId: string): Promise<void> {
  try {
    await getDatabasePool().query(
      `DELETE FROM "public"."session_artifacts" WHERE "id" = $1`,
      [artifactId],
    )
  } catch (error) {
    console.error('Failed to delete artifact:', error)
    throw persistenceError('delete artifact', error)
  }
}

/** Batch-save artifacts for one session. */
export async function saveArtifacts(artifacts: Artifact[], sessionId: string): Promise<void> {
  if (artifacts.length === 0) return

  try {
    await upsertArtifacts(artifacts, sessionId, getDatabasePool())
  } catch (error) {
    console.error('Failed to save artifacts batch:', error)
    throw persistenceError('save artifacts batch', error)
  }
}
