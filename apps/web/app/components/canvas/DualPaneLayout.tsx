'use client';

/**
 * Dual-Pane Layout Component
 * Responsive split-screen layout with resizable divider
 * Left pane: Chat/AI coaching interface
 * Right pane: Visual canvas workspace
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface DualPaneLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  defaultSplitPercentage?: number; // 0-100, default 50
  minLeftPaneWidth?: number; // pixels
  minRightPaneWidth?: number; // pixels
  onSplitChange?: (percentage: number) => void;
  showMobileToggle?: boolean;
}

export const DualPaneLayout: React.FC<DualPaneLayoutProps> = ({
  leftPane,
  rightPane,
  defaultSplitPercentage = 50,
  minLeftPaneWidth = 300,
  minRightPaneWidth = 400,
  onSplitChange,
  showMobileToggle = true
}) => {
  const [splitPercentage, setSplitPercentage] = useState(defaultSplitPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileActivePane, setMobileActivePane] = useState<'left' | 'right'>('left');

  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      const isMobile = window.innerWidth < 768; // Tailwind 'md' breakpoint
      setIsMobileView(isMobile);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Load saved split percentage from localStorage
  useEffect(() => {
    const savedSplit = localStorage.getItem('dualPaneSplit');
    if (savedSplit) {
      const percentage = parseInt(savedSplit, 10);
      if (percentage >= 20 && percentage <= 80) {
        setSplitPercentage(percentage);
      }
    }
  }, []);

  // Save split percentage changes
  useEffect(() => {
    localStorage.setItem('dualPaneSplit', splitPercentage.toString());
    onSplitChange?.(splitPercentage);
  }, [splitPercentage, onSplitChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    // Calculate new percentage
    let newPercentage = (mouseX / containerWidth) * 100;

    // Apply minimum width constraints
    const minLeftPercentage = (minLeftPaneWidth / containerWidth) * 100;
    const minRightPercentage = (minRightPaneWidth / containerWidth) * 100;
    const maxLeftPercentage = 100 - minRightPercentage;

    newPercentage = Math.max(minLeftPercentage, Math.min(maxLeftPercentage, newPercentage));

    setSplitPercentage(newPercentage);
  }, [isDragging, minLeftPaneWidth, minRightPaneWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const touchX = touch.clientX - containerRect.left;

    let newPercentage = (touchX / containerWidth) * 100;

    const minLeftPercentage = (minLeftPaneWidth / containerWidth) * 100;
    const minRightPercentage = (minRightPaneWidth / containerWidth) * 100;
    const maxLeftPercentage = 100 - minRightPercentage;

    newPercentage = Math.max(minLeftPercentage, Math.min(maxLeftPercentage, newPercentage));

    setSplitPercentage(newPercentage);
  }, [isDragging, minLeftPaneWidth, minRightPaneWidth]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global mouse/touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Reset to 50/50 split
  const handleResetSplit = useCallback(() => {
    setSplitPercentage(50);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C: Toggle canvas pane
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        if (isMobileView) {
          setMobileActivePane(prev => prev === 'left' ? 'right' : 'left');
        }
      }
      // Ctrl/Cmd + Shift + R: Reset split
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        handleResetSplit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMobileView, handleResetSplit]);

  // Mobile view: stacked panes with tabs
  if (isMobileView) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Mobile tab switcher */}
        {showMobileToggle && (
          <div className="flex border-b border-ink/8 bg-white">
            <button
              onClick={() => setMobileActivePane('left')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                mobileActivePane === 'left'
                  ? 'text-terracotta border-b-2 border-terracotta'
                  : 'text-ink-light hover:text-ink'
              }`}
            >
              💬 Conversation
            </button>
            <button
              onClick={() => setMobileActivePane('right')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                mobileActivePane === 'right'
                  ? 'text-terracotta border-b-2 border-terracotta'
                  : 'text-ink-light hover:text-ink'
              }`}
            >
              🎨 Canvas
            </button>
          </div>
        )}

        {/* Mobile pane content */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`h-full ${mobileActivePane === 'left' ? 'block' : 'hidden'}`}
          >
            {leftPane}
          </div>
          <div
            className={`h-full ${mobileActivePane === 'right' ? 'block' : 'hidden'}`}
          >
            {rightPane}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view: side-by-side with resizable divider
  return (
    <div
      ref={containerRef}
      className="flex h-full w-full relative select-none"
      style={{ cursor: isDragging ? 'col-resize' : 'default' }}
    >
      {/* Left Pane */}
      <div
        className="overflow-auto border-r border-ink/8"
        style={{ width: `${splitPercentage}%` }}
      >
        {leftPane}
      </div>

      {/* Resizable Divider */}
      <div
        ref={dividerRef}
        className="relative w-1 bg-ink/10 hover:bg-terracotta transition-colors cursor-col-resize flex items-center justify-center group"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={splitPercentage}
        aria-valuemin={20}
        aria-valuemax={80}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setSplitPercentage(Math.max(20, splitPercentage - 5));
          } else if (e.key === 'ArrowRight') {
            setSplitPercentage(Math.min(80, splitPercentage + 5));
          }
        }}
      >
        {/* Divider handle */}
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="w-1 h-12 bg-slate-blue/60 group-hover:bg-terracotta rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Reset button (appears on hover) */}
        <button
          onClick={handleResetSplit}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     bg-white border border-ink/8 rounded px-2 py-1 text-xs
                     opacity-0 group-hover:opacity-100 transition-opacity shadow-sm
                     hover:bg-parchment z-10"
          title="Reset to 50/50 split (Ctrl+Shift+R)"
        >
          ⟷
        </button>
      </div>

      {/* Right Pane */}
      <div
        className="overflow-auto"
        style={{ width: `${100 - splitPercentage}%` }}
      >
        {rightPane}
      </div>
    </div>
  );
};

export default DualPaneLayout;
