# Ohio Rail Atlas — Data Sources & OSINT Reference

This project pulls together scattered information about Ohio's active and abandoned
railroads. This document catalogs the sources worth integrating, what each provides,
and how/whether it can be wired into the app.

## Legend

- 🟢 **Integrated** — already used by the app
- 🟡 **Embeddable** — public tiles/API with CORS; can be added as a layer
- 🔵 **Reference** — useful for manual research / curation, not directly embeddable
- 🔴 **Restricted** — paywalled, login-walled, or licensing prevents redistribution

---

## Rail line & right-of-way data

| Source | Status | Notes |
| --- | --- | --- |
| **OpenStreetMap** (`railway=rail/abandoned/disused/razed/construction`) via [Overpass API](https://overpass-api.de/) | 🟢 | Primary live source. Tags often include `name`, `operator`, `old_railway:operator`, `start_date`, `end_date`. The single richest crowd-sourced abandoned-rail dataset. |
| **FRA National Rail Network** ([BTS / DOT](https://geodata.bts.gov/datasets/usdot::north-american-rail-network-lines)) | 🟡 | Authoritative *active* network as a feature service / shapefile. Good cross-check for current lines and owners (railroad RROWNER fields). |
| **USGS National Map — Transportation (TNM)** | 🟡 | Rail features in the National Map; abandoned grades sometimes retained. |
| **Ohio Rail Development Commission (ORDC) Rail Map services** | 🟢 | The [ORDC Rail Map](https://gis3.dot.state.oh.us/OhioRail/) is backed by a public ArcGIS REST service (`odotgis.dot.state.oh.us/arcgis/rest/services/RAIL/Rail_WebMap/MapServer`) with CORS + GeoJSON support. Layer 5 = **Abandoned Rail Lines** (~2,600 segments, with `ABANDONMENT_YEAR`, `ROW_OWNER1/2`, `HERITAGE_RR`); layer 2 = **Active Rail Lines** (operator, STB class, trains/day, Amtrak). Integrated as toggleable statewide overlays. |
| **ODOT Railroad Crossing Inventory** (`tims.dot.state.oh.us/ags/rest/services/Assets/Rail_Crossing_Inventory`) | 🟡 | Point layer of grade crossings from the same webmap; candidate future overlay. |
| **USGS Historical Topographic Maps** ([topoView](https://ngmdb.usgs.gov/topoview/)) | 🟡 | Scanned quads back to the 1880s; abandoned lines appear as they existed. Available as georeferenced layers. |
| **Abandoned Rails / abandonedrails.com** | 🔵 | Community-curated line histories by state. Good for narrative + endpoints. |
| **Wikipedia "List of Ohio railroads" / defunct railroads** | 🔵 | Company lineage, merger history, reporting marks. |
| **Local Facebook groups & forums** | 🔵 | Eyewitness ROW status, photos. Manual, unstructured — candidate for a curated notes layer. |

## Historical & current imagery

| Source | Status | Notes |
| --- | --- | --- |
| **Esri Wayback Imagery** | 🟢 | Every released version of the World Imagery mosaic, scrubbable by date. Config: `https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json`. |
| **Esri World Imagery (current)** | 🟢 | Latest high-res aerial mosaic. |
| **USGS Imagery Topo / USGS Topo** | 🟢 | National Map basemaps; topo labels over imagery. |
| **OSIP (Ohio Statewide Imagery Program)** most-current cache (`maps.ohio.gov/image/rest/services/osip_most_current_cache`) | 🟢 | The state's own high-res orthophotos as a standard Web Mercator tile cache; integrated as a basemap. Historical OSIP flights (2006/2007 leaf-off is excellent for spotting grades) remain 🟡 candidates. |
| **USGS EarthExplorer** ([earthexplorer.usgs.gov](https://earthexplorer.usgs.gov/)) | 🔵 | Historical aerial photography (1930s+), declassified satellite. Download + georeference workflow. |
| **NETR Historic Aerials** ([historicaerials.com](https://www.historicaerials.com/)) | 🔴 | Excellent historical aerials/topos but commercial; not redistributable. Good manual cross-reference. |
| **Google Earth Pro historical imagery** | 🔴 | Best-in-class time slider but not embeddable via terms. Manual reference. |

## How the app currently uses these

- **Official ORDC layers** — statewide **Abandoned Rail Lines** and **Active Rail
  Lines** fetched as GeoJSON straight from the ORDC/ODOT ArcGIS service, with
  per-segment popups (abandonment year, ROW ownership, operator, STB class).
- **Rail overlays** are fetched live from **OpenStreetMap/Overpass** for the current
  map viewport (the "Load rail in this view" button), classified into active, disused,
  abandoned, razed, and construction.
- **Base imagery** offers Esri current satellite, **Esri Wayback** (historical, with a
  date slider), **Ohio OSIP statewide orthos**, USGS Imagery+Topo, USGS Topo, and
  OpenStreetMap, plus an optional roads/labels reference overlay.

## Candidate next integrations

1. **Curated ROW dataset** — a project-owned GeoJSON of verified abandoned lines
   (sourced from the references above) layered on top of the live OSM data, with
   provenance/citation per segment.
2. **OSIP leaf-off historical orthoimagery** as an additional Ohio-specific imagery layer.
3. **USGS topoView** historical quads as a time-sliderable overlay.
4. **FRA active network** as an authoritative comparison layer with owner attribution.
5. **Statewide bulk OSM load** cached to a static file so the whole state renders without
   per-view Overpass calls.

## Contributing data

The fastest way to improve coverage today is to add/refine rail features in
**OpenStreetMap** itself (e.g. tagging a lifted line `railway=abandoned` with
`old_railway:operator`, `start_date`, `end_date`) — those edits flow straight into this
map. For project-owned curated data, see issue tracker.
