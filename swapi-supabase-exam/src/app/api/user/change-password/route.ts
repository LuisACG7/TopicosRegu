// src/app/api/user/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getTokenFromHeader, verifyAuthToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'currentPassword y newPassword son requeridos' },
      { status: 400 }
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from('app_users')
    .select('id, password_hash')
    .eq('id', payload.sub)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: 'Contraseña actual incorrecta' },
      { status: 401 }
    );
  }

  const new_hash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabaseAdmin
    .from('app_users')
    .update({ password_hash: new_hash })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: 'Contraseña actualizada' });
}
