import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Basemap } from '../config/basemaps';
import { REFERENCE_OVERLAY } from '../config/basemaps';
import { RAIL_OVERLAYS } from '../config/railLayers';
import type { RailCollection } from '../data/overpass';

const BASEMAP_SOURCE = 'basemap';
const BASEMAP_LAYER = 'basemap-layer';
const REFERENCE_SOURCE = 'reference';
const REFERENCE_LAYER = 'reference-layer';
const RAIL_SOURCE = 'rail';

const EMPTY_FC: RailCollection = { type: 'FeatureCollection', features: [] };

interface Props {
  basemap: Basemap;
  /** Tile template to use when basemap.type === 'wayback'. */
  waybackTemplate: string | null;
  showReference: boolean;
  overlayVisibility: Record<string, boolean>;
  railData: RailCollection;
  onMapReady: (map: maplibregl.Map) => void;
}

export function MapView({
  basemap,
  waybackTemplate,
  showReference,
  overlayVisibility,
  railData,
  onMapReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

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
    map.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.on('load', () => {
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

      // Click a rail line to inspect its OSM tags.
      const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '320px' });
      map.on('click', (e) => {
        const feats = map.queryRenderedFeatures(e.point, {
          layers: RAIL_OVERLAYS.map((o) => o.key),
        });
        if (!feats.length) return;
        popup.setLngLat(e.lngLat).setHTML(railPopupHtml(feats[0].properties)).addTo(map);
      });
      map.on('mouseenter', RAIL_OVERLAYS[0].key, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      for (const ov of RAIL_OVERLAYS) {
        map.on('mouseenter', ov.key, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', ov.key, () => (map.getCanvas().style.cursor = ''));
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

    const tiles =
      basemap.type === 'wayback'
        ? waybackTemplate
          ? [waybackTemplate]
          : null
        : basemap.tiles ?? null;
    if (!tiles) return; // wayback releases not loaded yet

    if (map.getLayer(BASEMAP_LAYER)) map.removeLayer(BASEMAP_LAYER);
    if (map.getSource(BASEMAP_SOURCE)) map.removeSource(BASEMAP_SOURCE);

    map.addSource(BASEMAP_SOURCE, {
      type: 'raster',
      tiles,
      tileSize: 256,
      maxzoom: basemap.maxzoom,
      attribution: basemap.attribution,
    });

    // Keep the basemap at the very bottom (below reference + rail).
    const firstLayer = map.getStyle().layers[0]?.id;
    map.addLayer(
      { id: BASEMAP_LAYER, type: 'raster', source: BASEMAP_SOURCE },
      firstLayer,
    );
  }, [ready, basemap, waybackTemplate]);

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
      // Above basemap, below the first rail layer.
      const beforeId = RAIL_OVERLAYS.find((o) => map.getLayer(o.key))?.key;
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

  return <div ref={containerRef} className="map-container" />;
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
