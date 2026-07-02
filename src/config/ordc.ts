// Official ORDC/ODOT rail layers, discovered from the ORDC Rail Map web app
// (https://gis3.dot.state.oh.us/OhioRail/ → ohiodot.maps.arcgis.com webmap
// 3a331ef52697477dbed0bf41c536b79d). The underlying ArcGIS REST service supports
// GeoJSON output and CORS, so a static frontend can query it directly.

export const ORDC_SERVICE_BASE =
  'https://odotgis.dot.state.oh.us/arcgis/rest/services/RAIL/Rail_WebMap/MapServer';

export interface OrdcLayerDef {
  /** Stable key; also the MapLibre source/layer id. */
  key: string;
  label: string;
  /** Layer id within the MapServer. */
  layerId: number;
  /** Fields to request (keeps the statewide payload small). */
  outFields: string[];
  color: string;
  width: number;
  dash: [number, number] | null;
  description: string;
}

export const ORDC_LAYERS: OrdcLayerDef[] = [
  {
    key: 'ordc-abandoned',
    label: 'ORDC Abandoned Rail Lines',
    layerId: 5,
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
    color: '#d264d2',
    width: 2.5,
    dash: [2, 1.5],
    description:
      'Official ORDC abandoned lines (~2,600 segments) with abandonment year and right-of-way ownership.',
  },
  {
    key: 'ordc-active',
    label: 'ORDC Active Rail Lines',
    layerId: 2,
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
    color: '#00c2b8',
    width: 2.5,
    dash: null,
    description:
      'Official ODOT/ORDC active network (~2,100 segments) with operator, STB class, and train volume.',
  },
];

export const ORDC_ATTRIBUTION =
  'Rail lines &copy; Ohio Rail Development Commission / ODOT';

/** Human labels for the ORDC fields shown in popups, in display order. */
export const ORDC_POPUP_FIELDS: [string, string][] = [
  ['LINE_NAME', 'Line'],
  ['RR_NAME', 'Railroad'],
  ['RR_PARENT_COMPANY', 'Parent company'],
  ['PRIMARY_OPERATOR', 'Operator'],
  ['OPERATIONAL_STATUS', 'Status'],
  ['ABANDONMENT_YEAR', 'Abandoned'],
  ['ROW_OWNER1', 'ROW owner'],
  ['ROW_OWNER2', 'ROW owner 2'],
  ['ROW_OWNER_ENTITY', 'ROW owner type'],
  ['HERITAGE_RR', 'Heritage RR'],
  ['RR_STB_CLASS', 'STB class'],
  ['TRAINS_PER_DAY', 'Trains/day'],
  ['FREIGHT_VOLUME', 'Freight volume'],
  ['AMTRAK_SERVICE', 'Amtrak'],
  ['LINE_TYPE', 'Line type'],
  ['COUNTY', 'County'],
];
