// src/lib/swapi.ts
const BASE = 'https://swapi.dev/api';

export async function fetchSwapiList(resource: string) {
  const res = await fetch(`${BASE}/${resource}/`);
  if (!res.ok) throw new Error(`Error SWAPI: ${res.status}`);
  const data = await res.json();
  return data; // { count, next, previous, results: [...] }
}
