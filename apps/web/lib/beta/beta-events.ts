export const BETA_EVENT_TYPES = [
  'waitlist_joined',
  'waitlist_duplicate',
  'beta_approved',
  'beta_revoked',
  'invite_copied',
  'invite_arrived',
  'signup_from_invite',
  'guest_migration_attempted',
  'beta_gate_pending',
  'beta_gate_approved',
  'beta_gate_revoked',
  'first_app_access',
] as const;

export type BetaEventType = (typeof BETA_EVENT_TYPES)[number];

export type BetaEventMetadataValue = string | number | boolean | null;
export type BetaEventMetadata = Record<string, BetaEventMetadataValue>;

const BETA_EVENT_TYPE_SET = new Set<string>(BETA_EVENT_TYPES);
const SENSITIVE_METADATA_KEY_PATTERN = /email|password|secret|session|token/i;

export function isBetaEventType(value: string): value is BetaEventType {
  return BETA_EVENT_TYPE_SET.has(value);
}

export function assertBetaEventType(value: string): asserts value is BetaEventType {
  if (!isBetaEventType(value)) {
    throw new Error(`Unsupported beta event type: ${value}`);
  }
}

export function sanitizeBetaEventMetadata(
  metadata: Record<string, unknown> = {}
): BetaEventMetadata {
  return Object.entries(metadata).reduce<BetaEventMetadata>((safe, [key, value]) => {
    if (SENSITIVE_METADATA_KEY_PATTERN.test(key)) {
      return safe;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      safe[key] = value;
    }

    return safe;
  }, {});
}
