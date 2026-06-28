// Esri "Wayback" historical imagery. A single public JSON config lists every released
// version of the World Imagery mosaic, each with its own tile template. We turn that into a
// date-sorted list the user can scrub through.

const WAYBACK_CONFIG_URL =
  'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json';

export interface WaybackRelease {
  releaseNum: number;
  /** ISO date (YYYY-MM-DD) parsed from the item title. */
  date: string;
  /** Tile template with {z}/{y}/{x} placeholders, ready for MapLibre. */
  template: string;
}

interface WaybackConfigEntry {
  itemTitle?: string;
  itemURL?: string;
}

let cache: WaybackRelease[] | null = null;

/** Load and cache the list of Wayback releases, newest first. */
export async function loadWaybackReleases(): Promise<WaybackRelease[]> {
  if (cache) return cache;

  const res = await fetch(WAYBACK_CONFIG_URL);
  if (!res.ok) throw new Error(`Wayback config ${res.status}`);
  const json = (await res.json()) as Record<string, WaybackConfigEntry>;

  const releases: WaybackRelease[] = [];
  for (const [num, entry] of Object.entries(json)) {
    if (!entry.itemURL) continue;
    const match = entry.itemTitle?.match(/(\d{4}-\d{2}-\d{2})/);
    const date = match ? match[1] : (entry.itemTitle ?? num);
    const template = entry.itemURL
      .replace('{level}', '{z}')
      .replace('{row}', '{y}')
      .replace('{col}', '{x}');
    releases.push({ releaseNum: Number(num), date, template });
  }

  releases.sort((a, b) => b.date.localeCompare(a.date));
  cache = releases;
  return releases;
}
