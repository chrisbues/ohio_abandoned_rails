import type { FeatureCollection, Geometry } from 'geojson';
import { ORDC_SERVICE_BASE, type OrdcLayerDef } from '../config/ordc';

export type OrdcCollection = FeatureCollection<Geometry, Record<string, unknown>>;

// Statewide layers are fetched once and kept for the session (~2-4 MB raw,
// far less over the wire with gzip).
const cache = new Map<string, OrdcCollection>();
const inflight = new Map<string, Promise<OrdcCollection>>();

/** Fetch a full-statewide ORDC layer as GeoJSON, cached per layer. */
export function fetchOrdcLayer(def: OrdcLayerDef): Promise<OrdcCollection> {
  const cached = cache.get(def.key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(def.key);
  if (pending) return pending;

  const params = new URLSearchParams({
    where: '1=1',
    outFields: def.outFields.join(','),
    outSR: '4326',
    geometryPrecision: '5',
    f: 'geojson',
  });
  const url = `${ORDC_SERVICE_BASE}/${def.layerId}/query?${params}`;

  const promise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`ORDC service ${res.status} ${res.statusText}`);
      const fc = (await res.json()) as OrdcCollection;
      if (!fc || fc.type !== 'FeatureCollection') throw new Error('ORDC service returned unexpected data');
      cache.set(def.key, fc);
      return fc;
    } finally {
      inflight.delete(def.key);
    }
  })();
  inflight.set(def.key, promise);
  return promise;
}
