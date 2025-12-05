// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role = 'user' } = body as {
      email?: string;
      password?: string;
      role?: 'admin' | 'user';
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .insert({ email, password_hash, role })
      .select('id, email, role, last_login, contact_data, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
