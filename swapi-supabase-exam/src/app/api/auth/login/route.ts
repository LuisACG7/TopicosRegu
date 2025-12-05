// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_APP!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // actualizar last_login
    await supabaseAdmin
      .from('app_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // token de sesión
    const sessionToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
        contact_data: user.contact_data,
      },
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
