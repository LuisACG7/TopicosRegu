// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

type UserRole = 'admin' | 'user';

interface RegisterBody {
  email: string;
  password: string;
  role?: UserRole;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    const { email, password, role = 'user' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .insert([{ email, password_hash, role }])
      .select('id, email, role, last_login')
      .single();

    if (error || !data) {
      const message = error?.message ?? 'No se pudo registrar el usuario';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err: unknown) {
    console.error('Error en /api/auth/register:', err);
    const message =
      err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
