// src/app/api/user/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_APP as string;

if (!JWT_SECRET) {
  throw new Error('Falta la variable JWT_SECRET_APP en .env.local');
}

interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { currentPassword, newPassword } = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual y nueva son requeridas' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('app_users')
      .select('*')
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
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await supabaseAdmin
      .from('app_users')
      .update({ password_hash: newHash })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : 'Error interno del servidor.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
