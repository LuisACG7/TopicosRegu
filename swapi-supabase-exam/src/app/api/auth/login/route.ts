// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type UserRole = 'admin' | 'user';

interface LoginBody {
  email: string;
  password: string;
}

interface AppUser {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  last_login: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET_APP;

if (!JWT_SECRET) {
  // Esto ayuda a detectar problemas de configuración en desarrollo
  console.warn(
    '⚠️  No está definida la variable de entorno JWT_SECRET_APP. ' +
      'Configúrala en tu archivo .env.local'
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as LoginBody;

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
      .single<AppUser>();

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

    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor (JWT_SECRET_APP)' },
        { status: 500 }
      );
    }

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
      },
    });
  } catch (err: unknown) {
    console.error('Error en /api/auth/login:', err);
    const message =
      err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
