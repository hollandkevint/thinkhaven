/**
 * Lean Canvas Tool Handler
 *
 * Validates input, merges the owned session canvas, and returns its state.
 * Matches existing tool handler patterns (try/catch, ToolResult shape).
 */

import { LEAN_CANVAS_FIELDS, type LeanCanvas } from '@/lib/canvas/lean-canvas-schema';
import { updateOwnedLeanCanvas } from '@/lib/db/repositories/ai-artifact-repository';
import type { ToolResult } from './index';

export interface UpdateLeanCanvasInput {
  updates: Partial<LeanCanvas>;
}

export interface UpdateLeanCanvasResult extends ToolResult {
  data?: {
    updated_boxes: string[];
    current_canvas: LeanCanvas;
    empty_boxes: string[];
  };
}

function validateLeanCanvasUpdates(raw: Record<string, unknown>): Partial<LeanCanvas> {
  const validated: Partial<LeanCanvas> = {};
  for (const key of LEAN_CANVAS_FIELDS) {
    if (key in raw && typeof raw[key] === 'string') {
      validated[key] = [...(raw[key] as string)].slice(0, 500).join('');
    }
  }
  return validated;
}

export async function updateLeanCanvas(
  sessionId: string,
  userId: string,
  input: UpdateLeanCanvasInput
): Promise<UpdateLeanCanvasResult> {
  try {
    const validated = validateLeanCanvasUpdates(input.updates as Record<string, unknown>);

    if (Object.keys(validated).length === 0) {
      return { success: false, error: 'No valid canvas fields in updates' };
    }

    let updatedCanvas: LeanCanvas | null;
    try {
      updatedCanvas = await updateOwnedLeanCanvas(sessionId, userId, validated);
    } catch (error) {
      return { success: false, error: `Canvas update failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }

    if (!updatedCanvas) return { success: false, error: 'Session not found or access denied' };

    const canvas = updatedCanvas as LeanCanvas;
    const emptyBoxes = LEAN_CANVAS_FIELDS.filter(f => !canvas[f]);

    return {
      success: true,
      data: {
        updated_boxes: Object.keys(validated),
        current_canvas: canvas,
        empty_boxes: emptyBoxes,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Error updating lean canvas: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
