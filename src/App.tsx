import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import { MapView } from './map/MapView';
import { Sidebar } from './components/Sidebar';
import { BASEMAPS, DEFAULT_BASEMAP_ID } from './config/basemaps';
import { RAIL_OVERLAYS } from './config/railLayers';
import { boundsAreaDeg, fetchRail, type MapBounds, type RailCollection } from './data/overpass';
import { loadWaybackReleases, type WaybackRelease } from './data/wayback';
import { ORDC_LAYERS } from './config/ordc';
import { fetchOrdcLayer, type OrdcCollection } from './data/ordc';
import './App.css';

const EMPTY_FC: RailCollection = { type: 'FeatureCollection', features: [] };

// Above this viewport size we ask the user to zoom in before hitting Overpass.
const MAX_LOAD_AREA_DEG = 1.2;

function defaultOverlayVisibility(): Record<string, boolean> {
  return Object.fromEntries(RAIL_OVERLAYS.map((o) => [o.key, o.defaultVisible]));
}

export default function App() {
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP_ID);
  const [showReference, setShowReference] = useState(true);
  const [overlayVisibility, setOverlayVisibility] = useState(defaultOverlayVisibility);

  const [waybackReleases, setWaybackReleases] = useState<WaybackRelease[] | null>(null);
  const [waybackLoading, setWaybackLoading] = useState(false);
  const [waybackIndex, setWaybackIndex] = useState(0);

  const [railData, setRailData] = useState<RailCollection>(EMPTY_FC);
  const [railLoading, setRailLoading] = useState(false);
  const [railMessage, setRailMessage] = useState('');

  const [ordcData, setOrdcData] = useState<Record<string, OrdcCollection | null>>({});
  const [ordcVisibility, setOrdcVisibility] = useState<Record<string, boolean>>({});
  const [ordcLoading, setOrdcLoading] = useState<Record<string, boolean>>({});
  const [ordcError, setOrdcError] = useState<Record<string, string>>({});

  const basemap = useMemo(
    () => BASEMAPS.find((b) => b.id === basemapId) ?? BASEMAPS[0],
    [basemapId],
  );
  const isWayback = basemap.type === 'wayback';

  // Lazily load the Wayback release list the first time historical imagery is selected.
  useEffect(() => {
    if (!isWayback || waybackReleases || waybackLoading) return;
    setWaybackLoading(true);
    loadWaybackReleases()
      .then((releases) => {
        setWaybackReleases(releases);
        setWaybackIndex(0);
      })
      .catch(() => setRailMessage('Could not load historical imagery list.'))
      .finally(() => setWaybackLoading(false));
  }, [isWayback, waybackReleases, waybackLoading]);

  const waybackTemplate =
    isWayback && waybackReleases ? waybackReleases[waybackIndex]?.template ?? null : null;

  const onMapReady = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
  }, []);

  const onToggleOverlay = useCallback((key: string, value: boolean) => {
    setOverlayVisibility((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Toggling an ORDC layer on fetches the statewide dataset on first use.
  const onToggleOrdc = useCallback((key: string, value: boolean) => {
    setOrdcVisibility((prev) => ({ ...prev, [key]: value }));
    if (!value) return;

    const def = ORDC_LAYERS.find((l) => l.key === key);
    if (!def) return;
    setOrdcError((prev) => ({ ...prev, [key]: '' }));
    setOrdcData((prev) => {
      if (prev[key]) return prev; // already loaded
      setOrdcLoading((l) => ({ ...l, [key]: true }));
      fetchOrdcLayer(def)
        .then((fc) => setOrdcData((d) => ({ ...d, [key]: fc })))
        .catch((err) =>
          setOrdcError((e) => ({
            ...e,
            [key]: err instanceof Error ? err.message : 'load failed',
          })),
        )
        .finally(() => setOrdcLoading((l) => ({ ...l, [key]: false })));
      return prev;
    });
  }, []);

  const onLoadRail = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const bounds: MapBounds = {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    };

    if (boundsAreaDeg(bounds) > MAX_LOAD_AREA_DEG) {
      setRailMessage('Zoom in a little before loading — this view is too large to query quickly.');
      return;
    }

    setRailLoading(true);
    setRailMessage('Querying OpenStreetMap…');
    try {
      const fc = await fetchRail(bounds);
      setRailData(fc);
      setRailMessage(
        fc.features.length
          ? `${fc.features.length} rail segments loaded for this view.`
          : 'No mapped rail found in this view.',
      );
    } catch (err) {
      setRailMessage(`Load failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setRailLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <Sidebar
        basemapId={basemapId}
        onBasemapChange={setBasemapId}
        isWayback={isWayback}
        waybackReleases={waybackReleases}
        waybackIndex={waybackIndex}
        waybackLoading={waybackLoading}
        onWaybackIndexChange={setWaybackIndex}
        showReference={showReference}
        onToggleReference={setShowReference}
        overlayVisibility={overlayVisibility}
        onToggleOverlay={onToggleOverlay}
        ordcVisibility={ordcVisibility}
        ordcLoading={ordcLoading}
        ordcError={ordcError}
        onToggleOrdc={onToggleOrdc}
        onLoadRail={onLoadRail}
        railLoading={railLoading}
        railMessage={railMessage}
        railCount={railData.features.length}
      />
      <MapView
        basemap={basemap}
        waybackTemplate={waybackTemplate}
        showReference={showReference}
        overlayVisibility={overlayVisibility}
        railData={railData}
        ordcData={ordcData}
        ordcVisibility={ordcVisibility}
        onMapReady={onMapReady}
      />
    </div>
  );
}
