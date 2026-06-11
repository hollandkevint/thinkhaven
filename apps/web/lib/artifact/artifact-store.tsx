'use client';

/**
 * Artifact Store for ThinkHaven
 *
 * React Context-based state management for artifacts.
 * Provides session-scoped artifact storage with CRUD operations.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

import {
  type Artifact,
  type ArtifactViewMode,
  type ArtifactRenderMode,
} from './artifact-types';

// State shape
interface ArtifactState {
  artifacts: Record<string, Artifact>;
  sessionId: string | null;
  // Panel state
  selectedArtifactId: string | null;
  isPanelOpen: boolean;
}

// Action types
type ArtifactAction =
  | { type: 'SET_SESSION'; sessionId: string }
  | { type: 'ADD_ARTIFACT'; artifact: Artifact }
  | { type: 'UPDATE_ARTIFACT'; id: string; updates: Partial<Artifact> }
  | { type: 'REMOVE_ARTIFACT'; id: string }
  | { type: 'SET_VIEW_MODE'; id: string; viewMode: ArtifactViewMode }
  | { type: 'SET_RENDER_MODE'; id: string; renderMode: ArtifactRenderMode }
  | { type: 'CLEAR_SESSION' }
  // Panel actions
  | { type: 'SELECT_ARTIFACT'; id: string | null }
  | { type: 'OPEN_PANEL' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'TOGGLE_PANEL' };

// Initial state
const initialState: ArtifactState = {
  artifacts: {},
  sessionId: null,
  selectedArtifactId: null,
  isPanelOpen: false,
};

// Reducer
function artifactReducer(
  state: ArtifactState,
  action: ArtifactAction
): ArtifactState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.sessionId,
        // Clear artifacts when switching sessions
        artifacts: {},
      };

    case 'ADD_ARTIFACT':
      return {
        ...state,
        artifacts: {
          ...state.artifacts,
          [action.artifact.id]: action.artifact,
        },
      };

    case 'UPDATE_ARTIFACT': {
      const existing = state.artifacts[action.id];
      if (!existing) return state;

      return {
        ...state,
        artifacts: {
          ...state.artifacts,
          [action.id]: {
            ...existing,
            ...action.updates,
            updatedAt: new Date(),
          },
        },
      };
    }

    case 'REMOVE_ARTIFACT': {
      const remaining = { ...state.artifacts };
      delete remaining[action.id];
      return {
        ...state,
        artifacts: remaining,
      };
    }

    case 'SET_VIEW_MODE': {
      const artifact = state.artifacts[action.id];
      if (!artifact) return state;

      return {
        ...state,
        artifacts: {
          ...state.artifacts,
          [action.id]: {
            ...artifact,
            viewMode: action.viewMode,
            updatedAt: new Date(),
          },
        },
      };
    }

    case 'SET_RENDER_MODE': {
      const artifact = state.artifacts[action.id];
      if (!artifact) return state;

      return {
        ...state,
        artifacts: {
          ...state.artifacts,
          [action.id]: {
            ...artifact,
            renderMode: action.renderMode,
            updatedAt: new Date(),
          },
        },
      };
    }

    case 'CLEAR_SESSION':
      return initialState;

    // Panel actions
    case 'SELECT_ARTIFACT':
      return {
        ...state,
        selectedArtifactId: action.id,
        // Auto-open panel when selecting an artifact
        isPanelOpen: action.id !== null ? true : state.isPanelOpen,
      };

    case 'OPEN_PANEL':
      return {
        ...state,
        isPanelOpen: true,
      };

    case 'CLOSE_PANEL':
      return {
        ...state,
        isPanelOpen: false,
        selectedArtifactId: null,
      };

    case 'TOGGLE_PANEL':
      return {
        ...state,
        isPanelOpen: !state.isPanelOpen,
        // Clear selection when closing
        selectedArtifactId: state.isPanelOpen ? null : state.selectedArtifactId,
      };

    default:
      return state;
  }
}

// Context value type
interface ArtifactContextValue {
  // State
  artifacts: Artifact[];
  sessionId: string | null;
  selectedArtifactId: string | null;
  isPanelOpen: boolean;
  selectedArtifact: Artifact | undefined;

  // Actions
  setSession: (sessionId: string) => void;
  addArtifact: (artifact: Artifact) => void;
  addArtifacts: (artifacts: Artifact[]) => void;
  updateArtifact: (id: string, updates: Partial<Artifact>) => void;
  removeArtifact: (id: string) => void;
  getArtifact: (id: string) => Artifact | undefined;
  setViewMode: (id: string, viewMode: ArtifactViewMode) => void;
  setRenderMode: (id: string, renderMode: ArtifactRenderMode) => void;
  toggleViewMode: (id: string) => void;
  toggleRenderMode: (id: string) => void;
  clearSession: () => void;
  // Panel actions
  selectArtifact: (id: string | null) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

// Create context
const ArtifactContext = createContext<ArtifactContextValue | null>(null);

// Provider props
interface ArtifactProviderProps {
  children: ReactNode;
  initialSessionId?: string;
}

/**
 * ArtifactProvider component
 *
 * Wraps the application (or a section) to provide artifact state management.
 */
export function ArtifactProvider({
  children,
  initialSessionId,
}: ArtifactProviderProps) {
  const [state, dispatch] = useReducer(artifactReducer, {
    ...initialState,
    sessionId: initialSessionId || null,
  });

  // Convert artifacts record to array
  const artifactsArray = Object.values(state.artifacts);

  // Actions
  const setSession = useCallback((sessionId: string) => {
    dispatch({ type: 'SET_SESSION', sessionId });
  }, []);

  const addArtifact = useCallback((artifact: Artifact) => {
    dispatch({ type: 'ADD_ARTIFACT', artifact });
  }, []);

  const addArtifacts = useCallback((artifacts: Artifact[]) => {
    artifacts.forEach((artifact) => {
      dispatch({ type: 'ADD_ARTIFACT', artifact });
    });
  }, []);

  const updateArtifact = useCallback(
    (id: string, updates: Partial<Artifact>) => {
      dispatch({ type: 'UPDATE_ARTIFACT', id, updates });
    },
    []
  );

  const removeArtifact = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ARTIFACT', id });
  }, []);

  const getArtifact = useCallback(
    (id: string) => state.artifacts[id],
    [state.artifacts]
  );

  const setViewMode = useCallback((id: string, viewMode: ArtifactViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', id, viewMode });
  }, []);

  const setRenderMode = useCallback(
    (id: string, renderMode: ArtifactRenderMode) => {
      dispatch({ type: 'SET_RENDER_MODE', id, renderMode });
    },
    []
  );

  const toggleViewMode = useCallback(
    (id: string) => {
      const artifact = state.artifacts[id];
      if (!artifact) return;

      const modes: ArtifactViewMode[] = ['collapsed', 'inline', 'panel'];
      const currentIndex = modes.indexOf(artifact.viewMode);
      const nextIndex = (currentIndex + 1) % modes.length;

      dispatch({ type: 'SET_VIEW_MODE', id, viewMode: modes[nextIndex] });
    },
    [state.artifacts]
  );

  const toggleRenderMode = useCallback(
    (id: string) => {
      const artifact = state.artifacts[id];
      if (!artifact) return;

      const newMode: ArtifactRenderMode =
        artifact.renderMode === 'raw' ? 'rendered' : 'raw';

      dispatch({ type: 'SET_RENDER_MODE', id, renderMode: newMode });
    },
    [state.artifacts]
  );

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  // Panel actions
  const selectArtifact = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ARTIFACT', id });
  }, []);

  const openPanel = useCallback(() => {
    dispatch({ type: 'OPEN_PANEL' });
  }, []);

  const closePanel = useCallback(() => {
    dispatch({ type: 'CLOSE_PANEL' });
  }, []);

  const togglePanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_PANEL' });
  }, []);

  // Derived state
  const selectedArtifact = state.selectedArtifactId
    ? state.artifacts[state.selectedArtifactId]
    : undefined;

  const value: ArtifactContextValue = {
    artifacts: artifactsArray,
    sessionId: state.sessionId,
    selectedArtifactId: state.selectedArtifactId,
    isPanelOpen: state.isPanelOpen,
    selectedArtifact,
    setSession,
    addArtifact,
    addArtifacts,
    updateArtifact,
    removeArtifact,
    getArtifact,
    setViewMode,
    setRenderMode,
    toggleViewMode,
    toggleRenderMode,
    clearSession,
    selectArtifact,
    openPanel,
    closePanel,
    togglePanel,
  };

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
}

/**
 * useArtifacts hook
 *
 * Access the artifact store from any component within ArtifactProvider.
 *
 * @throws Error if used outside of ArtifactProvider
 */
export function useArtifacts(): ArtifactContextValue {
  const context = useContext(ArtifactContext);

  if (!context) {
    throw new Error('useArtifacts must be used within an ArtifactProvider');
  }

  return context;
}

/**
 * useSafeArtifacts hook
 *
 * Safe version that returns null if outside ArtifactProvider.
 * Use this when you want artifact functionality but can gracefully degrade
 * when the provider isn't available.
 */
export function useSafeArtifacts(): ArtifactContextValue | null {
  return useContext(ArtifactContext);
}
