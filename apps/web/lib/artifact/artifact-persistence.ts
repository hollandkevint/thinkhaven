/**
 * Artifact Persistence Service
 *
 * Handles saving and loading artifacts to/from Supabase.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Artifact, ArtifactType, ArtifactViewMode, ArtifactRenderMode } from './artifact-types';

// Database row type
interface ArtifactRow {
  id: string;
  session_id: string;
  type: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  view_mode: string;
  render_mode: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save an artifact to the database
 * Uses upsert to handle both create and update
 */
export async function saveArtifact(artifact: Artifact, sessionId: string): Promise<void> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase
    .from('session_artifacts')
    .upsert({
      id: artifact.id,
      session_id: sessionId,
      type: artifact.type,
      title: artifact.title,
      content: artifact.content,
      metadata: artifact.metadata || {},
      view_mode: artifact.viewMode,
      render_mode: artifact.renderMode,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    });

  if (error) {
    console.error('Failed to save artifact:', error);
    throw new Error(`Failed to save artifact: ${error.message}`);
  }
}

/**
 * Load all artifacts for a session
 */
export async function loadArtifacts(sessionId: string): Promise<Artifact[]> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('session_artifacts')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load artifacts:', error);
    throw new Error(`Failed to load artifacts: ${error.message}`);
  }

  return (data || []).map((row: ArtifactRow) => rowToArtifact(row));
}

/**
 * Delete an artifact from the database
 */
export async function deleteArtifact(artifactId: string): Promise<void> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase
    .from('session_artifacts')
    .delete()
    .eq('id', artifactId);

  if (error) {
    console.error('Failed to delete artifact:', error);
    throw new Error(`Failed to delete artifact: ${error.message}`);
  }
}

/**
 * Convert database row to Artifact type
 */
function rowToArtifact(row: ArtifactRow): Artifact {
  return {
    id: row.id,
    type: row.type as ArtifactType,
    title: row.title,
    content: row.content,
    metadata: row.metadata,
    viewMode: row.view_mode as ArtifactViewMode,
    renderMode: row.render_mode as ArtifactRenderMode,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Batch save multiple artifacts (for initial session load)
 */
export async function saveArtifacts(artifacts: Artifact[], sessionId: string): Promise<void> {
  if (artifacts.length === 0) return;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const rows = artifacts.map(artifact => ({
    id: artifact.id,
    session_id: sessionId,
    type: artifact.type,
    title: artifact.title,
    content: artifact.content,
    metadata: artifact.metadata || {},
    view_mode: artifact.viewMode,
    render_mode: artifact.renderMode,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('session_artifacts')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('Failed to save artifacts batch:', error);
    throw new Error(`Failed to save artifacts batch: ${error.message}`);
  }
}
