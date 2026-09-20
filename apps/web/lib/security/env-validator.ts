/**
 * Production environment validation
 * Ensures the Railway and Better Auth configuration is present before startup.
 */

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityLevel: 'development' | 'staging' | 'production';
}

function configured(env: NodeJS.ProcessEnv, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export class EnvironmentValidator {
  /**
   * Validate production environment configuration.
   */
  static validateProduction(): EnvironmentValidationResult {
    const result: EnvironmentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityLevel: this.getSecurityLevel(),
    };

    this.validateRequiredEnvVars(result);
    this.validateSecurityConfig(result);
    this.validateRailwayAuthConfig(result);
    this.validateOAuthConfig(result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  private static validateRequiredEnvVars(result: EnvironmentValidationResult): void {
    const requiredVars: Array<[string, ...string[]]> = [
      ['DATABASE_URL'],
      ['BETTER_AUTH_SECRET', 'AUTH_SECRET'],
      ['GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'],
      ['GOOGLE_CLIENT_SECRET'],
      ['NODE_ENV'],
    ];

    for (const [name, ...aliases] of requiredVars) {
      if (!configured(process.env, name, ...aliases)) {
        const aliasText = aliases.length > 0 ? ` (or ${aliases.join(', ')})` : '';
        result.errors.push(`Missing required environment variable: ${name}${aliasText}`);
      }
    }

    if (result.securityLevel === 'production') {
      const productionVars: Array<[string, ...string[]]> = [
        ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL'],
        ['RESEND_API_KEY'],
        ['RESEND_FROM_EMAIL'],
      ];

      for (const [name, ...aliases] of productionVars) {
        if (!configured(process.env, name, ...aliases)) {
          const aliasText = aliases.length > 0 ? ` (or ${aliases.join(', ')})` : '';
          result.errors.push(`Missing production environment variable: ${name}${aliasText}`);
        }
      }
    }
  }

  private static validateSecurityConfig(result: EnvironmentValidationResult): void {
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv || !['development', 'staging', 'production'].includes(nodeEnv)) {
      result.errors.push(`NODE_ENV must be set to 'development', 'staging', or 'production', got: ${nodeEnv}`);
    }

    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (databaseUrl && !/^(postgres|postgresql):\/\//.test(databaseUrl)) {
      result.errors.push('DATABASE_URL must use the postgres:// or postgresql:// protocol');
    }

    const authUrl = configured(process.env, 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL');
    if (result.securityLevel === 'production') {
      if (authUrl && !authUrl.startsWith('https://')) {
        result.errors.push('Better Auth URL must use HTTPS in production');
      }

      if (databaseUrl && /localhost|127\.0\.0\.1/.test(databaseUrl)) {
        result.errors.push('Production should not use a localhost database URL');
      }

      if (typeof window !== 'undefined') {
        if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
          result.errors.push('Production deployment must use HTTPS');
        }
      }
    }

    const secret = configured(process.env, 'BETTER_AUTH_SECRET', 'AUTH_SECRET');
    if (secret && secret.length < 32) {
      result.warnings.push('Better Auth secret is shorter than the recommended 32 characters');
    }
    if (secret && /^(your-|change-me|example|test-secret)/i.test(secret)) {
      result.errors.push('Better Auth secret appears to be a placeholder value');
    }
  }

  private static validateRailwayAuthConfig(result: EnvironmentValidationResult): void {
    const authUrl = configured(process.env, 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL');
    if (!authUrl) return;

    try {
      const parsed = new URL(authUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        result.errors.push('Better Auth URL must use HTTP or HTTPS');
      }
    } catch {
      result.errors.push('Better Auth URL must be a valid URL');
    }

    if (/your-project|example\.com/i.test(authUrl)) {
      result.errors.push('Better Auth URL appears to be a placeholder value');
    }

    const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
    if (resendFrom && !resendFrom.includes('@')) {
      result.errors.push('RESEND_FROM_EMAIL must be an email address');
    }
  }

  private static validateOAuthConfig(result: EnvironmentValidationResult): void {
    const googleClientId = configured(process.env, 'GOOGLE_CLIENT_ID', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID');
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (googleClientId) {
      if (!googleClientId.endsWith('.apps.googleusercontent.com')) {
        result.warnings.push('Google Client ID doesn\'t follow expected format');
      }
      if (/localhost|test|example/i.test(googleClientId) && result.securityLevel === 'production') {
        result.errors.push('Production should not use a development Google Client ID');
      }
    }

    if (googleClientSecret && /your-|example|test-secret/i.test(googleClientSecret)) {
      result.errors.push('Google Client secret appears to be a placeholder value');
    }
  }

  private static getSecurityLevel(): 'development' | 'staging' | 'production' {
    const nodeEnv: string | undefined = process.env.NODE_ENV;
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'staging') return 'staging';
    return 'development';
  }

  /**
   * Log validation results with appropriate severity.
   */
  static logValidationResults(result: EnvironmentValidationResult): void {
    if (result.errors.length > 0) {
      console.error('🚨 ENVIRONMENT VALIDATION ERRORS:');
      result.errors.forEach(error => console.error(`  ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️  ENVIRONMENT VALIDATION WARNINGS:');
      result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
    }

    if (result.isValid && result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`✅ Environment validation passed for ${result.securityLevel} security level`);
    }
  }

  /**
   * Validate environment on application startup.
   */
  static validateOnStartup(): void {
    const result = this.validateProduction();
    this.logValidationResults(result);

    if (!result.isValid && result.securityLevel === 'production') {
      console.error('🚨 PRODUCTION ENVIRONMENT VALIDATION FAILED - APPLICATION WILL NOT START');
      process.exit(1);
    }
  }
}
