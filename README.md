# Ohio Rail Atlas

An open-source intelligence (OSINT) mapping tool for **active and abandoned railroads and
rights-of-way in Ohio** — combining live crowd-sourced rail data with current and
**historical satellite imagery** in a single map view.

Knowledge about Ohio's lost rail network is scattered across OpenStreetMap, the Ohio Rail
Development Commission, hobbyist sites, and Facebook groups. This project pulls the
machine-readable pieces into one interactive map and catalogs the rest for research.

## Features

- 🛰 **Multiple base imagery layers** — Esri current satellite, USGS Imagery+Topo, USGS
  Topo, and OpenStreetMap.
- 🕰 **Historical satellite imagery** — scrub through every released version of Esri's
  World Imagery mosaic by capture date (Esri Wayback), to watch grades appear and disappear
  over time.
- 🚂 **Active & abandoned rail overlays** — live from OpenStreetMap/Overpass, classified
  into active, disused, abandoned right-of-way, razed/dismantled, and under-construction,
  each individually toggleable.
- 🔍 **Click any line** to inspect its OSM tags (operator, former operator, open/close
  dates) with a link back to OpenStreetMap.
- 🗺 **Roads & place-label overlay** for context on top of satellite imagery.

It is a **pure static web app** — no backend. All data comes from public APIs and tile
services at runtime, so it deploys for free to GitHub Pages.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [MapLibre GL JS](https://maplibre.org/) for the map
- [Overpass API](https://overpass-api.de/) for live OpenStreetMap rail data
- [Esri Wayback](https://livingatlas.arcgis.com/wayback/) for historical imagery

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check and build to dist/
npm run preview  # preview the production build
```

### Using the map

1. Pick a **base imagery** layer. Choose **Esri Wayback** to reveal a date slider for
   historical imagery.
2. Pan/zoom to an area of interest, then click **Load rail in this view** to pull rail
   features from OpenStreetMap for that viewport.
3. Toggle the **rail layers** to isolate abandoned rights-of-way, and click any line for
   its details.

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Enable Pages in the repo
settings with **Source: GitHub Actions**. The app is served from
`/ohio_abandoned_rails/` (configured in `vite.config.ts`).

## Data sources & roadmap

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for the full catalog of rail and imagery
sources — what's integrated, what's embeddable, and what's manual-research-only — plus
candidate next integrations (curated ROW dataset, Ohio OSIP leaf-off orthoimagery, USGS
historical topo quads, FRA active network).

## Contributing

The fastest way to improve coverage is to refine rail features directly in
**OpenStreetMap** — those edits flow straight into this map. See the data-sources doc for
details.

## License & attribution

Imagery and data are © their respective providers (OpenStreetMap contributors, Esri,
Maxar, USGS) and used under their public terms; attribution is shown on the map.
