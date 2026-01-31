import { jwtVerify, type JWTPayload } from 'jose';

export interface JwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  beta_approved?: boolean;
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    console.error('SUPABASE_JWT_SECRET not configured');
    return null;
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as JwtPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
