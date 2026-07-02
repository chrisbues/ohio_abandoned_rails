// Official ODOT/ORDC rail layers, discovered from the ORDC Rail Map web app
// (https://gis3.dot.state.oh.us/OhioRail/ → ohiodot.maps.arcgis.com webmap
// 3a331ef52697477dbed0bf41c536b79d). The underlying ArcGIS REST services support
// GeoJSON output and CORS, so a static frontend can query them directly.

const RAIL_WEBMAP =
  'https://odotgis.dot.state.oh.us/arcgis/rest/services/RAIL/Rail_WebMap/MapServer';
const CROSSING_INVENTORY =
  'https://tims.dot.state.oh.us/ags/rest/services/Assets/Rail_Crossing_Inventory/MapServer';

export interface OrdcLayerDef {
  /** Stable key; also the MapLibre source/layer id. */
  key: string;
  label: string;
  /** Full REST URL of the layer (service + layer id). */
  layerUrl: string;
  /** Fields to request (keeps the statewide payload small). */
  outFields: string[];
  /** Geometry rendering: polyline or point. */
  kind: 'line' | 'point';
  color: string;
  width: number;
  dash: [number, number] | null;
  /** For point layers: map a property to per-value colors. */
  pointColorField?: { field: string; values: Record<string, string>; fallback: string };
  /** [fieldName, displayLabel] pairs shown in the click popup, in order. */
  popupFields: [string, string][];
  description: string;
}

export const ORDC_LAYERS: OrdcLayerDef[] = [
  {
    key: 'ordc-abandoned',
    label: 'ORDC Abandoned Rail Lines',
    layerUrl: `${RAIL_WEBMAP}/5`,
    outFields: [
      'RR_NAME',
      'RR_PARENT_COMPANY',
      'LINE_NAME',
      'ABANDONMENT_YEAR',
      'ROW_OWNER1',
      'ROW_OWNER2',
      'ROW_OWNER_ENTITY',
      'HERITAGE_RR',
      'COUNTY',
      'OPERATIONAL_STATUS',
      'OBJECTID',
    ],
    kind: 'line',
    color: '#d264d2',
    width: 2.5,
    dash: [2, 1.5],
    popupFields: [
      ['LINE_NAME', 'Line'],
      ['RR_NAME', 'Railroad'],
      ['RR_PARENT_COMPANY', 'Parent company'],
      ['OPERATIONAL_STATUS', 'Status'],
      ['ABANDONMENT_YEAR', 'Abandoned'],
      ['ROW_OWNER1', 'ROW owner'],
      ['ROW_OWNER2', 'ROW owner 2'],
      ['ROW_OWNER_ENTITY', 'ROW owner type'],
      ['HERITAGE_RR', 'Heritage RR'],
      ['COUNTY', 'County'],
    ],
    description:
      'Official ORDC abandoned lines (~2,600 segments) with abandonment year and right-of-way ownership.',
  },
  {
    key: 'ordc-active',
    label: 'ORDC Active Rail Lines',
    layerUrl: `${RAIL_WEBMAP}/2`,
    outFields: [
      'RR_NAME',
      'RR_PARENT_COMPANY',
      'LINE_NAME',
      'PRIMARY_OPERATOR',
      'RR_STB_CLASS',
      'TRAINS_PER_DAY',
      'FREIGHT_VOLUME',
      'AMTRAK_SERVICE',
      'COUNTY',
      'LINE_TYPE',
      'OBJECTID',
    ],
    kind: 'line',
    color: '#00c2b8',
    width: 2.5,
    dash: null,
    popupFields: [
      ['LINE_NAME', 'Line'],
      ['RR_NAME', 'Railroad'],
      ['RR_PARENT_COMPANY', 'Parent company'],
      ['PRIMARY_OPERATOR', 'Operator'],
      ['RR_STB_CLASS', 'STB class'],
      ['TRAINS_PER_DAY', 'Trains/day'],
      ['FREIGHT_VOLUME', 'Freight volume'],
      ['AMTRAK_SERVICE', 'Amtrak'],
      ['LINE_TYPE', 'Line type'],
      ['COUNTY', 'County'],
    ],
    description:
      'Official ODOT/ORDC active network (~2,100 segments) with operator, STB class, and train volume.',
  },
  {
    key: 'odot-crossings',
    label: 'Railroad Crossings (ODOT inventory)',
    layerUrl: `${CROSSING_INVENTORY}/0`,
    outFields: [
      'DOT_CROSSING_INVENTORY_NUMBER',
      'CROSSING_STATUS',
      'PRIMARY_OPERATING_RAILROAD',
      'STREET_NAME',
      'CITY_OR_MUNICIPALITY',
      'COUNTY',
      'BRANCH_OR_LINE_NAME',
      'CROSSING_TYPE',
      'CROSSING_POSITION',
      'CROSSING_PURPOSE',
      'OBJECTID',
    ],
    kind: 'point',
    color: '#58a6ff',
    width: 0,
    dash: null,
    pointColorField: {
      field: 'CROSSING_STATUS',
      values: { Open: '#58a6ff', Closed: '#f85149' },
      fallback: '#9198a1',
    },
    popupFields: [
      ['STREET_NAME', 'Street'],
      ['CITY_OR_MUNICIPALITY', 'City'],
      ['COUNTY', 'County'],
      ['CROSSING_STATUS', 'Status'],
      ['PRIMARY_OPERATING_RAILROAD', 'Railroad'],
      ['BRANCH_OR_LINE_NAME', 'Line'],
      ['CROSSING_TYPE', 'Type'],
      ['CROSSING_POSITION', 'Position'],
      ['CROSSING_PURPOSE', 'Purpose'],
      ['DOT_CROSSING_INVENTORY_NUMBER', 'DOT crossing #'],
    ],
    description:
      'All ~8,500 inventoried grade crossings. Blue = open, red = closed — closed crossings pinpoint where lost grades met roads.',
  },
];

export const ORDC_ATTRIBUTION =
  'Rail data &copy; Ohio Rail Development Commission / ODOT';
