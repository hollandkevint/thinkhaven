import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SignupPromptModal from '@/app/components/guest/SignupPromptModal';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/guest/session-migration', () => ({
  SessionMigration: {
    generateSessionSummary: vi.fn(() => 'Summary'),
  },
}));

describe('SignupPromptModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('preserves beta invite context when sending guests to signup', () => {
    window.sessionStorage.setItem(
      'thinkhaven_beta_invite',
      JSON.stringify({
        inviteId: 'beta-row-1',
        source: 'beta_invite',
        fromGuest: false,
      })
    );

    render(<SignupPromptModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /sign up to continue/i }));

    expect(push).toHaveBeenCalledWith(
      '/signup?beta_invite=beta-row-1&source=beta_invite&from=guest'
    );
  });

  it('preserves beta invite context on the sign-in link', () => {
    window.sessionStorage.setItem(
      'thinkhaven_beta_invite',
      JSON.stringify({
        inviteId: 'beta-row-2',
        source: 'beta_invite',
        fromGuest: false,
      })
    );

    render(<SignupPromptModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login?beta_invite=beta-row-2&source=beta_invite'
    );
  });
});
