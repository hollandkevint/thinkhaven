/**
 * Tool Registry Tests
 *
 * Tests the tool definitions and registry functions
 */

import { describe, it, expect } from 'vitest';
import {
  MARY_TOOLS,
  TOOL_NAMES,
  getToolByName,
  getAllToolNames,
  getToolDescriptions,
} from '@/lib/ai/tools/index';

describe('Tool Registry', () => {
  describe('MARY_TOOLS', () => {
    it('should define all 8 tools', () => {
      expect(MARY_TOOLS).toHaveLength(8);
    });

    it('should have valid tool structure', () => {
      for (const tool of MARY_TOOLS) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('input_schema');
        expect(tool.input_schema).toHaveProperty('type', 'object');
        expect(tool.input_schema).toHaveProperty('properties');
        expect(tool.input_schema).toHaveProperty('required');
        expect(Array.isArray(tool.input_schema.required)).toBe(true);
      }
    });

    it('should have unique tool names', () => {
      const names = MARY_TOOLS.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('TOOL_NAMES', () => {
    it('should define all tool name constants', () => {
      expect(TOOL_NAMES.READ_SESSION_STATE).toBe('read_session_state');
      expect(TOOL_NAMES.COMPLETE_PHASE).toBe('complete_phase');
      expect(TOOL_NAMES.SWITCH_PERSONA_MODE).toBe('switch_persona_mode');
      expect(TOOL_NAMES.RECOMMEND_ACTION).toBe('recommend_action');
      expect(TOOL_NAMES.GENERATE_DOCUMENT).toBe('generate_document');
      expect(TOOL_NAMES.UPDATE_SESSION_CONTEXT).toBe('update_session_context');
    });

    it('should match actual tool names', () => {
      const toolNames = MARY_TOOLS.map(t => t.name);
      const constantNames = Object.values(TOOL_NAMES);

      for (const name of constantNames) {
        expect(toolNames).toContain(name);
      }
    });
  });

  describe('getToolByName', () => {
    it('should return tool when found', () => {
      const tool = getToolByName('read_session_state');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('read_session_state');
    });

    it('should return undefined for unknown tool', () => {
      const tool = getToolByName('non_existent_tool');
      expect(tool).toBeUndefined();
    });
  });

  describe('getAllToolNames', () => {
    it('should return all tool names', () => {
      const names = getAllToolNames();
      expect(names).toHaveLength(8);
      expect(names).toContain('read_session_state');
      expect(names).toContain('complete_phase');
      expect(names).toContain('switch_persona_mode');
      expect(names).toContain('recommend_action');
      expect(names).toContain('generate_document');
      expect(names).toContain('update_session_context');
    });
  });

  describe('getToolDescriptions', () => {
    it('should return descriptions for all tools', () => {
      const descriptions = getToolDescriptions();
      const keys = Object.keys(descriptions);
      expect(keys).toHaveLength(8);

      for (const name of getAllToolNames()) {
        expect(descriptions[name]).toBeDefined();
        expect(typeof descriptions[name]).toBe('string');
        expect(descriptions[name].length).toBeGreaterThan(10);
      }
    });
  });
});

describe('Individual Tool Schemas', () => {
  describe('read_session_state', () => {
    it('should have no required inputs', () => {
      const tool = getToolByName('read_session_state');
      expect(tool?.input_schema.required).toEqual([]);
    });
  });

  describe('complete_phase', () => {
    it('should require reason', () => {
      const tool = getToolByName('complete_phase');
      expect(tool?.input_schema.required).toContain('reason');
    });

    it('should have optional key_outcomes array', () => {
      const tool = getToolByName('complete_phase');
      const props = tool?.input_schema.properties as Record<string, unknown>;
      expect(props.key_outcomes).toEqual({
        type: 'array',
        items: { type: 'string' },
        description: expect.any(String),
      });
    });
  });

  describe('switch_persona_mode', () => {
    it('should require new_mode and reason', () => {
      const tool = getToolByName('switch_persona_mode');
      expect(tool?.input_schema.required).toContain('new_mode');
      expect(tool?.input_schema.required).toContain('reason');
    });

    it('should have valid mode enum', () => {
      const tool = getToolByName('switch_persona_mode');
      const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
      expect(props.new_mode?.enum).toEqual([
        'inquisitive',
        'devil_advocate',
        'encouraging',
        'realistic',
      ]);
    });
  });

  describe('recommend_action', () => {
    it('should require concerns and strengths', () => {
      const tool = getToolByName('recommend_action');
      expect(tool?.input_schema.required).toContain('concerns');
      expect(tool?.input_schema.required).toContain('strengths');
    });
  });

  describe('generate_document', () => {
    it('should require document_type', () => {
      const tool = getToolByName('generate_document');
      expect(tool?.input_schema.required).toContain('document_type');
    });

    it('should have valid document type enum', () => {
      const tool = getToolByName('generate_document');
      const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
      expect(props.document_type?.enum).toEqual([
        'lean_canvas',
        'business_model_canvas',
        'prd',
        'feature_brief',
        'concept_document',
      ]);
    });
  });

  describe('update_session_context', () => {
    it('should require insight', () => {
      const tool = getToolByName('update_session_context');
      expect(tool?.input_schema.required).toContain('insight');
    });

    it('should have valid category enum', () => {
      const tool = getToolByName('update_session_context');
      const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
      expect(props.category?.enum).toEqual([
        'market',
        'product',
        'competition',
        'risk',
        'opportunity',
        'general',
      ]);
    });
  });
});
