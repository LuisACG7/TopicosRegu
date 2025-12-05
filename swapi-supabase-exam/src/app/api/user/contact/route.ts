// src/app/api/user/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getTokenFromHeader, verifyAuthToken } from '@/lib/auth';

export async function PUT(req: NextRequest) {
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

  const body = await req.json();
  const contact_data = body as Record<string, unknown>;

  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .update({ contact_data })
    .eq('id', payload.sub)
    .select('id, email, role, last_login, contact_data')
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo actualizar contacto' },
      { status: 400 }
    );
  }

  return NextResponse.json({ user });
}
