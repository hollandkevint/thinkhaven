/**
 * Tool Executor Tests
 *
 * Tests the tool execution engine and helper functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ToolExecutor,
  parseToolUseBlocks,
  hasToolUse,
  extractTextContent,
  type ToolCall,
} from '@/lib/ai/tool-executor';

describe('Tool Executor Helper Functions', () => {
  describe('parseToolUseBlocks', () => {
    it('should extract tool use blocks from content', () => {
      const contentBlocks = [
        { type: 'text', text: 'Here is my analysis' },
        {
          type: 'tool_use',
          id: 'tool-123',
          name: 'read_session_state',
          input: {}
        },
        { type: 'text', text: 'After reading the state...' },
        {
          type: 'tool_use',
          id: 'tool-456',
          name: 'complete_phase',
          input: { reason: 'User has validated assumptions' }
        },
      ];

      const toolCalls = parseToolUseBlocks(contentBlocks);

      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0]).toEqual({
        id: 'tool-123',
        name: 'read_session_state',
        input: {},
      });
      expect(toolCalls[1]).toEqual({
        id: 'tool-456',
        name: 'complete_phase',
        input: { reason: 'User has validated assumptions' },
      });
    });

    it('should return empty array when no tool use blocks', () => {
      const contentBlocks = [
        { type: 'text', text: 'Just text content' },
      ];

      const toolCalls = parseToolUseBlocks(contentBlocks);

      expect(toolCalls).toHaveLength(0);
    });

    it('should handle missing fields gracefully', () => {
      const contentBlocks = [
        { type: 'tool_use' }, // Missing id, name, input
      ];

      const toolCalls = parseToolUseBlocks(contentBlocks);

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0]).toEqual({
        id: '',
        name: '',
        input: {},
      });
    });
  });

  describe('hasToolUse', () => {
    it('should return true when tool_use block exists', () => {
      const contentBlocks = [
        { type: 'text' },
        { type: 'tool_use' },
      ];

      expect(hasToolUse(contentBlocks)).toBe(true);
    });

    it('should return false when no tool_use blocks', () => {
      const contentBlocks = [
        { type: 'text' },
        { type: 'text' },
      ];

      expect(hasToolUse(contentBlocks)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasToolUse([])).toBe(false);
    });
  });

  describe('extractTextContent', () => {
    it('should extract and concatenate text blocks', () => {
      const contentBlocks = [
        { type: 'text', text: 'Hello ' },
        { type: 'tool_use' },
        { type: 'text', text: 'World!' },
      ];

      const text = extractTextContent(contentBlocks);

      expect(text).toBe('Hello World!');
    });

    it('should return empty string when no text blocks', () => {
      const contentBlocks = [
        { type: 'tool_use' },
      ];

      const text = extractTextContent(contentBlocks);

      expect(text).toBe('');
    });

    it('should skip text blocks with missing text property', () => {
      const contentBlocks = [
        { type: 'text' }, // Missing text property
        { type: 'text', text: 'Valid text' },
      ];

      const text = extractTextContent(contentBlocks);

      expect(text).toBe('Valid text');
    });
  });
});

describe('ToolExecutor.formatResultsForClaude', () => {
  it('should format results correctly', () => {
    const results = [
      {
        toolCallId: 'call-123',
        toolName: 'read_session_state',
        result: {
          success: true,
          data: { sessionId: 'sess-1', pathway: 'new-idea' },
        },
        executionTimeMs: 50,
      },
      {
        toolCallId: 'call-456',
        toolName: 'complete_phase',
        result: {
          success: false,
          error: 'Session not found',
        },
        executionTimeMs: 25,
      },
    ];

    const formatted = ToolExecutor.formatResultsForClaude(results);

    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toEqual({
      type: 'tool_result',
      tool_use_id: 'call-123',
      content: JSON.stringify({
        success: true,
        data: { sessionId: 'sess-1', pathway: 'new-idea' },
      }),
    });
    expect(formatted[1]).toEqual({
      type: 'tool_result',
      tool_use_id: 'call-456',
      content: JSON.stringify({
        success: false,
        error: 'Session not found',
      }),
    });
  });
});

describe('ToolExecutor', () => {
  let executor: ToolExecutor;

  beforeEach(() => {
    executor = new ToolExecutor({
      sessionId: 'test-session-123',
      userId: 'test-user-456',
    });
  });

  describe('execute', () => {
    it('should return error for unknown tool', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'unknown_tool',
        input: {},
      };

      const result = await executor.execute(toolCall);

      expect(result.toolCallId).toBe('call-1');
      expect(result.toolName).toBe('unknown_tool');
      expect(result.result.success).toBe(false);
      expect(result.result.error).toContain('Unknown tool');
    });

    it('should track execution time', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'unknown_tool',
        input: {},
      };

      const result = await executor.execute(toolCall);

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('executeAll', () => {
    it('should execute multiple tools in sequence', async () => {
      const toolCalls: ToolCall[] = [
        { id: 'call-1', name: 'unknown_tool_1', input: {} },
        { id: 'call-2', name: 'unknown_tool_2', input: {} },
      ];

      const results = await executor.executeAll(toolCalls);

      expect(results).toHaveLength(2);
      expect(results[0].toolCallId).toBe('call-1');
      expect(results[1].toolCallId).toBe('call-2');
    });
  });
});
