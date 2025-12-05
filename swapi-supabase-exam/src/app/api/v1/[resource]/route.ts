// src/app/api/v1/[resource]/route.ts

import { NextRequest, NextResponse } from 'next/server'; // Importa tipos y helpers de Next para rutas de servidor.
import { supabaseAdmin } from '@/lib/supabaseAdmin';     // Importa el cliente Admin de Supabase.

// Lista de recursos válidos que existen como tablas en la BD.
const VALID_RESOURCES = [
  'films',
  'people',
  'planets',
  'species',
  'starships',
  'vehicles',
] as const;

// Tipo que representa exactamente uno de los recursos válidos.
type Resource = (typeof VALID_RESOURCES)[number];

// Tipo para los parámetros de ruta dinámicos: /api/v1/[resource].
type RouteParams = {
  resource: Resource; // El parámetro resource debe ser uno de los valores válidos.
};

/* =========================================
   GET /api/v1/[resource] → leer desde BD
   ========================================= */

export async function GET(
  _req: NextRequest,                               // Petición HTTP (no la usamos, por eso _req).
  context: { params: Promise<RouteParams> },      // Contexto con los parámetros de la ruta (promesa).
) {
  // Esperamos los parámetros porque Next los tipó como Promise.
  const { resource } = await context.params;      // Extraemos el recurso de la ruta.

  // Validamos que el recurso exista en nuestra lista.
  if (!VALID_RESOURCES.includes(resource)) {      // Si el recurso no está en la lista, devolvemos error.
    return NextResponse.json(                     // Respondemos un JSON.
      { error: 'Recurso inválido.' },             // Mensaje de error.
      { status: 400 },                            // Código HTTP 400 (Bad Request).
    );
  }

  // Consultamos todos los registros de la tabla correspondiente en Supabase.
  const { data, error } = await supabaseAdmin     // Usamos el cliente admin.
    .from(resource)                               // Nombre de la tabla = nombre del recurso.
    .select('*')                                  // Seleccionamos todos los campos.
    .order('id', { ascending: true });            // Ordenamos por id ascendente.

  // Si hubo error en la consulta, devolvemos 500.
  if (error) {
    return NextResponse.json(                     // Respondemos JSON de error.
      { error: error.message },                   // Mensaje de error de Supabase.
      { status: 500 },                            // Código HTTP 500 (Internal Server Error).
    );
  }

  // Devolvemos un objeto con la misma estructura que las listas de SWAPI.
  return NextResponse.json({
    count: data?.length ?? 0,                     // Cantidad de registros.
    next: null as null,                           // Sin paginación, lo dejamos en null.
    previous: null as null,                       // Igual que arriba.
    results: data ?? [],                          // Arreglo de resultados (o vacío si no hay datos).
  });
}

/* =========================================
   DELETE /api/v1/[resource] → borrar TODO
   ========================================= */

export async function DELETE(
  _req: NextRequest,                               // Petición HTTP (no la usamos).
  context: { params: Promise<RouteParams> },       // Contexto con los parámetros de ruta.
) {
  // De nuevo, le hacemos await a los parámetros.
  const { resource } = await context.params;       // Extraemos el recurso (films, people, etc.).

  // Validamos que el recurso sea uno de los permitidos.
  if (!VALID_RESOURCES.includes(resource)) {       // Si no es válido, regresamos error 400.
    return NextResponse.json(
      { error: 'Recurso inválido.' },
      { status: 400 },
    );
  }

  // Borramos TODOS los registros de la tabla correspondiente.
  const { error } = await supabaseAdmin
    .from(resource)                                // Tabla = recurso.
    .delete()                                      // Operación DELETE.
    .neq('id', 0);                                 // Condición que siempre se cumple si id > 0 (borra todo).

  // Si Supabase devolvió error al borrar, respondemos 500.
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  // Si todo salió bien, regresamos un mensaje de éxito.
  return NextResponse.json({
    message: `Todos los registros de ${resource} fueron eliminados correctamente.`,
  });
}
