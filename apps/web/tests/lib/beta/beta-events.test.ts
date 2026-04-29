import { describe, expect, it } from 'vitest';
import {
  assertBetaEventType,
  isBetaEventType,
  sanitizeBetaEventMetadata,
} from '@/lib/beta/beta-events';

describe('beta event helpers', () => {
  it('recognizes supported durable beta event types', () => {
    expect(isBetaEventType('waitlist_joined')).toBe(true);
    expect(isBetaEventType('beta_approved')).toBe(true);
    expect(isBetaEventType('first_app_access')).toBe(true);
    expect(isBetaEventType('raw_email_logged')).toBe(false);
  });

  it('throws for unsupported event types', () => {
    expect(() => assertBetaEventType('beta_approved')).not.toThrow();
    expect(() => assertBetaEventType('unsupported')).toThrow(
      'Unsupported beta event type: unsupported'
    );
  });

  it('keeps metadata scalar and strips sensitive or nested values', () => {
    expect(
      sanitizeBetaEventMetadata({
        source: 'try',
        inviteCount: 2,
        copied: true,
        empty: null,
        email: 'person@example.com',
        accessToken: 'secret',
        nested: { unsafe: true },
        list: ['unsafe'],
      })
    ).toEqual({
      source: 'try',
      inviteCount: 2,
      copied: true,
      empty: null,
    });
  });
});
