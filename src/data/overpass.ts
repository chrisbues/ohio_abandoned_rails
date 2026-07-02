import type { Feature, FeatureCollection, LineString } from 'geojson';
import { classifyRailway, type RailStatus } from '../config/railLayers';

// Public Overpass API endpoints. We try them in order if one is rate-limited / down.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RailProperties {
  id: number;
  status: RailStatus;
  railway: string;
  name: string | null;
  operator: string | null;
  ref: string | null;
  usage: string | null;
  // Useful OSINT crumbs when present.
  old_railway_operator: string | null;
  start_date: string | null;
  end_date: string | null;
}

export type RailFeature = Feature<LineString, RailProperties>;
export type RailCollection = FeatureCollection<LineString, RailProperties>;

/** OSM railway values we care about (active through abandoned). */
const RAILWAY_REGEX =
  '^(rail|light_rail|narrow_gauge|subway|tram|monorail|funicular|preserved|disused|abandoned|razed|dismantled|removed|construction|proposed)$';

function buildQuery(b: MapBounds): string {
  // Overpass bbox order is (south, west, north, east).
  const bbox = `${b.south},${b.west},${b.north},${b.east}`;
  return `[out:json][timeout:90];
(
  way["railway"~"${RAILWAY_REGEX}"](${bbox});
);
out geom;`;
}

interface OverpassNode {
  lat: number;
  lon: number;
}

interface OverpassWay {
  type: 'way';
  id: number;
  geometry?: OverpassNode[];
  tags?: Record<string, string>;
}

function wayToFeature(way: OverpassWay): RailFeature | null {
  if (!way.geometry || way.geometry.length < 2) return null;
  const tags = way.tags ?? {};
  const railway = tags.railway;
  if (!railway) return null;
  const status = classifyRailway(railway);
  if (!status) return null;

  return {
    type: 'Feature',
    id: way.id,
    geometry: {
      type: 'LineString',
      coordinates: way.geometry.map((n) => [n.lon, n.lat]),
    },
    properties: {
      id: way.id,
      status,
      railway,
      name: tags.name ?? tags['old_railway:name'] ?? null,
      operator: tags.operator ?? null,
      ref: tags.ref ?? null,
      usage: tags.usage ?? null,
      old_railway_operator: tags['old_railway:operator'] ?? tags['abandoned:operator'] ?? null,
      start_date: tags.start_date ?? null,
      end_date: tags.end_date ?? null,
    },
  };
}

/** Fetch railway features within the given bounds from Overpass, classified by status. */
export async function fetchRail(bounds: MapBounds): Promise<RailCollection> {
  const query = buildQuery(bounds);
  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status} ${res.statusText}`);
        continue;
      }
      const json = (await res.json()) as { elements: OverpassWay[] };
      const features = (json.elements ?? [])
        .filter((el): el is OverpassWay => el.type === 'way')
        .map(wayToFeature)
        .filter((f): f is RailFeature => f !== null);
      return { type: 'FeatureCollection', features };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Overpass request failed');
}

/** Rough degrees-squared area; used to warn before pulling an enormous viewport. */
export function boundsAreaDeg(b: MapBounds): number {
  return Math.abs((b.north - b.south) * (b.east - b.west));
}
