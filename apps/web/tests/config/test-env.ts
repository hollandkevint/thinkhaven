/**
 * Test environment configuration for OAuth and authentication testing
 */

export const testConfig = {
  // Base URLs
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

  // OAuth testing configuration
  oauth: {
    // Use mock OAuth provider in tests (safer than real OAuth)
    useMockProvider: process.env.USE_MOCK_OAUTH !== 'false',

    // Test OAuth client configuration (if using real OAuth in CI)
    testClientId: process.env.TEST_OAUTH_CLIENT_ID,
    testClientSecret: process.env.TEST_OAUTH_CLIENT_SECRET,

    // Mock OAuth responses
    mockSuccessResponse: {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer',
    },

    mockUserInfo: {
      id: 'mock_user_id',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    }
  },

  // Test timeouts
  timeouts: {
    oauth: 30000, // 30 seconds for OAuth flows
    navigation: 10000, // 10 seconds for navigation
    api: 5000, // 5 seconds for API calls
  },

  // Test user configuration
  testUsers: {
    default: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User'
    },
    oauth: {
      email: 'oauth.test@example.com',
      name: 'OAuth Test User',
      provider: 'google'
    }
  },

  // CI/CD specific settings
  ci: {
    headless: process.env.CI === 'true',
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    // Use GitHub Actions secrets in CI
    useSecrets: process.env.CI === 'true',
  }
}

// Validate required environment variables
export function validateTestEnvironment(): string[] {
  const errors: string[] = []

  // In CI, validate OAuth test credentials if using real OAuth
  if (testConfig.ci.useSecrets && !testConfig.oauth.useMockProvider) {
    if (!testConfig.oauth.testClientId) {
      errors.push('TEST_OAUTH_CLIENT_ID is required for OAuth testing in CI')
    }
    if (!testConfig.oauth.testClientSecret) {
      errors.push('TEST_OAUTH_CLIENT_SECRET is required for OAuth testing in CI')
    }
  }

  return errors
}

// Security considerations for OAuth testing
export const securityNotes = {
  credentials: [
    'Never commit real OAuth credentials to version control',
    'Use GitHub Actions secrets for CI/CD OAuth testing',
    'Prefer mock OAuth provider for local development',
    'Rotate test OAuth credentials regularly'
  ],

  dataHandling: [
    'Use dedicated test OAuth application',
    'Clean up test data after each test run',
    'Isolate test environment from production',
    'Monitor test OAuth usage limits'
  ],

  cicdBestPractices: [
    'Store OAuth credentials as encrypted secrets',
    'Use least-privilege OAuth scopes for testing',
    'Enable OAuth audit logging in test environment',
    'Implement OAuth credential rotation in CI/CD'
  ]
}
