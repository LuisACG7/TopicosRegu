// src/app/api/user/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getTokenFromHeader, verifyAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return NextResponse.json(
      { error: 'Token requerido (Authorization: Bearer ...)' },
      { status: 401 }
    );
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .select('id, email, role, last_login, contact_data, created_at')
    .eq('id', payload.sub)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}
