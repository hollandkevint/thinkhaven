const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'kholland7@gmail.com',
  'hollandkevint@gmail.com',
  'test-admin@thinkhaven.co',
]);

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
