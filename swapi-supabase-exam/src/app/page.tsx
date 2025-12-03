// src/app/page.tsx
export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Inicio</h1>
      <p>
        Esta es la aplicación del examen: autenticación, roles y consumo de
        SWAPI almacenado en Supabase.
      </p>
      <ul className="list-disc pl-5 text-sm space-y-1">
        <li>Inicia sesión desde /login.</li>
        <li>
          Si eres admin, verás opciones adicionales en el Dashboard.
        </li>
        <li>
          Se muestra último acceso, datos de contacto y cambio de contraseña.
        </li>
      </ul>
    </section>
  );
}
