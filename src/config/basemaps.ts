// Base imagery / map layers. All are public XYZ or ArcGIS REST tile services that
// support CORS, so the app stays a pure static frontend with no proxy.

export interface Basemap {
  id: string;
  label: string;
  /**
   * "xyz" = a fixed tile template; "wayback" = Esri historical imagery (template
   * chosen at runtime); "ohio-historical" = Ohio-specific vintage picker below.
   */
  type: 'xyz' | 'wayback' | 'ohio-historical';
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
    id: 'ohio-historical',
    label: 'Ohio Historical (topos & aerials)',
    type: 'ohio-historical',
    attribution:
      'Historical imagery &copy; USGS, USDA, ODNR, State of Ohio',
    maxzoom: 19,
    note: 'Statewide time machine: historic USGS topos, 1988–99 B/W aerials, NAIP 2004–2017, and OSIP leaf-off flights.',
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

// Ohio-specific historical basemaps, oldest first. All are public Web Mercator tile
// caches hosted by ODNR (gis.ohiodnr.gov) and the State of Ohio (maps.ohio.gov),
// verified tile-by-tile. These are the layers where abandoned grades are most visible:
// old topos have the lines drawn on them, and leaf-off/B&W aerials show the scars.
export interface OhioHistoricalLayer {
  id: string;
  label: string;
  /** Approximate vintage, for sorting/labeling. */
  era: string;
  tiles: string[];
  maxzoom: number;
}

const ODNR = 'https://gis.ohiodnr.gov/image/rest/services/OIT_Services';

export const OHIO_HISTORICAL_LAYERS: OhioHistoricalLayer[] = [
  {
    id: 'drg-62500',
    label: 'USGS Topo 1:62,500 (early–mid 1900s)',
    era: '~1900s–1950s',
    tiles: [`${ODNR}/USGS_DRG_MOS_62500/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 17,
  },
  {
    id: 'drg-24000',
    label: 'USGS Topo 1:24,000 (mid–late 1900s)',
    era: '~1950s–1990s',
    tiles: [`${ODNR}/USGS_DRG_MOS_24000_2/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 18,
  },
  {
    id: 'doqq-1988-1999',
    label: 'USGS B/W aerials (1988–1999)',
    era: '1988–1999',
    tiles: [`${ODNR}/USGS_DOQQ_MOS_1988_to_1999/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2004',
    label: 'NAIP 2004 (leaf-on)',
    era: '2004',
    tiles: [`${ODNR}/NAIP_MOS_2004/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2005',
    label: 'NAIP 2005 (leaf-on)',
    era: '2005',
    tiles: [`${ODNR}/NAIP_MOS_2005/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'osip-2006',
    label: 'OSIP 2006 1-ft (leaf-off) ★',
    era: '2006',
    tiles: [`${ODNR}/OSIP_MOS_2006/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'osip-2006-cir',
    label: 'OSIP 2006 color-infrared',
    era: '2006',
    tiles: [`${ODNR}/ODNR_CIR_MOS_2006/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2006',
    label: 'NAIP 2006 (leaf-on)',
    era: '2006',
    tiles: [`${ODNR}/NAIP_MOS_2006/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2009',
    label: 'NAIP 2009 (leaf-on)',
    era: '2009',
    tiles: [`${ODNR}/NAIP_MOS_2009/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2010',
    label: 'NAIP 2010 (leaf-on)',
    era: '2010',
    tiles: [`${ODNR}/NAIP_MOS_2010/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2011',
    label: 'NAIP 2011 (leaf-on)',
    era: '2011',
    tiles: [`${ODNR}/NAIP_MOS_2011/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2013',
    label: 'NAIP 2013 (leaf-on)',
    era: '2013',
    tiles: [`${ODNR}/NAIP_MOS_2013/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2015',
    label: 'NAIP 2015 (leaf-on)',
    era: '2015',
    tiles: [`${ODNR}/NAIP_MOS_2015/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'naip-2017',
    label: 'NAIP 2017 (leaf-on)',
    era: '2017',
    tiles: [`${ODNR}/NAIP_MOS_2017/MapServer/tile/{z}/{y}/{x}`],
    maxzoom: 19,
  },
  {
    id: 'osip-3',
    label: 'OSIP III (~2017–2019, leaf-off)',
    era: '2017–2019',
    tiles: [
      'https://maps.ohio.gov/image/rest/services/osip_3_cache/MapServer/tile/{z}/{y}/{x}',
    ],
    maxzoom: 19,
  },
];

export const DEFAULT_OHIO_HISTORICAL_ID = 'osip-2006';

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
