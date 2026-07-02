import { BASEMAPS } from '../config/basemaps';
import { RAIL_OVERLAYS } from '../config/railLayers';
import { ORDC_LAYERS } from '../config/ordc';
import type { WaybackRelease } from '../data/wayback';

interface Props {
  basemapId: string;
  onBasemapChange: (id: string) => void;

  isWayback: boolean;
  waybackReleases: WaybackRelease[] | null;
  waybackIndex: number;
  waybackLoading: boolean;
  onWaybackIndexChange: (index: number) => void;

  showReference: boolean;
  onToggleReference: (value: boolean) => void;

  overlayVisibility: Record<string, boolean>;
  onToggleOverlay: (key: string, value: boolean) => void;

  ordcVisibility: Record<string, boolean>;
  ordcLoading: Record<string, boolean>;
  ordcError: Record<string, string>;
  onToggleOrdc: (key: string, value: boolean) => void;

  onLoadRail: () => void;
  railLoading: boolean;
  railMessage: string;
  railCount: number;
}

export function Sidebar(props: Props) {
  const {
    basemapId,
    onBasemapChange,
    isWayback,
    waybackReleases,
    waybackIndex,
    waybackLoading,
    onWaybackIndexChange,
    showReference,
    onToggleReference,
    overlayVisibility,
    onToggleOverlay,
    ordcVisibility,
    ordcLoading,
    ordcError,
    onToggleOrdc,
    onLoadRail,
    railLoading,
    railMessage,
    railCount,
  } = props;

  const activeBasemap = BASEMAPS.find((b) => b.id === basemapId);
  const current = waybackReleases?.[waybackIndex];

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Ohio Rail Atlas</h1>
        <p className="tagline">Active &amp; abandoned railroads · historical imagery</p>
      </header>

      <section className="panel">
        <h2>Base imagery</h2>
        <div className="radio-list">
          {BASEMAPS.map((b) => (
            <label key={b.id} className="radio-row">
              <input
                type="radio"
                name="basemap"
                checked={basemapId === b.id}
                onChange={() => onBasemapChange(b.id)}
              />
              <span>{b.label}</span>
            </label>
          ))}
        </div>
        {activeBasemap?.note && <p className="hint">{activeBasemap.note}</p>}

        {isWayback && (
          <div className="wayback">
            {waybackLoading && <p className="hint">Loading historical imagery dates…</p>}
            {waybackReleases && waybackReleases.length > 0 && (
              <>
                <div className="wayback-date">
                  <span className="wayback-label">Capture release</span>
                  <strong>{current?.date}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={waybackReleases.length - 1}
                  value={waybackIndex}
                  onChange={(e) => onWaybackIndexChange(Number(e.target.value))}
                />
                <div className="wayback-ends">
                  <span>{waybackReleases[waybackReleases.length - 1]?.date}</span>
                  <span>{waybackReleases[0]?.date}</span>
                </div>
                <p className="hint">
                  Slide to step through every released version of the World Imagery mosaic, newest
                  on the right.
                </p>
              </>
            )}
          </div>
        )}

        <label className="check-row reference-toggle">
          <input
            type="checkbox"
            checked={showReference}
            onChange={(e) => onToggleReference(e.target.checked)}
          />
          <span>Overlay roads &amp; place labels</span>
        </label>
      </section>

      <section className="panel">
        <h2>Official ORDC layers</h2>
        <div className="check-list">
          {ORDC_LAYERS.map((l) => (
            <label key={l.key} className="check-row" title={l.description}>
              <input
                type="checkbox"
                checked={ordcVisibility[l.key] ?? false}
                onChange={(e) => onToggleOrdc(l.key, e.target.checked)}
              />
              <span
                className="swatch"
                style={{
                  background: l.dash
                    ? `repeating-linear-gradient(90deg, ${l.color} 0 6px, transparent 6px 10px)`
                    : l.color,
                }}
              />
              <span>
                {l.label}
                {ordcLoading[l.key] && <em className="loading-note"> loading…</em>}
              </span>
            </label>
          ))}
        </div>
        {Object.entries(ordcError)
          .filter(([, msg]) => msg)
          .map(([key, msg]) => (
            <p key={key} className="hint error">
              {msg}
            </p>
          ))}
        <p className="hint">
          Statewide data straight from the Ohio Rail Development Commission's ArcGIS service —
          abandoned lines include abandonment year and right-of-way ownership.
        </p>
      </section>

      <section className="panel">
        <h2>Rail layers (OpenStreetMap)</h2>
        <div className="check-list">
          {RAIL_OVERLAYS.map((ov) => (
            <label key={ov.key} className="check-row" title={ov.description}>
              <input
                type="checkbox"
                checked={overlayVisibility[ov.key] ?? ov.defaultVisible}
                onChange={(e) => onToggleOverlay(ov.key, e.target.checked)}
              />
              <span
                className="swatch"
                style={{
                  background: ov.dash
                    ? `repeating-linear-gradient(90deg, ${ov.color} 0 6px, transparent 6px 10px)`
                    : ov.color,
                }}
              />
              <span>{ov.label}</span>
            </label>
          ))}
        </div>

        <button className="load-btn" onClick={onLoadRail} disabled={railLoading}>
          {railLoading ? 'Loading…' : 'Load rail in this view'}
        </button>
        <p className="hint" aria-live="polite">
          {railMessage || (railCount > 0 ? `${railCount} segments loaded.` : 'Pan/zoom to an area, then load.')}
        </p>
      </section>

      <footer className="sidebar-footer">
        <p>
          Rail data: live from{' '}
          <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">
            OpenStreetMap
          </a>{' '}
          via Overpass.
        </p>
        <p>
          <a
            href="https://github.com/chrisbues/ohio_abandoned_rails/blob/main/docs/DATA_SOURCES.md"
            target="_blank"
            rel="noopener"
          >
            OSINT data sources &amp; how to contribute →
          </a>
        </p>
      </footer>
    </aside>
  );
}
