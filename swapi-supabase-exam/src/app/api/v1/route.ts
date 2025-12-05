// src/app/api/v1/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const base = 'http://localhost:3000/api/v1';

  return NextResponse.json({
    films: `${base}/films/`,
    people: `${base}/people/`,
    planets: `${base}/planets/`,
    species: `${base}/species/`,
    starships: `${base}/starships/`,
    vehicles: `${base}/vehicles/`,
  });
}
