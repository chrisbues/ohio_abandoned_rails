// Rail overlay definitions: how OSM railway features are grouped, toggled, and styled.

export type RailStatus = 'active' | 'disused' | 'abandoned' | 'razed' | 'construction';

/** Maps a raw OSM `railway=*` value to one of our status buckets. */
export function classifyRailway(railway: string): RailStatus | null {
  switch (railway) {
    case 'rail':
    case 'light_rail':
    case 'narrow_gauge':
    case 'subway':
    case 'tram':
    case 'monorail':
    case 'funicular':
    case 'preserved':
      return 'active';
    case 'disused':
      return 'disused';
    case 'abandoned':
      return 'abandoned';
    case 'razed':
    case 'dismantled':
    case 'removed':
      return 'razed';
    case 'construction':
    case 'proposed':
      return 'construction';
    default:
      return null;
  }
}

/** A toggleable overlay group. `statuses` are the buckets it draws. */
export interface RailOverlay {
  /** Stable key used for visibility state and as the MapLibre layer id. */
  key: string;
  label: string;
  statuses: RailStatus[];
  color: string;
  width: number;
  /** Dash pattern in line-widths, or null for a solid line. */
  dash: [number, number] | null;
  defaultVisible: boolean;
  description: string;
}

export const RAIL_OVERLAYS: RailOverlay[] = [
  {
    key: 'active',
    label: 'Active / in-service rail',
    statuses: ['active'],
    color: '#2f81f7',
    width: 3,
    dash: null,
    defaultVisible: true,
    description: 'Track currently used, including heritage and transit lines.',
  },
  {
    key: 'disused',
    label: 'Disused (track in place)',
    statuses: ['disused'],
    color: '#e3b341',
    width: 2.5,
    dash: null,
    defaultVisible: true,
    description: 'Rails still present but out of regular service.',
  },
  {
    key: 'abandoned',
    label: 'Abandoned right-of-way',
    statuses: ['abandoned'],
    color: '#db6d28',
    width: 2.5,
    dash: [2, 1.5],
    defaultVisible: true,
    description: 'Track lifted but the grade/ROW remains in OSM.',
  },
  {
    key: 'razed',
    label: 'Razed / dismantled',
    statuses: ['razed'],
    color: '#f85149',
    width: 2,
    dash: [1, 2],
    defaultVisible: true,
    description: 'Former line whose grade has been built over or erased.',
  },
  {
    key: 'construction',
    label: 'Under construction / proposed',
    statuses: ['construction'],
    color: '#3fb950',
    width: 2.5,
    dash: [3, 2],
    defaultVisible: false,
    description: 'Planned or in-progress lines.',
  },
];
