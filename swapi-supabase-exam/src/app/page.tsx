// src/app/swapi/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Resource =
  | 'films'
  | 'people'
  | 'planets'
  | 'species'
  | 'starships'
  | 'vehicles';

interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Respuesta genérica de lista de SWAPI (count, next, previous, results)
interface SwapiListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Tipo genérico para lo que guardamos del API interna.
// No lo interpretamos, solo lo mostramos con JSON.stringify.
type UnknownJson = unknown;

export default function SwapiPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [resource, setResource] = useState<Resource>('films');

  const [swapiData, setSwapiData] = useState<UnknownJson | null>(null);
  const [dbData, setDbData] = useState<UnknownJson | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSwapi, setLoadingSwapi] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('swapiToken')
        : null;
    const userStr =
      typeof window !== 'undefined'
        ? localStorage.getItem('swapiUser')
        : null;

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userStr) as AppUser;
      setUser(parsed);
    } catch {
      localStorage.removeItem('swapiToken');
      localStorage.removeItem('swapiUser');
      router.push('/login');
    }
  }, [router]);

  const handleFetchSwapiDirect = async () => {
    setError(null);
    setSwapiData(null);
    setLoadingSwapi(true);
    try {
      const res = await fetch(`https://swapi.dev/api/${resource}/`);
      if (!res.ok) {
        throw new Error(`Error SWAPI: ${res.status}`);
      }

      // No necesitamos un tipo súper estricto, solo algo JSON‐compatible.
      const data: SwapiListResponse<Record<string, unknown>> =
        (await res.json()) as SwapiListResponse<Record<string, unknown>>;

      setSwapiData(data);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Error al consultar SWAPI.';
      setError(message);
    } finally {
      setLoadingSwapi(false);
    }
  };

  const handleSyncToDb = async () => {
    setError(null);
    setSyncMessage(null);
    setLoadingSync(true);
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('swapiToken')
        : null;

      const res = await fetch('/api/swapi/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resource }),
      });

      const data: UnknownJson = await res.json();

      if (!res.ok) {
        // data aquí debería ser { error: string } pero lo tratamos como unknown
        const msg =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Error al sincronizar con Supabase.';
        setError(msg);
        return;
      }

      const msg =
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : `Sincronización de ${resource} realizada correctamente.`;

      setSyncMessage(msg);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : 'Error de red al sincronizar.';
      setError(message);
    } finally {
      setLoadingSync(false);
    }
  };

  const handleFetchFromDb = async () => {
    setError(null);
    setDbData(null);
    setLoadingDb(true);
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('swapiToken')
        : null;

      const res = await fetch(`/api/v1/${resource}/`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data: UnknownJson = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Error al leer desde la API interna.';
        setError(msg);
        return;
      }

      setDbData(data);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : 'Error de red al leer desde la API interna.';
      setError(message);
    } finally {
      setLoadingDb(false);
    }
  };

  if (!user) {
    return <p className="p-4">Validando sesión…</p>;
  }

  return (
    <section className="space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cliente SWAPI</h1>
          <p className="text-sm text-slate-600">
            Usuario: <strong>{user.email}</strong> ({user.role})
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Ir al dashboard
        </button>
      </header>

      {/* Selector de recurso */}
      <div className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Seleccionar recurso</h2>
        <select
          value={resource}
          onChange={(e) => setResource(e.target.value as Resource)}
          className="mt-1 rounded border px-3 py-2 text-sm"
        >
          <option value="films">Films</option>
          <option value="people">People</option>
          <option value="planets">Planets</option>
          <option value="species">Species</option>
          <option value="starships">Starships</option>
          <option value="vehicles">Vehicles</option>
        </select>

        <p className="text-xs text-slate-500">
          Esta pantalla cubre la “Pantalla de consulta del API” y la
          “descarga/carga de información a la BD”.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}

      {syncMessage && (
        <p className="text-sm text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-2 rounded">
          {syncMessage}
        </p>
      )}

      {/* Botones de acción */}
      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={handleFetchSwapiDirect}
          className="rounded border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
          disabled={loadingSwapi}
        >
          {loadingSwapi ? 'Consultando SWAPI…' : 'Ver SWAPI (directo)'}
        </button>

        <button
          onClick={handleSyncToDb}
          className="rounded bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={loadingSync}
        >
          {loadingSync ? 'Sincronizando…' : 'Descargar y guardar en Supabase'}
        </button>

        <button
          onClick={handleFetchFromDb}
          className="rounded border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
          disabled={loadingDb}
        >
          {loadingDb ? 'Leyendo API interna…' : 'Ver desde API interna (BD)'}
        </button>
      </div>

      {/* Resultado SWAPI */}
      <div className="rounded border p-4">
        <h2 className="text-lg font-semibold">Respuesta SWAPI (directo)</h2>
        {swapiData ? (
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(swapiData, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">
            Aún no has consultado SWAPI. Usa el botón &quot;Ver SWAPI
            (directo)&quot;.
          </p>
        )}
      </div>

      {/* Resultado API interna */}
      <div className="rounded border p-4">
        <h2 className="text-lg font-semibold">Respuesta API interna (/api/v1)</h2>
        {dbData ? (
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(dbData, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">
            Aún no has consultado tu API interna. Usa el botón &quot;Ver desde API
            interna (BD)&quot;.
          </p>
        )}
      </div>
    </section>
  );
}
