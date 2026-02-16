import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PriorityScoring from '@/app/components/bmad/pathways/PriorityScoring';
import { PriorityScoring as PriorityScoringType } from '@/lib/bmad/types';

describe('PriorityScoring Component', () => {
  it('should render priority scoring interface', () => {
    render(<PriorityScoring />);

    expect(screen.getByText('Priority Scoring')).toBeInTheDocument();
    expect(screen.getByText('Development Effort')).toBeInTheDocument();
    expect(screen.getByText('User & Business Impact')).toBeInTheDocument();
    expect(screen.getByText('Rate your feature on effort and impact')).toBeInTheDocument();
  });

  it('should initialize with default scores of 5', () => {
    render(<PriorityScoring />);

    const effortSlider = screen.getByDisplayValue('5');
    const impactSlider = screen.getAllByDisplayValue('5')[1]; // Second slider for impact

    expect(effortSlider).toBeInTheDocument();
    expect(impactSlider).toBeInTheDocument();
  });

  it('should calculate and display priority results', async () => {
    render(<PriorityScoring />);

    // Initial calculation should show results
    await waitFor(() => {
      expect(screen.getByText('Priority Assessment Results')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Priority score (5/5 = 1)
      expect(screen.getByText('Medium')).toBeInTheDocument(); // Priority category
      expect(screen.getByText('Time Wasters')).toBeInTheDocument(); // Quadrant
    });
  });

  it('should update priority calculation when sliders change', async () => {
    render(<PriorityScoring />);

    const effortSlider = screen.getByDisplayValue('5');

    // Change effort to 2 (keeping impact at 5, so priority becomes 2.5)
    fireEvent.change(effortSlider, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText('2.5')).toBeInTheDocument(); // New priority score
      expect(screen.getByText('Critical')).toBeInTheDocument(); // New priority category
      expect(screen.getByText('Fill-ins')).toBeInTheDocument(); // New quadrant
    });
  });

  it('should display appropriate recommendations based on quadrant', async () => {
    render(<PriorityScoring />);

    const impactSlider = screen.getAllByDisplayValue('5')[1];
    const effortSlider = screen.getByDisplayValue('5');

    // Set high impact (8) and low effort (3) for Quick Wins
    fireEvent.change(impactSlider, { target: { value: '8' } });
    fireEvent.change(effortSlider, { target: { value: '3' } });

    await waitFor(() => {
      expect(screen.getByText('Quick Wins')).toBeInTheDocument();
      expect(screen.getByText(/High priority! This feature offers maximum value/)).toBeInTheDocument();
    });
  });

  it('should call onScoreChange callback when scores update', async () => {
    const mockCallback = vi.fn();
    render(<PriorityScoring onScoreChange={mockCallback} />);

    const effortSlider = screen.getByDisplayValue('5');

    // Change effort score
    fireEvent.change(effortSlider, { target: { value: '3' } });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
      const lastCall = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0] as PriorityScoringType;
      expect(lastCall.effort_score).toBe(3);
      expect(lastCall.impact_score).toBe(5);
      expect(lastCall.calculated_priority).toBe(1.67);
    });
  });

  it('should show progress indicator', () => {
    render(<PriorityScoring />);

    expect(screen.getByText('Step 2 of 4 - Priority Scoring')).toBeInTheDocument();
    expect(screen.getByText('Time remaining: ~4 minutes')).toBeInTheDocument();
  });

  it('should display priority matrix when results are available', async () => {
    render(<PriorityScoring />);

    await waitFor(() => {
      expect(screen.getByText('Priority Matrix')).toBeInTheDocument();
      expect(screen.getByText('Visual representation of your feature\'s position')).toBeInTheDocument();
    });
  });

  it('should apply correct color coding for priority categories', async () => {
    render(<PriorityScoring />);

    const impactSlider = screen.getAllByDisplayValue('5')[1];
    const effortSlider = screen.getByDisplayValue('5');

    // Test Critical priority (high ratio)
    fireEvent.change(impactSlider, { target: { value: '10' } });
    fireEvent.change(effortSlider, { target: { value: '2' } });

    await waitFor(() => {
      const criticalElement = screen.getByText('Critical');
      expect(criticalElement.className).toContain('text-rust');
      expect(criticalElement.className).toContain('bg-rust/5');
    });
  });

  it('should apply correct color coding for quadrants', async () => {
    render(<PriorityScoring />);

    const impactSlider = screen.getAllByDisplayValue('5')[1];
    const effortSlider = screen.getByDisplayValue('5');

    // Test Quick Wins quadrant
    fireEvent.change(impactSlider, { target: { value: '8' } });
    fireEvent.change(effortSlider, { target: { value: '3' } });

    await waitFor(() => {
      const quickWinsElement = screen.getByText('Quick Wins');
      expect(quickWinsElement.className).toContain('text-forest');
      expect(quickWinsElement.className).toContain('bg-forest/5');
    });
  });

  it('should handle edge case calculations correctly', async () => {
    render(<PriorityScoring />);

    const impactSlider = screen.getAllByDisplayValue('5')[1];
    const effortSlider = screen.getByDisplayValue('5');

    // Test boundary conditions
    fireEvent.change(impactSlider, { target: { value: '7' } });
    fireEvent.change(effortSlider, { target: { value: '4' } });

    await waitFor(() => {
      expect(screen.getByText('1.75')).toBeInTheDocument(); // 7/4 = 1.75
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Quick Wins')).toBeInTheDocument();
    });
  });
});