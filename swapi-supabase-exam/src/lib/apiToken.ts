// src/lib/apiToken.ts
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const JWT_SECRET = process.env.JWT_SECRET_APP!;

// Límite de peticiones y tiempo de vida del token.
// Por ejemplo 5 peticiones, 5 minutos.
const MAX_REQUESTS = 5;
const TOKEN_TTL_MINUTES = 5;

export interface ApiTokenResult {
  ok: boolean;
  userId?: string;
  error?: string;
}

/**
 * Crea un registro de api_tokens para este token.
 * Se llama en /api/auth/login.
 */
export async function createApiTokenRecord(
  userId: string,
  token: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();

  // Guardamos el token como está (para el examen es suficiente).
  await supabaseAdmin.from('api_tokens').insert({
    user_id: userId,
    token,
    remaining_requests: MAX_REQUESTS,
    expires_at: expiresAt,
  });
}

/**
 * Verifica el JWT y el registro en api_tokens.
 * También DESCUENTA 1 petición si es válido.
 */
export async function verifyAndConsumeApiToken(
  token: string,
): Promise<ApiTokenResult> {
  try {
    // 1) Verificar firma y expiración del JWT
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    const userId = payload.sub;

    if (!userId) {
      return { ok: false, error: 'Token inválido (sin usuario).' };
    }

    // 2) Buscar en api_tokens
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('api_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', nowIso)
      .gt('remaining_requests', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        error: 'Token expirado o sin peticiones disponibles.',
      };
    }

    // 3) Descontar 1 petición
    await supabaseAdmin
      .from('api_tokens')
      .update({ remaining_requests: (data.remaining_requests as number) - 1 })
      .eq('id', data.id);

    return { ok: true, userId };
  } catch (err) {
    console.error(err);
    return { ok: false, error: 'Token inválido o expirado.' };
  }
}
