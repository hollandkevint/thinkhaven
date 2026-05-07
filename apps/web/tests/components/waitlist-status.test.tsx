import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitlistStatusPanel from '@/app/components/waitlist/WaitlistStatusPanel';

describe('WaitlistStatusPanel', () => {
  it('renders pending signed-in beta recovery details', () => {
    render(
      <WaitlistStatusPanel
        status="pending"
        email="pending@example.com"
        joinedAt="2026-05-07T12:00:00.000Z"
        source="try"
        migratedMessages={4}
      />
    );

    expect(screen.getByRole('heading', { name: /beta request is pending/i })).toBeInTheDocument();
    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(screen.getByText(/4 messages saved/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh sign-in/i })).toHaveAttribute('href', '/login');
  });

  it('renders invite-aware unauthenticated recovery', () => {
    render(<WaitlistStatusPanel status="guest" fromInvite />);

    expect(screen.getByText(/invite link opened/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sign in or join/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^sign up/i })).toHaveAttribute('href', '/signup');
  });

  it('renders revoked access without admin-only details', () => {
    render(
      <WaitlistStatusPanel
        status="revoked"
        email="revoked@example.com"
        joinedAt="2026-05-07T12:00:00.000Z"
      />
    );

    expect(screen.getByText(/access paused/i)).toBeInTheDocument();
    expect(screen.getByText(/not currently approved/i)).toBeInTheDocument();
    expect(screen.queryByText(/revoked_by/i)).not.toBeInTheDocument();
  });
});
