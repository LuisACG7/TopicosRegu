// src/app/api/swapi/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Resource =
  | 'films'
  | 'people'
  | 'planets'
  | 'species'
  | 'starships'
  | 'vehicles';

interface SwapiPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ============
   Tipos SWAPI
   ============ */

interface SwapiFilm {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  url: string;
}

interface SwapiPerson {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  url: string;
}

interface SwapiPlanet {
  name: string;
  climate: string;
  diameter: string;
  gravity: string;
  population: string;
  terrain: string;
  orbital_period: string;
  rotation_period: string;
  surface_water: string;
  url: string;
}

interface SwapiSpecies {
  name: string;
  classification: string;
  designation: string;
  average_height: string;
  average_lifespan: string;
  eye_colors: string;
  hair_colors: string;
  skin_colors: string;
  language: string;
  url: string;
}

interface SwapiStarship {
  name: string;
  model: string;
  starship_class: string;
  manufacturer: string;
  cost_in_credits: string;
  length: string;
  crew: string;
  passengers: string;
  max_atmosphering_speed: string;
  hyperdrive_rating: string;
  MGLT: string;
  cargo_capacity: string;
  consumables: string;
  url: string;
}

interface SwapiVehicle {
  name: string;
  model: string;
  vehicle_class: string;
  manufacturer: string;
  cost_in_credits: string;
  length: string;
  crew: string;
  passengers: string;
  max_atmosphering_speed: string;
  cargo_capacity: string;
  consumables: string;
  url: string;
}

/* ===========================================
   Utilidad para traer TODAS las páginas SWAPI
   =========================================== */

async function fetchAllFromSwapi<T>(resource: Resource): Promise<T[]> {
  const baseUrl = `https://swapi.dev/api/${resource}/`;
  let url: string | null = baseUrl;
  const all: T[] = [];

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Error al consultar SWAPI (${resource}): ${res.status}`);
    }

    const data = (await res.json()) as SwapiPage<T>;
    all.push(...data.results);
    url = data.next;
  }

  return all;
}

/* ========================
   Endpoint POST /api/swapi/sync
   ======================== */

export async function POST(req: NextRequest) {
  try {
    // Intentamos leer JSON; si viene vacío o malformado, devolvemos error claro.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Body JSON inválido o vacío.' },
        { status: 400 },
      );
    }

    const validResources: Resource[] = [
      'films',
      'people',
      'planets',
      'species',
      'starships',
      'vehicles',
    ];

    const resource = (() => {
      if (
        typeof body === 'object' &&
        body !== null &&
        'resource' in body &&
        typeof (body as { resource: unknown }).resource === 'string'
      ) {
        return (body as { resource: string }).resource as Resource;
      }
      return undefined;
    })();

    if (!resource || !validResources.includes(resource)) {
      return NextResponse.json(
        { error: 'Recurso inválido.' },
        { status: 400 },
      );
    }

    let upsertData: Record<string, unknown>[] = [];
    let totalSwapi = 0;

    if (resource === 'films') {
      const films = await fetchAllFromSwapi<SwapiFilm>('films');
      totalSwapi = films.length;

      upsertData = films.map((f) => ({
        swapi_id: parseInt(
          f.url.split('/').filter(Boolean).pop() ?? '0',
          10,
        ),
        title: f.title,
        episode_id: f.episode_id,
        opening_crawl: f.opening_crawl,
        director: f.director,
        producer: f.producer,
        release_date: f.release_date,
      }));
    } else if (resource === 'people') {
      const people = await fetchAllFromSwapi<SwapiPerson>('people');
      totalSwapi = people.length;

      upsertData = people.map((p) => ({
        swapi_id: parseInt(
          p.url.split('/').filter(Boolean).pop() ?? '0',
          10,
        ),
        name: p.name,
        height: p.height,
        mass: p.mass,
        hair_color: p.hair_color,
        skin_color: p.skin_color,
        eye_color: p.eye_color,
        birth_year: p.birth_year,
        gender: p.gender,
      }));
    } else if (resource === 'planets') {
      const planets = await fetchAllFromSwapi<SwapiPlanet>('planets');
      totalSwapi = planets.length;

      upsertData = planets.map((pl) => ({
        swapi_id: parseInt(
          pl.url.split('/').filter(Boolean).pop() ?? '0',
          10,
        ),
        name: pl.name,
        climate: pl.climate,
        diameter: pl.diameter,
        gravity: pl.gravity,
        population: pl.population,
        terrain: pl.terrain,
        orbital_period: pl.orbital_period,
        rotation_period: pl.rotation_period,
        surface_water: pl.surface_water,
      }));
    } else if (resource === 'species') {
      const species = await fetchAllFromSwapi<SwapiSpecies>('species');
      totalSwapi = species.length;

      upsertData = species.map((s) => ({
        swapi_id: parseInt(
          s.url.split('/').filter(Boolean).pop() ?? '0',
          10,
        ),
        name: s.name,
        classification: s.classification,
        designation: s.designation,
        average_height: s.average_height,
        average_lifespan: s.average_lifespan,
        eye_colors: s.eye_colors,
        hair_colors: s.hair_colors,
        skin_colors: s.skin_colors,
        language: s.language,
      }));
    } else if (resource === 'starships') {
      const starships = await fetchAllFromSwapi<SwapiStarship>('starships');
      totalSwapi = starships.length;

      upsertData = starships.map((ss) => ({
        swapi_id: parseInt(
          ss.url.split('/').filter(Boolean).pop() ?? '0',
          10,
        ),
        name: ss.name,
        model: ss.model,
        starship_class: ss.starship_class,
        manufacturer: ss.manufacturer,
        cost_in_credits: ss.cost_in_credits,
        length: ss.length,
        crew: ss.crew,
        passengers: ss.passengers,
        max_atmosphering_speed: ss.max_atmosphering_speed,
        hyperdrive_rating: ss.hyperdrive_rating,
        mglt: ss.MGLT,
        cargo_capacity: ss.cargo_capacity,
        consumables: ss.consumables,
      }));
    } else if (resource === 'vehicles') {
      const vehicles = await fetchAllFromSwapi<SwapiVehicle>('vehicles');
      totalSwapi = vehicles.length;

      upsertData = vehicles.map((v) => ({
        swapi_id: parseInt(
          v.url.split('/').filter(Boolean).pop() ?? '0',
          10,
        ),
        name: v.name,
        model: v.model,
        vehicle_class: v.vehicle_class,
        manufacturer: v.manufacturer,
        cost_in_credits: v.cost_in_credits,
        length: v.length,
        crew: v.crew,
        passengers: v.passengers,
        max_atmosphering_speed: v.max_atmosphering_speed,
        cargo_capacity: v.cargo_capacity,
        consumables: v.consumables,
      }));
    }

    const { error } = await supabaseAdmin
      .from(resource)
      .upsert(upsertData, { onConflict: 'swapi_id' });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: `Datos de ${resource} sincronizados correctamente.`,
      total_swapi: totalSwapi,
      total_upsert: upsertData.length,
    });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : 'Error interno.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
