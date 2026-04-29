import { describe, expect, it } from 'vitest';
import {
  buildAuthCallbackUrl,
  buildBetaInviteUrl,
  buildLoginPath,
  buildPostAuthDestination,
  buildSignupPath,
  isSafeRedirectPath,
  readBetaInviteContext,
  readSafeRedirectPath,
} from '@/lib/beta/invite-destinations';

describe('beta invite destinations', () => {
  it('builds the share-first try URL from a beta record id', () => {
    expect(buildBetaInviteUrl('beta-row-1', 'https://thinkhaven.co/')).toBe(
      'https://thinkhaven.co/try?beta_invite=beta-row-1&source=beta_invite'
    );
  });

  it('parses invite context from URL search params', () => {
    const context = readBetaInviteContext(
      new URLSearchParams('beta_invite=abc123&source=manual&from=guest')
    );

    expect(context).toEqual({
      inviteId: 'abc123',
      source: 'manual',
      fromGuest: true,
    });
  });

  it('preserves invite context across signup and login paths', () => {
    const context = {
      inviteId: 'abc123',
      source: 'beta_invite',
      fromGuest: false,
    };

    expect(buildSignupPath(context)).toBe(
      '/signup?beta_invite=abc123&source=beta_invite&from=guest'
    );
    expect(buildLoginPath(context)).toBe(
      '/login?beta_invite=abc123&source=beta_invite'
    );
  });

  it('routes invite auth callbacks back through try without implying approval', () => {
    const context = {
      inviteId: 'abc123',
      source: 'beta_invite',
      fromGuest: true,
    };

    expect(buildPostAuthDestination(context)).toBe(
      '/try?beta_invite=abc123&source=beta_invite&from=guest'
    );
    expect(buildAuthCallbackUrl('https://thinkhaven.co', context)).toBe(
      'https://thinkhaven.co/auth/callback?next=%2Ftry%3Fbeta_invite%3Dabc123%26source%3Dbeta_invite%26from%3Dguest'
    );
  });

  it('preserves safe non-invite redirects after authentication', () => {
    const params = new URLSearchParams('redirect=/admin/beta');

    expect(readSafeRedirectPath(params)).toBe('/admin/beta');
    expect(buildPostAuthDestination(null, '/admin/beta')).toBe('/admin/beta');
    expect(buildAuthCallbackUrl('https://thinkhaven.co', null, '/admin/beta')).toBe(
      'https://thinkhaven.co/auth/callback?next=%2Fadmin%2Fbeta'
    );
  });

  it('rejects unsafe redirect destinations', () => {
    expect(isSafeRedirectPath('//evil.example')).toBe(false);
    expect(isSafeRedirectPath('/\\evil.example')).toBe(false);
    expect(readSafeRedirectPath(new URLSearchParams('redirect=//evil.example'))).toBeNull();
    expect(buildPostAuthDestination(null, '//evil.example')).toBe('/app');
  });
});
