export const ADMIN_EMAILS = ['kholland7@gmail.com', 'hollandkevint@gmail.com'] as const;

export function isAdminEmail(email: string | undefined | null): boolean {
  return ADMIN_EMAILS.includes(email?.toLowerCase() as typeof ADMIN_EMAILS[number]);
}
