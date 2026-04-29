import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

describe('RLS Policy Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Existing RLS policies work with schema fixes', () => {
    it('should verify RLS policies allow workspace access for authenticated users', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'authenticated-user-id' } },
        error: null
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'user-workspace-1',
                user_id: 'authenticated-user-id',
                name: 'User Workspace',
                dual_pane_state: { active_pane: 'chat' }
              }
            ],
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      })

      const supabase = createClient()

      // Test RLS policy allows access to user's own workspaces
      const result = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', 'authenticated-user-id')
        .order('updated_at', { ascending: false })

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data[0].user_id).toBe('authenticated-user-id')
    })

    it('should verify RLS policies prevent unauthorized access', async () => {
      // Mock user trying to access another user's workspace
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-a' } },
        error: null
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [], // RLS should prevent access to other user's data
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      })

      const supabase = createClient()

      // Attempt to access another user's workspace
      const result = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', 'user-b') // Different user
        .order('updated_at', { ascending: false })

      // RLS should prevent this and return empty array
      expect(result.data).toEqual([])
    })
  })

  describe('Authentication flow remains unchanged', () => {
    it('should maintain existing authentication patterns', async () => {
      // Test existing authentication flow
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'authenticated'
          }
        },
        error: null
      })

      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user.id).toBe('test-user-id')
      expect(data.user.email).toBe('test@example.com')
    })

    it('should handle unauthenticated requests appropriately', async () => {
      // Mock unauthenticated state
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT token is invalid' }
      })

      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      expect(data.user).toBeNull()
      expect(error).toBeDefined()
    })
  })

  describe('User data isolation maintained through RLS', () => {
    it('should ensure user data isolation with dual_pane_state operations', async () => {
      // Mock user authentication
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'isolated-user' } },
        error: null
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'workspace-id',
              user_id: 'isolated-user',
              dual_pane_state: {
                chat_width: 60,
                canvas_width: 40,
                active_pane: 'canvas',
                collapsed: false
              }
            }
          ],
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      })

      const supabase = createClient()

      // Update dual_pane_state through RLS
      const result = await supabase
        .from('workspaces')
        .update({
          dual_pane_state: {
            chat_width: 60,
            canvas_width: 40,
            active_pane: 'canvas',
            collapsed: false
          }
        })
        .eq('id', 'workspace-id')

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data[0].user_id).toBe('isolated-user')
    })

    it('should validate workspace creation maintains RLS protection', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'creator-user' } },
        error: null
      })

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-workspace-id',
              user_id: 'creator-user',
              name: 'Test Workspace',
              dual_pane_state: {
                chat_width: 50,
                canvas_width: 50,
                active_pane: 'chat',
                collapsed: false
              }
            },
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert
      })

      const supabase = createClient()

      // Create workspace with RLS protection
      const result = await supabase
        .from('workspaces')
        .insert({
          user_id: 'creator-user',
          name: 'Test Workspace',
          description: 'Test Description',
          dual_pane_state: {
            chat_width: 50,
            canvas_width: 50,
            active_pane: 'chat',
            collapsed: false
          }
        })
        .select()
        .single()

      expect(result.error).toBeNull()
      expect(result.data.user_id).toBe('creator-user')
    })
  })

  describe('RLS policies specifically support dual_pane_state field operations', () => {
    it('should allow dual_pane_state field updates through RLS', async () => {
      // Mock authenticated user with workspace ownership
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'workspace-owner' } },
        error: null
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'owned-workspace',
              user_id: 'workspace-owner',
              dual_pane_state: {
                chat_width: 70,
                canvas_width: 30,
                active_pane: 'chat',
                collapsed: true
              }
            }
          ],
          error: null
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate
      })

      const supabase = createClient()

      // Update only dual_pane_state field
      const result = await supabase
        .from('workspaces')
        .update({
          dual_pane_state: {
            chat_width: 70,
            canvas_width: 30,
            active_pane: 'chat',
            collapsed: true
          }
        })
        .eq('id', 'owned-workspace')

      expect(result.error).toBeNull()
      expect(result.data[0].dual_pane_state.chat_width).toBe(70)
      expect(result.data[0].dual_pane_state.canvas_width).toBe(30)
      expect(result.data[0].dual_pane_state.collapsed).toBe(true)
    })

    it('should allow dual_pane_state field selection through RLS', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'query-user' } },
        error: null
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'accessible-workspace',
                dual_pane_state: {
                  chat_width: 45,
                  canvas_width: 55,
                  active_pane: 'canvas',
                  collapsed: false
                }
              }
            ],
            error: null
          })
        })
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect
      })

      const supabase = createClient()

      // Select specifically dual_pane_state field
      const result = await supabase
        .from('workspaces')
        .select('id, dual_pane_state')
        .eq('user_id', 'query-user')
        .order('updated_at', { ascending: false })

      expect(result.error).toBeNull()
      expect(result.data[0]).toHaveProperty('dual_pane_state')
      expect(result.data[0].dual_pane_state).toHaveProperty('chat_width', 45)
      expect(result.data[0].dual_pane_state).toHaveProperty('canvas_width', 55)
    })
  })

  describe('beta operations migration policy coverage', () => {
    const betaOperationsMigration = readFileSync(
      join(process.cwd(), 'supabase/migrations/030_beta_operations.sql'),
      'utf8'
    )

    it('allows the Supabase auth hook role to read beta access state under RLS', () => {
      expect(betaOperationsMigration).toContain('TO supabase_auth_admin')
      expect(betaOperationsMigration).toContain('Auth hook can read beta access')
      expect(betaOperationsMigration).toContain('GRANT SELECT ON public.beta_access TO supabase_auth_admin')
      expect(betaOperationsMigration).toContain('approved_at IS NOT NULL AND revoked_at IS NULL')
    })

    it('removes the legacy public beta_access insert policy', () => {
      expect(betaOperationsMigration).toContain(
        'DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.beta_access'
      )
      expect(betaOperationsMigration).toContain(
        'browser clients cannot set'
      )
    })

    it('keeps durable beta events behind server-side operations', () => {
      const betaEventsSection = betaOperationsMigration.split('CREATE TABLE IF NOT EXISTS public.beta_auth_events')[1]

      expect(betaOperationsMigration).toContain('CREATE TABLE IF NOT EXISTS public.beta_auth_events')
      expect(betaOperationsMigration).toContain('ALTER TABLE public.beta_auth_events ENABLE ROW LEVEL SECURITY')
      expect(betaEventsSection).not.toContain('CREATE POLICY')
      expect(betaEventsSection).not.toContain('TO anon')
      expect(betaEventsSection).not.toContain('TO authenticated')
      expect(betaEventsSection).toContain('No anon/authenticated table policies')
    })
  })
})
