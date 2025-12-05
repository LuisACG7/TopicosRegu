'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'user';

interface ContactData {
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  [key: string]: unknown; // por si guardas más campos.
}

interface AppUser {
  id: string;
  email: string;
  role: Role;
  last_login: string | null;
  contact_data?: ContactData | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // cambio contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('swapiToken') : null;
    const userStr =
      typeof window !== 'undefined' ? localStorage.getItem('swapiUser') : null;

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userStr) as AppUser;
      setUser(parsed);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('swapiToken');
      localStorage.removeItem('swapiUser');
      router.push('/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('swapiToken');
    localStorage.removeItem('swapiUser');
    router.push('/login');
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    setError(null);

    const token = localStorage.getItem('swapiToken');
    if (!token) {
      setError('Sesión inválida, inicia sesión de nuevo.');
      return;
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al cambiar contraseña.');
        return;
      }

      setPwdMessage('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      setError('Error de red.');
    }
  };

  if (loading) {
    return <p>Cargando dashboard…</p>;
  }

  if (!user) {
    return <p>No hay sesión activa.</p>;
  }

  const lastLoginText = user.last_login
    ? new Date(user.last_login).toLocaleString()
    : 'Nunca';

  // Normalizar datos de contacto para mostrarlos en texto plano
  const contact: ContactData | null =
    user.contact_data && typeof user.contact_data === 'object'
      ? (user.contact_data as ContactData)
      : null;

  const hasContactData = contact && Object.keys(contact).length > 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-600">
            Sesión como <strong>{user.email}</strong> ({user.role})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Cerrar sesión
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Datos básicos de usuario */}
      <div className="rounded border p-4 space-y-2">
        <h2 className="text-lg font-semibold">Datos de usuario</h2>
        <p className="text-sm">
          <span className="font-medium">Último acceso:</span> {lastLoginText}
        </p>

        <div className="text-sm">
          <span className="font-medium">Datos de contacto:</span>

          {!hasContactData && (
            <p className="mt-1 text-sm text-slate-500">
              Sin datos de contacto registrados.
            </p>
          )}

          {hasContactData && (
            <ul className="mt-1 space-y-1 rounded bg-slate-100 p-3 text-sm">
              {contact?.telefono && (
                <li>
                  <span className="font-medium">Teléfono:</span> {contact.telefono}
                </li>
              )}
              {contact?.celular && (
                <li>
                  <span className="font-medium">Celular:</span> {contact.celular}
                </li>
              )}
              {contact?.direccion && (
                <li>
                  <span className="font-medium">Dirección:</span> {contact.direccion}
                </li>
              )}
              {contact?.ciudad && (
                <li>
                  <span className="font-medium">Ciudad:</span> {contact.ciudad}
                </li>
              )}
              {contact?.pais && (
                <li>
                  <span className="font-medium">País:</span> {contact.pais}
                </li>
              )}

              {/* Campos extra que no hayas mapeado explícitamente */}
              {Object.entries(contact ?? {})
                .filter(
                  ([key]) =>
                    !['telefono', 'celular', 'direccion', 'ciudad', 'pais'].includes(
                      key,
                    ),
                )
                .map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>{' '}
                    {String(value)}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Cambio de contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium">
              Contraseña actual
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nueva contraseña</label>
            <input
              type="password"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {pwdMessage && (
            <p className="text-sm text-emerald-700">{pwdMessage}</p>
          )}

          <button
            type="submit"
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Guardar contraseña
          </button>
        </form>
      </div>

      {/* Zona admin / usuario */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4">
          <h3 className="text-base font-semibold">Zona general</h3>
          <p className="mt-1 text-sm">
            Sección visible para cualquier usuario autenticado. Aquí después
            vas a poner los listados de SWAPI desde Supabase.
          </p>
        </div>

        {user.role === 'admin' ? (
          <div className="rounded border border-amber-400 bg-amber-50 p-4">
            <h3 className="text-base font-semibold">Zona administrativa</h3>
            <p className="mt-1 text-sm">
              Solo visible para usuarios con rol <strong>admin</strong>. Aquí
              podrás poner acciones de administración de datos.
            </p>
          </div>
        ) : (
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-base font-semibold">Zona usuario limitado</h3>
            <p className="mt-1 text-sm">
              Tu rol es <strong>user</strong>, por lo que ves opciones
              limitadas. Esto cubre el requisito de permisos restringidos.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
