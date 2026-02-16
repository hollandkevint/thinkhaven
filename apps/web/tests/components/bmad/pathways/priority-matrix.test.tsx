import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriorityMatrix from '@/app/components/bmad/pathways/PriorityMatrix';
import { PriorityScoring } from '@/lib/bmad/types';

const mockQuickWinsScoring: PriorityScoring = {
  effort_score: 3,
  impact_score: 8,
  calculated_priority: 2.67,
  priority_category: 'Critical',
  quadrant: 'Quick Wins',
  scoring_timestamp: new Date()
};

const mockTimeWastersScoring: PriorityScoring = {
  effort_score: 8,
  impact_score: 3,
  calculated_priority: 0.38,
  priority_category: 'Low',
  quadrant: 'Time Wasters',
  scoring_timestamp: new Date()
};

const mockMajorProjectsScoring: PriorityScoring = {
  effort_score: 7,
  impact_score: 9,
  calculated_priority: 1.29,
  priority_category: 'High',
  quadrant: 'Major Projects',
  scoring_timestamp: new Date()
};

const mockFillInsScoring: PriorityScoring = {
  effort_score: 3,
  impact_score: 4,
  calculated_priority: 1.33,
  priority_category: 'Medium',
  quadrant: 'Fill-ins',
  scoring_timestamp: new Date()
};

describe('PriorityMatrix Component', () => {
  it('should render matrix without priority scoring', () => {
    render(<PriorityMatrix />);

    expect(screen.getByText('Priority Matrix')).toBeInTheDocument();
    expect(screen.getByText('Visual representation of your feature\'s position')).toBeInTheDocument();

    // All quadrants should be visible
    expect(screen.getByText('Quick Wins')).toBeInTheDocument();
    expect(screen.getByText('Major Projects')).toBeInTheDocument();
    expect(screen.getByText('Fill-ins')).toBeInTheDocument();
    expect(screen.getByText('Time Wasters')).toBeInTheDocument();
  });

  it('should display quadrant labels and descriptions correctly', () => {
    render(<PriorityMatrix />);

    // Quick Wins quadrant
    expect(screen.getByText('Quick Wins')).toBeInTheDocument();
    expect(screen.getByText('High Impact, Low Effort')).toBeInTheDocument();
    expect(screen.getByText('🎯 Do First')).toBeInTheDocument();

    // Major Projects quadrant
    expect(screen.getByText('Major Projects')).toBeInTheDocument();
    expect(screen.getByText('High Impact, High Effort')).toBeInTheDocument();
    expect(screen.getByText('📋 Plan Well')).toBeInTheDocument();

    // Fill-ins quadrant
    expect(screen.getByText('Fill-ins')).toBeInTheDocument();
    expect(screen.getByText('Low Impact, Low Effort')).toBeInTheDocument();
    expect(screen.getByText('⏰ Nice-to-have')).toBeInTheDocument();

    // Time Wasters quadrant
    expect(screen.getByText('Time Wasters')).toBeInTheDocument();
    expect(screen.getByText('Low Impact, High Effort')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Avoid')).toBeInTheDocument();
  });

  it('should display axis labels', () => {
    render(<PriorityMatrix />);

    expect(screen.getByText('Low Effort')).toBeInTheDocument();
    expect(screen.getByText('High Effort')).toBeInTheDocument();
    expect(screen.getByText('Low Impact')).toBeInTheDocument();
    expect(screen.getByText('High Impact')).toBeInTheDocument();
  });

  it('should show feature position summary when priority scoring is provided', () => {
    render(<PriorityMatrix priorityScoring={mockQuickWinsScoring} />);

    expect(screen.getByText('Your Feature Position')).toBeInTheDocument();
    expect(screen.getByText('Impact: 8/10 • Effort: 3/10')).toBeInTheDocument();
    expect(screen.getByText('Quick Wins')).toBeInTheDocument();
  });

  it('should apply correct styling for Quick Wins quadrant', () => {
    render(<PriorityMatrix priorityScoring={mockQuickWinsScoring} />);

    const quadrantBadge = screen.getAllByText('Quick Wins').find(el =>
      el.className.includes('px-3')
    );

    expect(quadrantBadge?.className).toContain('bg-forest/5');
    expect(quadrantBadge?.className).toContain('border-forest/20');
    expect(quadrantBadge?.className).toContain('text-forest');
  });

  it('should apply correct styling for Time Wasters quadrant', () => {
    render(<PriorityMatrix priorityScoring={mockTimeWastersScoring} />);

    const quadrantBadge = screen.getAllByText('Time Wasters').find(el =>
      el.className.includes('px-3')
    );

    expect(quadrantBadge?.className).toContain('bg-rust/5');
    expect(quadrantBadge?.className).toContain('border-rust/20');
    expect(quadrantBadge?.className).toContain('text-rust');
  });

  it('should apply correct styling for Major Projects quadrant', () => {
    render(<PriorityMatrix priorityScoring={mockMajorProjectsScoring} />);

    const quadrantBadge = screen.getAllByText('Major Projects').find(el =>
      el.className.includes('px-3')
    );

    expect(quadrantBadge?.className).toContain('bg-terracotta/5');
    expect(quadrantBadge?.className).toContain('border-terracotta/20');
    expect(quadrantBadge?.className).toContain('text-ink');
  });

  it('should apply correct styling for Fill-ins quadrant', () => {
    render(<PriorityMatrix priorityScoring={mockFillInsScoring} />);

    const quadrantBadge = screen.getAllByText('Fill-ins').find(el =>
      el.className.includes('px-3')
    );

    expect(quadrantBadge?.className).toContain('bg-mustard/5');
    expect(quadrantBadge?.className).toContain('border-mustard/20');
    expect(quadrantBadge?.className).toContain('text-mustard');
  });

  it('should handle feature positioning in different quadrants', () => {
    const { rerender } = render(<PriorityMatrix priorityScoring={mockQuickWinsScoring} />);

    // Test Quick Wins positioning (should be in top-right area)
    expect(screen.getByText('Impact: 8/10 • Effort: 3/10')).toBeInTheDocument();

    // Test Time Wasters positioning
    rerender(<PriorityMatrix priorityScoring={mockTimeWastersScoring} />);
    expect(screen.getByText('Impact: 3/10 • Effort: 8/10')).toBeInTheDocument();

    // Test Major Projects positioning
    rerender(<PriorityMatrix priorityScoring={mockMajorProjectsScoring} />);
    expect(screen.getByText('Impact: 9/10 • Effort: 7/10')).toBeInTheDocument();

    // Test Fill-ins positioning
    rerender(<PriorityMatrix priorityScoring={mockFillInsScoring} />);
    expect(screen.getByText('Impact: 4/10 • Effort: 3/10')).toBeInTheDocument();
  });

  it('should not show feature position summary without priority scoring', () => {
    render(<PriorityMatrix />);

    expect(screen.queryByText('Your Feature Position')).not.toBeInTheDocument();
    expect(screen.queryByText(/Impact:.*Effort:/)).not.toBeInTheDocument();
  });

  it('should handle matrix grid layout correctly', () => {
    render(<PriorityMatrix />);

    // Check that matrix container exists
    const matrixGrid = document.querySelector('.grid-cols-2');
    expect(matrixGrid).toBeInTheDocument();

    // Check that all quadrant containers exist
    const quadrantContainers = document.querySelectorAll('.grid-cols-2 > div');
    expect(quadrantContainers).toHaveLength(4);
  });

  it('should calculate dot position correctly for extreme values', () => {
    const extremeScoring: PriorityScoring = {
      effort_score: 1, // Minimum effort
      impact_score: 10, // Maximum impact
      calculated_priority: 10,
      priority_category: 'Critical',
      quadrant: 'Quick Wins',
      scoring_timestamp: new Date()
    };

    render(<PriorityMatrix priorityScoring={extremeScoring} />);

    // Should show extreme values
    expect(screen.getByText('Impact: 10/10 • Effort: 1/10')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<PriorityMatrix priorityScoring={mockQuickWinsScoring} />);

    // The positioning dot should have a title attribute for accessibility
    const positioningElement = document.querySelector('[title*="Your Feature"]');
    expect(positioningElement).toBeInTheDocument();
    expect(positioningElement?.getAttribute('title')).toContain('Quick Wins');
    expect(positioningElement?.getAttribute('title')).toContain('Impact: 8');
    expect(positioningElement?.getAttribute('title')).toContain('Effort: 3');
  });
});