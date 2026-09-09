# Xplorr

National live mining and exploration titles from official state registers.

Live: https://nathanfowler.github.io/xplorr/

The public map queries a read-only PostGIS API (`https://xplorr.143.198.52.4.sslip.io`) for open-ground, company search, click identify, viewport titles, and box-pack counts. A quiet **Live / Offline** chip in the header is set from `GET /health` once at load. If the API is down the map says so and falls back to frozen `data/*_live.geojson` packs — it will not quietly call a point open. No API key. CORS allows this GitHub Pages origin and localhost.

The map is a black canvas with a white Australia coastline (`data/australia_coast.geojson`, Natural Earth 50m linework — no filled continent, no OSM by default). Chrome is black / grey / white. Saturated colour is reserved for data layers: live titles electric cyan, gold occurrences gold, other occurrences magenta, holes lime, reports orange, geology a spectrum only when that layer is on. Streets / OSM is an optional dimmed layer at the bottom of the list.

The left rail is one always-visible toggle list (~240px), grouped by theme — Base, Titles, Land, Occurrences, Drilling, Geology, Reports, Geochem, Geophysics — not by state. Each row has a colour swatch; Streets sits at the bottom, off. A quiet **Filter layers** field hides unmatched rows (prefix match). Find still searches titles and companies. Open ground and Box pack are compact toggles. My ground and long notes sit under **More**. First paint is black + white Australia + live titles (zoom-gated). Everything else is a click — holes, geochem, reports, occurrences, and land overlays are not fetched until that layer is on. On small screens the rail collapses to a Layers button and the map goes full-bleed black.

## Land

Official overlays only, off until ticked. ABARES / ACLUMP Land tenure of Australia 2020–21 (Level 3, 250 m ImageServer, CC BY 4.0) is remapped per class: private freehold, Crown pastoral, Crown other, parks / conservation, multiple-use public forest, unresolved / no data. Native title determination outcomes and ILUAs are NNTT WMS layers (CC BY 4.0), filtered by `DETOUTCOME`. These are rights overlays, not titles, and the raster is not a lot boundary. There is no public Level 4 ImageServer for Indigenous land *grants*; click-identify reports the L4 class on the Level 3 pixels when it is an Indigenous tenure variant. CAPAD was skipped (no public WMS added). Do not read Land as open or claimable.

Find company names (BHP, Rio, `?company=`, `?vs=`) against the full national register, not only the static pack. Title-number search can also use `/v1/titles?q=`. The open-ground legal disclaimer is on the identify popup, not in the rail. Empty popup fields and a few missing layers are clearly marked **DEMO**, not real. Features with `commercial_use=false` (WA MINEDEX / BY-NC) say so on the card.

## Geology

- **Geology** — one rail toggle loads kind polygons (`data/geology_kinds.geojson`, ~14.7 MB) and an optional formation / unit search. The 13 kind checkboxes stay off the main list (all on once Geology is on).
- **Quaternary / cover vs basement** — derived at load from existing attributes only. Cover = `kind` alluvium / other_regolith, or unit names with NSW `Q…` / `CZ…` codes or the words Quaternary / Holocene / Pleistocene / alluvium. Named basement eras (Permian, Archaean, …) are basement. Units with no age in the source stay **unclassified** and show only when both toggles are on — they are not labelled basement. **WA and ACT** have no kind polygons (GA raster only).
- **GA surface geology** — Geoscience Australia Surface Geology WMTS raster (all states, including WA/ACT), parked under **More**. Click identify via WMS GetFeatureInfo when the raster is on and no title/kind polygon is under the cursor.

Filterable kinds: granite, felsic_volcanic, mafic_volcanic, mafic_intrusive, ultramafic, sandstone, mudstone, carbonate, metamorphic, alluvium, other_regolith, mixed, other.

Coverage: NSW, QLD, VIC, TAS, NT, SA. NSW uses the simplified 1:1.5M rock-units pack, not the 1.7 GB detailed dump.

Popup fields: state, kind, age split, unit name, source field.

Geology draws under titles so title clicks stay first.


## Mineral type

Rail checkboxes from the existing occurrence `comm` field — types were not invented. Sorted by real `occ.json` counts. The six most common sit in the rail (Gold, Other, Construction, Silver, Copper, Tin); the rest are behind **See more**.

Filter list (16): gold, copper, silver, iron, lead, zinc, tin, nickel, coal, lithium, uranium, manganese, tungsten, diamond, construction (sand / gravel / aggregate), other (rare, unknown, industrial).

Applies to **occurrences only**. Ticking a commodity turns occurrences on and loads them. Title polygons have no commodity field. Multi-commodity points stay visible if any selected type matches. All commodities start off. Named and sized sites show first; unnamed historic workings appear when you zoom in.

## Occurrences

Mineral occurrences / mines (`data/occ.json`, occ-v2 slim pack). Off until a commodity is ticked. At continent / wide zoom they draw as a per-mineral MapLibre heatmap (saturated hues on black — no grey ramps). Only selected heat layers are on, so Gold + Copper stay two colours. Two or more ticks add a small on-map swatch key. Clusters are used only for a single commodity; mixed selections show coloured points from about zoom 7.5. Unnamed historic workings from zoom 11. **WA MINEDEX is CC BY-NC 4.0.**

Commodity filters (including gold) plot **named / size MINOR+ / real production** sites first. Unnamed and UNKNOWN historic workings stay off until zoom 11 and draw smaller. Cluster click opens a short named-site list; a row opens the full card. Zoom-in remains a secondary control.

Real harvest extras on the card when present: field/district, workings, host, deposit style, size, production (never `-999` / blank), source id, portal URL (only if the harvest already has one — WA MINEDEX `web_link`). Empty stays empty on real rows. DEMO fill is only for `demo: true` SA preview points.

Cards also join **nearby live titles** (polygon under the point, else ~3 km) and `reports_index` the same way hex report links do — tenement / name / company, official harvest URLs only.

| State | Points | Source |
| --- | ---: | --- |
| NSW | 30,898 | GSNSW `mineral_occurrence` |
| VIC | 18,792 | GSV `minsite` |
| WA | 48,402 | DMIRS MINEDEX (CC BY-NC) |
| TAS | 8,297 | MRT mineral occurrences |
| NT | 3,522 | NTGS occurrences + mine sites |
| QLD | 22,242 | GSQ MiningResources MINOCC + coal + petroleum |
| SA | 120 DEMO | preview-only points (`demo: true`); not harvested |

## Drillholes

~20 km hex density (`data/holes_hex.geojson`, 4,776 cells). Rebuilt from the harvest with real per-cell aggregates: count, depth min/max/median, year range, top types, operators, commodities, example hole IDs. Raw collars stay out of the repo. Click a hex for an identify-style card. Two QLD cells are DEMO.

| State | Raw collars binned |
| --- | ---: |
| WA | 3,436,952 |
| NSW | 529,290 |
| NT | 328,961 |
| SA | 200,213 |
| VIC | 148,290 |
| TAS | 39,760 |
| QLD | 0 harvested (2 DEMO hexes) |

## Geochem

Same hex size (`data/geochem_hex.geojson`, 2,569 cells) with the same style of real aggregates where the harvest has type / company / year / element fields. The hex **type % split** (`top_types`, e.g. `SOIL 100%`) stays on the card.

Click a cell for a sample table built only from real columns: example `sample_ids`, element names (`top_commodities` when present), type %, year, depth min/max/median. Assay **values / units / methods** are shown only if `GET /v1/geochem?bbox=` exists on the live API. The public OpenAPI (2026-09-09) does not expose that path — the UI says so and does not invent numbers. **Download CSV** on the hex card and in Box pack writes those same real rows for the cell or AOI bbox.

**Element heats** (Au, Cu, Pb, Zn, Ag, Fe, Ni, Co, U, Li) use hex cells whose `top_commodities` contains that symbol. Weight is the real hex sample count `n`, not an interpolated assay. A heat needs at least 40 such cells; Li is below that and shows an empty state. VIC place names in `top_commodities` are not treated as elements.

Harvest point counts in the overlay manifest (not in this repo as points): NSW 2.4M, NT 1.1M, TAS 0.79M, SA 0.46M, VIC 56k. No QLD or WA geochem pack in the harvest.

The droplet API lives **outside this repo**. Drop-in routes and the exact files to patch are in [`api/README.md`](api/README.md) (`GET /v1/geochem`, `GET /v1/geophysics`). Until those are mounted the map keeps hex / GA fallbacks.

## Geophysics

Rail toggles for **Magnetics / Gravity / Radiometrics** load Geoscience Australia GADDS WMS survey **footprints** (`gadds:geophysical_datasets_*` at `https://services.ga.gov.au/gis/geophysical-surveys/wms`). These are official coverage polygons, not imagery drapes. MinView WMS rasters are not wired. Box pack asks `/v1/geophysics` first, then GA GetFeatureInfo. The public API still 404s that path until the droplet patch in `api/` is deployed.

## Omitted on purpose

- Harvest corpus (~15 GB) is not in this repo.
- NSW 1.7 GB detailed geology, 89 province zips, VIC geol100 / sg 250k, GA 1:2.5M shapefile — kinds + GA WMTS already cover geology.
- WA dead titles (~510k) still omitted.

## Usefulness (2026-08-20)

Map-side tools. Harvest report catalogues stay out of this repo; only a slim join index and title-centroid overlay are shipped.

1. **Hex click-through** — hole/geochem identify cards add report links (title, year, official portal URL). WAMEX rows use `ReportDetails?ANumber=` (the harvest stored only the portal home). NSW DIGS keeps `/report/{id}` from the harvest; GSQ keeps the CKAN dataset UUID (or `/data/report/cr…` when the id is a CR number). Hole IDs stay as text unless a real portal URL exists. Joins use tenement IDs extracted from report metadata against live titles already on the map, plus distinctive company tokens vs hex operators / title holders. DEMO cells get no links.
2. **Box pack (AOI v2)** — Box pack button or shift-drag a rectangle. Prefers `/v1/aoi` for title/occurrence/hole counts (hole features are a 25-collar sample, not millions of points). Also lists geochem hexes + CSV, joined reports (catalogue only — files not hosted), and geophysics survey footprints. Open-ground in the pack is a point sample via `/v1/open-ground`.
3. **Hole → geochem** — Hole hex or identify collar looks up hex cells that share a sample/hole ID, or the same ~20 km cell, and `/v1/geochem?hole_id=` when that column exists. No join is invented when keys are absent.
4. **Report catalogue search** — Reports rail: company / tenement / year against `reports_index` metadata. Hits deep-link to DIGS / WAMEX / GSQ / GEMIS / MRT / GSV. Every row is marked **file not hosted**.
5. **Apply / lease** — Open-ground cards link the **state** titles portal for that point (NSW TMS, QLD authorities, WA MTO, SA, NT, TAS, VIC). There is no national vacant listing.
7. **Gaps + MinView parity** — More → Gaps (QLD holes 0, report files not hosted, SA reports empty, …). [`parity.html`](parity.html) is the match/lag checklist vs NSW MinView.
8. **My ground** — pin a company and/or title numbers (optional name). Persists in `localStorage`. Share `?company=BHP` or `?vs=BHP,RIO`. No accounts, no PAT.
9. **Reports layer** — off by default. Clustered points at **title centroids after a tenement join**. Catalogues with no geometry and no join are not scattered. SA reports are empty (SARIG CSW WAF 403).
10. **Company vs company** — `?vs=BHP,RIO` colours two holder sets and leaves identify working. Token match so `RIO` is Rio Tinto, not Marion.
11. **Open ground** — `GET /v1/open-ground` (fallback: client-side live-title index). Find has an Open ground control (`?open=1` or `?open=lng,lat`). Click a point for **Open ground** or **Held** plus covering live titles. Box pack adds a point-sample vacant vs held count — not a vacant cadastral polygon. This is not a grant, and not parks / native title / planning / pastoral / city lots. ACT has no titles register. There is no for-sale list.

Viewport titles load on `moveend` from `/v1/titles?bbox=` (zoom-gated; the continent is not requested at `limit=2000`). Map click identify uses `/v1/identify` unless a geology or hex layer is hit first.

## Live API check

```bash
python3 tools/test_live_api.py
python3 tools/test_portal_links.py
python3 tools/test_geology_age.py
python3 tools/test_bwave.py
python3 tools/test_api_patch.py
```

Asserts health, AL7 held (Zeolite Australia), Sydney open, and Find BHP against the register. Catalogue checks hit NSW DIGS + WAMEX ReportDetails + GSQ `package_show`. Serve this folder (`python3 -m http.server 8765`) to click the same points in the map.

Report URLs are official catalogue pages only (DIGS `/report/{id}`, WAMEX `ReportDetails?ANumber=`, GSQ CKAN dataset/report, GEMIS / MRT / GSV harvest URLs). PDFs are not downloaded. Bare portal homes are not treated as report deep-links.
