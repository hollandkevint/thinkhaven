/**
 * Production environment validation
 * Ensures critical security settings are properly configured
 */

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityLevel: 'development' | 'staging' | 'production';
}

export class EnvironmentValidator {
  /**
   * Validate production environment configuration
   */
  static validateProduction(): EnvironmentValidationResult {
    const result: EnvironmentValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityLevel: this.getSecurityLevel()
    };

    // Validate required environment variables
    this.validateRequiredEnvVars(result);

    // Validate security configuration
    this.validateSecurityConfig(result);

    // Validate Supabase configuration
    this.validateSupabaseConfig(result);

    // Validate OAuth configuration
    this.validateOAuthConfig(result);

    result.isValid = result.errors.length === 0;

    return result;
  }

  private static validateRequiredEnvVars(result: EnvironmentValidationResult): void {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NODE_ENV'
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        result.errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Production-specific required vars
    if (result.securityLevel === 'production') {
      const productionVars = [
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
      ];

      for (const varName of productionVars) {
        if (!process.env[varName]) {
          result.errors.push(`Missing production environment variable: ${varName}`);
        }
      }
    }
  }

  private static validateSecurityConfig(result: EnvironmentValidationResult): void {
    // Validate NODE_ENV is properly set
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv || !['development', 'staging', 'production'].includes(nodeEnv)) {
      result.errors.push(`NODE_ENV must be set to 'development', 'staging', or 'production', got: ${nodeEnv}`);
    }

    // In production, ensure HTTPS
    if (result.securityLevel === 'production') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        result.errors.push('Supabase URL must use HTTPS in production');
      }

      // Check for development artifacts in production
      if (typeof window !== 'undefined') {
        if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
          result.errors.push('Production deployment must use HTTPS');
        }
      }
    }

    // Warn about potentially insecure configurations
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey && anonKey.length < 100) {
      result.warnings.push('Supabase anon key appears unusually short - verify it\'s correct');
    }
  }

  private static validateSupabaseConfig(result: EnvironmentValidationResult): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // URL validation
    if (supabaseUrl) {
      if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
        result.warnings.push('Supabase URL doesn\'t appear to be from Supabase or localhost');
      }

      if (supabaseUrl.includes('localhost') && result.securityLevel === 'production') {
        result.errors.push('Production should not use localhost Supabase URL');
      }

      // Check for placeholder values
      if (supabaseUrl.includes('your-project') || supabaseUrl.includes('example')) {
        result.errors.push('Supabase URL appears to be a placeholder value');
      }
    }

    // Key validation
    if (supabaseKey) {
      if (supabaseKey.startsWith('http')) {
        result.errors.push('Supabase anon key should not be a URL');
      }

      if (supabaseKey.includes('your-anon-key') || supabaseKey.includes('example')) {
        result.errors.push('Supabase anon key appears to be a placeholder value');
      }
    }
  }

  private static validateOAuthConfig(result: EnvironmentValidationResult): void {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (result.securityLevel === 'production' && googleClientId) {
      // Validate Google Client ID format
      if (!googleClientId.endsWith('.apps.googleusercontent.com')) {
        result.warnings.push('Google Client ID doesn\'t follow expected format');
      }

      // Check for test/development client ID in production
      if (googleClientId.includes('localhost') || googleClientId.includes('test')) {
        result.errors.push('Production should not use development Google Client ID');
      }
    }
  }

  private static getSecurityLevel(): 'development' | 'staging' | 'production' {
    // Widen beyond Next's NODE_ENV union: deploys can set 'staging' at runtime
    const nodeEnv: string | undefined = process.env.NODE_ENV;

    if (nodeEnv === 'production') {
      return 'production';
    } else if (nodeEnv === 'staging') {
      return 'staging';
    } else {
      return 'development';
    }
  }

  /**
   * Log validation results with appropriate severity
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
   * Validate environment on application startup
   */
  static validateOnStartup(): void {
    const result = this.validateProduction();
    this.logValidationResults(result);

    // In production, fail fast if validation errors exist
    if (!result.isValid && result.securityLevel === 'production') {
      console.error('🚨 PRODUCTION ENVIRONMENT VALIDATION FAILED - APPLICATION WILL NOT START');
      process.exit(1);
    }
  }
}