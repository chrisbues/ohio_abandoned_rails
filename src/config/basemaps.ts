// Base imagery / map layers. All are public XYZ or ArcGIS REST tile services that
// support CORS, so the app stays a pure static frontend with no proxy.

export interface Basemap {
  id: string;
  label: string;
  /** "xyz" = a fixed tile template; "wayback" = Esri historical imagery, template chosen at runtime. */
  type: 'xyz' | 'wayback';
  tiles?: string[];
  attribution: string;
  maxzoom: number;
  /** Short note shown under the picker. */
  note?: string;
}

export const BASEMAPS: Basemap[] = [
  {
    id: 'esri-imagery',
    label: 'Esri Satellite (current)',
    type: 'xyz',
    tiles: [
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
    maxzoom: 19,
    note: 'Most recent high-resolution aerial mosaic.',
  },
  {
    id: 'wayback',
    label: 'Esri Wayback (historical satellite)',
    type: 'wayback',
    attribution: 'Esri Wayback Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxzoom: 19,
    note: 'Scrub through past versions of the World Imagery mosaic by capture date.',
  },
  {
    id: 'osip',
    label: 'Ohio OSIP Imagery (statewide)',
    type: 'xyz',
    tiles: [
      'https://maps.ohio.gov/image/rest/services/osip_most_current_cache/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: 'Imagery &copy; State of Ohio / OGRIP OSIP',
    maxzoom: 19,
    note: "Ohio Statewide Imagery Program — the state's own high-resolution orthophotos.",
  },
  {
    id: 'usgs-imagery-topo',
    label: 'USGS Imagery + Topo',
    type: 'xyz',
    tiles: [
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: 'USGS The National Map',
    maxzoom: 16,
    note: 'Aerial imagery with topographic labels overlaid.',
  },
  {
    id: 'usgs-topo',
    label: 'USGS Topo',
    type: 'xyz',
    tiles: [
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: 'USGS The National Map',
    maxzoom: 16,
    note: 'Modern USGS topographic quadrangles — abandoned grades often still drawn.',
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    type: 'xyz',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '&copy; OpenStreetMap contributors',
    maxzoom: 19,
    note: 'Street map for orientation.',
  },
];

export const DEFAULT_BASEMAP_ID = 'esri-imagery';

// Optional semi-transparent reference layer (roads, boundaries, place names) that can be
// drawn on top of satellite imagery for context.
export const REFERENCE_OVERLAY = {
  id: 'esri-transportation',
  label: 'Roads & place labels',
  tiles: [
    'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
  ],
  attribution: '&copy; Esri',
  maxzoom: 19,
};
