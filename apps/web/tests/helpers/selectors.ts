/**
 * Centralized Selector Registry
 *
 * ALL E2E test selectors should be defined here.
 * When the UI changes, update selectors here once - all tests will be fixed.
 *
 * Selector Priority (prefer top):
 * 1. data-testid (most stable)
 * 2. role + accessible name
 * 3. text content
 * 4. CSS class (least stable - avoid if possible)
 *
 * @example
 * import { SELECTORS } from '../helpers/selectors';
 * await page.locator(SELECTORS.auth.emailInput).fill('test@example.com');
 */

export const SELECTORS = {
  // ===================
  // LANDING PAGE (/)
  // ===================
  landing: {
    // Hero section
    hero: 'h1:has-text("waste 6 months"), h1:has-text("Transform Strategic")',
    heroSubtitle: 'text=/validate.*idea|strategic.*thinking/i',

    // CTAs
    ctaValidate: 'a[href*="validate"], button:has-text("Validate My Idea")',
    ctaAssessment: 'a[href="/assessment"], button:has-text("Assessment")',
    ctaLogin: 'button:has-text("Email & Password Login")',
    ctaTry: 'a[href="/try"], button:has-text("Try")',

    // Navigation
    nav: 'nav',
    openAppButton: 'a[href="/app"], button:has-text("Open App")',
  },

  // ===================
  // AUTHENTICATION
  // ===================
  auth: {
    // Forms
    emailInput: 'input[type="email"], input[name="email"]',
    passwordInput: 'input[type="password"], input[name="password"]',
    submitButton: 'button[type="submit"]',

    // OAuth
    googleOAuth: 'button:has-text("Continue with Google"), button:has-text("Sign in with Google")',

    // Feedback
    errorMessage: '[role="alert"], .text-red-500, text=/error|invalid|incorrect/i',
    successMessage: '.text-green-500, text=/success|check.*email/i',

    // Links
    forgotPasswordLink: 'a:has-text("Forgot"), a:has-text("Reset")',
    signupLink: 'a[href="/signup"], a:has-text("Sign up")',
    loginLink: 'a[href="/login"], a:has-text("Log in")',

    // Password strength indicator (signup)
    passwordStrength: '.password-strength, [data-password-strength]',
  },

  // ===================
  // DASHBOARD (/app)
  // ===================
  dashboard: {
    // Main layout
    container: '[data-testid="dashboard"], main',
    sidebar: 'aside, nav.sidebar',

    // Welcome section
    welcomeHeading: 'h1:has-text("Welcome")',
    userGreeting: '[data-testid="user-greeting"]',

    // Session management
    newSessionButton: 'button:has-text("New Session"), a[href="/app/new"]',
    sessionCard: '[data-session-id], [data-testid="session-card"]',
    sessionTitle: '[data-testid="session-title"], h3',
    sessionTimestamp: 'text=/updated|ago/i',
    sessionMenu: '[data-testid="session-menu"], button[aria-label*="menu"]',

    // Stats
    statsSection: '[data-testid="stats"], .stats-grid',
    statCard: '[data-testid="stat-card"]',

    // Empty state
    emptyState: 'text=/no sessions|create.*first|get started/i',

    // Navigation
    accountLink: 'a[href="/app/account"], button:has-text("Account")',
    signOutButton: 'button:has-text("Sign Out"), button:has-text("Logout")',
    homeLink: 'a[href="/"], button:has-text("Home")',
  },

  // ===================
  // WORKSPACE (/app/session/[id])
  // ===================
  workspace: {
    // Layout
    container: '[data-testid="workspace"], main',
    chatPane: '[data-testid="chat-pane"], .chat-pane',
    canvasPane: '[data-testid="canvas-pane"], .canvas-pane',

    // Tabs
    chatTab: 'button:has-text("Mary Chat"), [data-testid="chat-tab"]',
    bmadTab: 'button:has-text("BMad Method"), [data-testid="bmad-tab"]',
    tabBadge: '[data-testid="tab-badge"], span.badge',

    // Chat interface
    chatMessages: '[data-testid="chat-messages"], .chat-messages',
    userMessage: '.chat-message-user, [data-role="user"]',
    assistantMessage: '.chat-message-assistant, [data-role="assistant"]',
    welcomeMessage: 'text=/Hello|Welcome|How can I help/i',

    // Chat input
    chatInput: 'textarea[placeholder], [data-testid="chat-input"]',
    sendButton: 'button:has-text("Send"), [data-testid="send-button"]',
    typingIndicator: '.typing-indicator, [data-testid="typing"]',

    // Suggested prompts
    suggestedPrompt: '[data-testid="suggested-prompt"], button.prompt-suggestion',

    // Export
    exportDropdown: 'button:has-text("Export"), [data-testid="export-dropdown"]',
    exportMarkdown: 'button:has-text("Markdown")',
    exportText: 'button:has-text("Text")',
    exportJson: 'button:has-text("JSON")',
    copyButton: 'button:has-text("Copy")',

    // Message limit warning
    messageLimitWarning: '[data-testid="message-limit-warning"], .message-limit-warning',

    // Header
    backButton: 'a[href="/app"], button:has-text("Back")',
    workspaceName: '[data-testid="workspace-name"], h1',
  },

  // ===================
  // GUEST FLOW (/try)
  // ===================
  guest: {
    // Welcome banner
    welcomeBanner: 'text=/10 free messages/i, [data-testid="guest-welcome"]',

    // Message counter
    messageCounter: '[data-testid="message-counter"], .message-counter',
    messagesRemaining: 'text=/remaining/i',

    // Signup prompt
    signupPromptModal: '[role="dialog"]:has-text("Sign Up"), [data-testid="signup-prompt"]',
    signupButton: 'button:has-text("Sign Up"), a[href="/signup"]',

    // Save progress banner
    saveProgressBanner: '[data-testid="save-progress"], .save-progress-banner',
  },

  // ===================
  // ASSESSMENT (/assessment)
  // ===================
  assessment: {
    // Quiz
    title: 'text=/Strategic Thinking Assessment/i',
    questionNumber: 'text=/Question \\d+ of 15/i',
    progressBar: '[role="progressbar"], .progress-bar',

    // Answer options
    answerOption: 'button:has(span.font-medium)',
    selectedOption: '[aria-pressed="true"], .selected',

    // Completion
    completeTitle: 'text=/Assessment Complete/i',
    emailInput: 'input[placeholder*="email"], input[type="email"]',

    // Results
    resultsTitle: 'text=/Your Results/i, h1:has-text("Results")',
    scoreCard: '[data-testid="score-card"], .score-card',
    categoryScore: '[data-testid="category-score"]',
    actionPlan: '[data-testid="action-plan"], .action-plan',
    ctaStartTrial: 'a[href="/"], button:has-text("Start Free Trial")',
    ctaTryFree: 'a[href="/try"], button:has-text("Try It Free")',
  },

  // ===================
  // ACCOUNT (/app/account)
  // ===================
  account: {
    // Info section
    accountInfo: '[data-testid="account-info"], .account-info',
    userEmail: '[data-testid="user-email"]',
    createdDate: 'text=/created|since/i',

    // Password change
    passwordSection: '[data-testid="password-section"], .password-section',
    currentPassword: 'input[name="currentPassword"]',
    newPassword: 'input[name="newPassword"]',
    confirmPassword: 'input[name="confirmPassword"]',
    changePasswordButton: 'button:has-text("Change Password")',

    // Workspace management
    workspaceSection: '[data-testid="workspace-section"]',
    saveWorkspaceButton: 'button:has-text("Save")',

    // Danger zone
    dangerZone: '[data-testid="danger-zone"], .danger-zone',
    deleteAccountButton: 'button:has-text("Delete Account")',
    confirmDeleteInput: 'input[placeholder*="DELETE"]',

    // Navigation
    backToDashboard: 'a[href="/app"], button:has-text("Back")',
  },

  // ===================
  // BMAD METHOD
  // ===================
  bmad: {
    // Pathway selection
    pathwaySelector: '[data-testid="pathway-selector"]',
    newIdeaPathway: 'text=/brand new idea|creative.*expansion/i',
    businessModelPathway: 'text=/business model problem|analysis/i',
    featurePathway: 'text=/refine.*feature|user.*centered/i',

    // Session
    sessionActive: '.bmad-session-active, [data-testid="bmad-active"]',
    sessionTimer: '[data-testid="session-timer"]',
    sessionPhase: '[data-testid="session-phase"]',
    phaseGuidance: '[data-testid="phase-guidance"], .phase-description',

    // Controls
    pauseButton: 'button:has-text("Pause Session")',
    resumeButton: 'button:has-text("Resume Session")',
    completeButton: 'button:has-text("Complete")',

    // Elicitation
    elicitationPanel: '.elicitation-panel, [data-testid="elicitation"]',
    elicitationOption: '.elicitation-panel button, [data-elicitation-option]',
    customInput: 'textarea[placeholder*="thoughts"], input[placeholder*="answer"]',

    // Output
    generatedDocument: '[data-testid="generated-document"], .canvas-document',
    outputTypeSelector: '[data-testid="output-type"]',
    exportButton: 'button:has-text("Export")',
  },

  // ===================
  // COMMON / SHARED
  // ===================
  common: {
    // Loading states
    loadingSpinner: '.loading, [data-loading], .animate-spin',
    skeleton: '.skeleton, [data-skeleton]',

    // Modals
    modal: '[role="dialog"], .modal',
    modalClose: 'button[aria-label="Close"], button:has-text("Close")',
    modalConfirm: 'button:has-text("Confirm"), button:has-text("OK")',
    modalCancel: 'button:has-text("Cancel")',

    // Toasts/Notifications
    toast: '[role="status"], .toast',
    toastSuccess: '.toast-success, [data-toast="success"]',
    toastError: '.toast-error, [data-toast="error"]',

    // Page title
    pageTitle: 'h1',

    // Footer
    footer: 'footer',
  },
};

/**
 * Helper to get selector with fallback
 * Tries primary selector first, falls back to secondary
 */
export function getSelector(primary: string, fallback?: string): string {
  return fallback ? `${primary}, ${fallback}` : primary;
}

/**
 * Helper to create test ID selector
 */
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}
