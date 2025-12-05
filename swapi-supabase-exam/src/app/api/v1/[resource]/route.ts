// src/app/api/v1/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAndConsumeApiToken } from '@/lib/apiToken';

const VALID_RESOURCES = [
  'films',
  'people',
  'planets',
  'species',
  'starships',
  'vehicles',
] as const;

type Resource = (typeof VALID_RESOURCES)[number];

type RouteParams = {
  resource: Resource;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  // 1) Validar token
  const auth = req.headers.get('authorization') ?? '';
  const [, rawToken] = auth.split(' ');

  if (!rawToken) {
    return NextResponse.json(
      { error: 'Token de acceso requerido (Bearer).' },
      { status: 401 },
    );
  }

  const tokenCheck = await verifyAndConsumeApiToken(rawToken);
  if (!tokenCheck.ok) {
    return NextResponse.json(
      { error: tokenCheck.error ?? 'Token inválido.' },
      { status: 401 },
    );
  }

  // 2) Parámetros de ruta
  const { resource } = await context.params;

  if (!VALID_RESOURCES.includes(resource)) {
    return NextResponse.json(
      { error: 'Recurso inválido.' },
      { status: 400 },
    );
  }

  // 3) Paginación ?limit=&offset=
  const search = req.nextUrl.searchParams;
  const limit = Number(search.get('limit') ?? '10');
  const offset = Number(search.get('offset') ?? '0');

  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 50 ? limit : 10;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  const from = safeOffset;
  const to = safeOffset + safeLimit - 1;

  const { data, error, count } = await supabaseAdmin
    .from(resource)
    .select('*', { count: 'exact' })
    .order('id', { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const total = count ?? data?.length ?? 0;

  return NextResponse.json({
    count: total,
    next:
      to + 1 < total
        ? `${req.nextUrl.origin}${req.nextUrl.pathname}?limit=${safeLimit}&offset=${to + 1}`
        : null,
    previous:
      from > 0
        ? `${req.nextUrl.origin}${req.nextUrl.pathname}?limit=${safeLimit}&offset=${Math.max(
            from - safeLimit,
            0,
          )}`
        : null,
    results: data ?? [],
  });
}
