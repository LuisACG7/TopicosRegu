// src/lib/auth.ts
import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_APP!;

// Lo que guardamos dentro del token
export interface AuthTokenPayload extends JwtPayload {
  sub: string;   // id de app_users
  email: string;
  role: string;
}

// Lee "Authorization: Bearer <token>"
export function getTokenFromHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
}

// Valida y devuelve el payload o null
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return payload;
  } catch {
    return null;
  }
}
