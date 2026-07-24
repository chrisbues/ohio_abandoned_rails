import { useEffect, useRef, useState } from 'react';
import maplibregl, { type ExpressionSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Basemap } from '../config/basemaps';
import { REFERENCE_OVERLAY } from '../config/basemaps';
import { RAIL_OVERLAYS } from '../config/railLayers';
import { ORDC_ATTRIBUTION, ORDC_LAYERS, type OrdcLayerDef } from '../config/ordc';
import type { RailCollection } from '../data/overpass';
import type { OrdcCollection } from '../data/ordc';

const BASEMAP_SOURCE = 'basemap';
const BASEMAP_LAYER = 'basemap-layer';
const REFERENCE_SOURCE = 'reference';
const REFERENCE_LAYER = 'reference-layer';
const RAIL_SOURCE = 'rail';

const EMPTY_FC: RailCollection = { type: 'FeatureCollection', features: [] };

interface Props {
  basemap: Basemap;
  /**
   * Tiles resolved at runtime for basemaps without a fixed template
   * (Esri Wayback release, Ohio historical vintage).
   */
  dynamicTiles: string[] | null;
  dynamicMaxzoom: number | null;
  showReference: boolean;
  overlayVisibility: Record<string, boolean>;
  railData: RailCollection;
  /** Statewide ORDC layer data, keyed by layer key; null until loaded. */
  ordcData: Record<string, OrdcCollection | null>;
  ordcVisibility: Record<string, boolean>;
  onMapReady: (map: maplibregl.Map) => void;
}

export function MapView({
  basemap,
  dynamicTiles,
  dynamicMaxzoom,
  showReference,
  overlayVisibility,
  railData,
  ordcData,
  ordcVisibility,
  onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // ---- Initialize the map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: { version: 8, sources: {}, layers: [] },
      center: [-82.9, 40.3], // roughly the center of Ohio
      zoom: 7,
      maxZoom: 20,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-left');

    // Show/follow the user's position — useful for standing on an actual grade
    // in the field and comparing it against the mapped right-of-way.
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true, timeout: 10000 },
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    map.addControl(geolocate, 'top-left');
    geolocate.on('error', (err: GeolocationPositionError) => {
      setGeoError(
        err.code === 1
          ? 'Location permission denied — enable it in your browser to show your position.'
          : err.code === 3
            ? 'Timed out getting your location. Try again with a clearer view of the sky.'
            : 'Could not determine your location.',
      );
    });
    geolocate.on('geolocate', () => setGeoError(null));

    map.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.on('load', () => {
      // ODOT/ORDC statewide layers: lines drawn beneath the OSM rail layers so
      // live OSM edits stay on top; crossing points drawn above everything.
      for (const ordc of ORDC_LAYERS) {
        map.addSource(ordc.key, {
          type: 'geojson',
          data: EMPTY_FC,
          attribution: ORDC_ATTRIBUTION,
        });
        if (ordc.kind === 'line') {
          map.addLayer({
            id: ordc.key,
            type: 'line',
            source: ordc.key,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              visibility: 'none',
            },
            paint: {
              'line-color': ordc.color,
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                ordc.width * 0.6,
                14,
                ordc.width * 1.6,
              ],
              ...(ordc.dash ? { 'line-dasharray': ordc.dash } : {}),
            },
          });
        }
      }

      // Rail source + one line layer per overlay group, drawn above the basemap.
      map.addSource(RAIL_SOURCE, { type: 'geojson', data: EMPTY_FC });
      for (const ov of RAIL_OVERLAYS) {
        map.addLayer({
          id: ov.key,
          type: 'line',
          source: RAIL_SOURCE,
          filter: ['in', ['get', 'status'], ['literal', ov.statuses]],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: ov.defaultVisible ? 'visible' : 'none',
          },
          paint: {
            'line-color': ov.color,
            'line-width': ['interpolate', ['linear'], ['zoom'], 7, ov.width * 0.6, 14, ov.width * 1.6],
            ...(ov.dash ? { 'line-dasharray': ov.dash } : {}),
          },
        });
      }

      // Crossing points render above the line layers (added after them).
      for (const ordc of ORDC_LAYERS) {
        if (ordc.kind !== 'point') continue;
        const pc = ordc.pointColorField;
        map.addLayer({
          id: ordc.key,
          type: 'circle',
          source: ordc.key,
          layout: { visibility: 'none' },
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 12, 4, 16, 7],
            'circle-color': pc
              ? (['match', ['get', pc.field], ...Object.entries(pc.values).flat(), pc.fallback] as unknown as ExpressionSpecification)
              : ordc.color,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 8, 0.3, 14, 1],
            'circle-opacity': 0.9,
          },
        });
      }

      // Click to inspect: crossing points first (smallest target, drawn on
      // top), then OSM lines, then ORDC lines beneath them.
      const osmLayerIds = RAIL_OVERLAYS.map((o) => o.key);
      const ordcPointIds = ORDC_LAYERS.filter((o) => o.kind === 'point').map((o) => o.key);
      const ordcLineIds = ORDC_LAYERS.filter((o) => o.kind === 'line').map((o) => o.key);
      const ordcByKey = new Map<string, OrdcLayerDef>(ORDC_LAYERS.map((o) => [o.key, o]));
      const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '320px' });
      map.on('click', (e) => {
        for (const layers of [ordcPointIds, osmLayerIds, ordcLineIds]) {
          const feats = map.queryRenderedFeatures(e.point, { layers });
          if (!feats.length) continue;
          const feat = feats[0];
          const def = ordcByKey.get(feat.layer.id);
          const html = def
            ? ordcPopupHtml(def, feat.properties)
            : railPopupHtml(feat.properties);
          popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
          return;
        }
      });
      for (const id of [...osmLayerIds, ...ordcPointIds, ...ordcLineIds]) {
        map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
      }

      setReady(true);
      onMapReady(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // onMapReady is stable enough for our purposes; intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Apply the selected basemap ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const tiles = basemap.tiles ?? dynamicTiles;
    if (!tiles) return; // dynamic tiles not resolved yet (e.g. wayback list loading)

    if (map.getLayer(BASEMAP_LAYER)) map.removeLayer(BASEMAP_LAYER);
    if (map.getSource(BASEMAP_SOURCE)) map.removeSource(BASEMAP_SOURCE);

    map.addSource(BASEMAP_SOURCE, {
      type: 'raster',
      tiles,
      tileSize: 256,
      maxzoom: dynamicMaxzoom ?? basemap.maxzoom,
      attribution: basemap.attribution,
    });

    // Keep the basemap at the very bottom (below reference + rail).
    const firstLayer = map.getStyle().layers[0]?.id;
    map.addLayer(
      { id: BASEMAP_LAYER, type: 'raster', source: BASEMAP_SOURCE },
      firstLayer,
    );
  }, [ready, basemap, dynamicTiles, dynamicMaxzoom]);

  // ---- Toggle the reference (roads/labels) overlay ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const exists = map.getSource(REFERENCE_SOURCE);
    if (showReference && !exists) {
      map.addSource(REFERENCE_SOURCE, {
        type: 'raster',
        tiles: REFERENCE_OVERLAY.tiles,
        tileSize: 256,
        maxzoom: REFERENCE_OVERLAY.maxzoom,
        attribution: REFERENCE_OVERLAY.attribution,
      });
      // Above basemap, below the lowest rail line layer (ORDC layers sit
      // beneath the OSM overlays).
      const beforeId = [...ORDC_LAYERS, ...RAIL_OVERLAYS].find((o) => map.getLayer(o.key))?.key;
      map.addLayer({ id: REFERENCE_LAYER, type: 'raster', source: REFERENCE_SOURCE }, beforeId);
    } else if (!showReference && exists) {
      if (map.getLayer(REFERENCE_LAYER)) map.removeLayer(REFERENCE_LAYER);
      map.removeSource(REFERENCE_SOURCE);
    }
  }, [ready, showReference]);

  // ---- Push rail data into the source ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource(RAIL_SOURCE) as maplibregl.GeoJSONSource | undefined;
    src?.setData(railData);
  }, [ready, railData]);

  // ---- Apply overlay visibility ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const ov of RAIL_OVERLAYS) {
      if (!map.getLayer(ov.key)) continue;
      const visible = overlayVisibility[ov.key] ?? ov.defaultVisible;
      map.setLayoutProperty(ov.key, 'visibility', visible ? 'visible' : 'none');
    }
  }, [ready, overlayVisibility]);

  // ---- Push ORDC data into sources ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const ordc of ORDC_LAYERS) {
      const fc = ordcData[ordc.key];
      if (!fc) continue;
      const src = map.getSource(ordc.key) as maplibregl.GeoJSONSource | undefined;
      src?.setData(fc);
    }
  }, [ready, ordcData]);

  // ---- Apply ORDC visibility ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const ordc of ORDC_LAYERS) {
      if (!map.getLayer(ordc.key)) continue;
      const visible = ordcVisibility[ordc.key] ?? false;
      map.setLayoutProperty(ordc.key, 'visibility', visible ? 'visible' : 'none');
    }
  }, [ready, ordcVisibility]);

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map-container" />
      {geoError && (
        <div className="geo-error" role="status">
          {geoError}
          <button aria-label="Dismiss" onClick={() => setGeoError(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function railPopupHtml(props: Record<string, unknown> | null): string {
  if (!props) return '';
  const rows: [string, string][] = [];
  const add = (label: string, val: unknown) => {
    if (val !== null && val !== undefined && val !== '') rows.push([label, esc(String(val))]);
  };
  add('Name', props.name);
  add('Status', props.status);
  add('OSM railway', props.railway);
  add('Operator', props.operator);
  add('Former operator', props.old_railway_operator);
  add('Usage', props.usage);
  add('Ref', props.ref);
  add('Opened', props.start_date);
  add('Closed', props.end_date);

  const body = rows
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
    .join('');
  const osmLink = props.id
    ? `<a href="https://www.openstreetmap.org/way/${props.id}" target="_blank" rel="noopener">View on OpenStreetMap →</a>`
    : '';
  return `<div class="rail-popup"><table>${body}</table>${osmLink}</div>`;
}

function ordcPopupHtml(def: OrdcLayerDef, props: Record<string, unknown> | null): string {
  if (!props) return '';
  const rows = def.popupFields
    .filter(
      ([field]) => props[field] !== null && props[field] !== undefined && props[field] !== '',
    )
    .map(([field, label]) => `<tr><th>${label}</th><td>${esc(String(props[field]))}</td></tr>`)
    .join('');
  return `<div class="rail-popup"><table>${rows}</table><span class="popup-source">Source: ORDC / ODOT</span></div>`;
}
