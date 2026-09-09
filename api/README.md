# Droplet API patch — `/v1/geochem` and `/v1/geophysics`

The public map (`app.xplorr.ai`) talks to a **read-only FastAPI + PostGIS** service that is **not in this git repo**. Live host:

```
https://xplorr.143.198.52.4.sslip.io
```

OpenAPI on 2026-09-09 exposes `/health`, `/v1/titles`, `/v1/identify`, `/v1/open-ground`, `/v1/company`, `/v1/aoi`. Both `/v1/geochem` and `/v1/geophysics` return `{"detail":"Not Found"}`. Health reports titles / holes / occs only — no geochem or footprint counts.

This folder is the drop-in patch. The map already calls these paths (hex card, box pack, hole join, geophysics rail). Until the droplet is restarted with this router, the UI keeps hex / GA WMS fallbacks and does not invent assay values.

## Where to patch on the droplet

SSH as the operator who already deploys the register (DigitalOcean droplet `143.198.52.4`).

```bash
ssh root@143.198.52.4   # or the existing deploy user

# 1. Find the running app
systemctl list-units --type=service | grep -i xplorr
ps aux | grep -E 'uvicorn|gunicorn|fastapi'

# Typical clues from this stack:
#   uvicorn … Caddy reverse-proxy on :443
#   process cwd is the FastAPI project (main.py / app.py)
#   DATABASE_URL or POSTGRES_* in the unit Environment= or .env

# 2. Confirm PostGIS has the harvest tables
sudo -u postgres psql -d xplorr -c "\dt *.*"
# Expect something like:
#   public.titles, public.holes, public.occurrences
#   public.geochem  (~4.2M sample/assay rows)     — name may vary
#   public.geophysics (~13k survey footprints)    — name may vary
```

Copy `routes_geochem_geophysics.py` next to the existing FastAPI module (same directory as `main.py` / `app.py`).

Exact insert (one file, two lines):

```python
# main.py  (or app.py — whichever already does `app = FastAPI(...)`)
from routes_geochem_geophysics import router as geochem_gp_router

app.include_router(geochem_gp_router)
```

Wire the connection the same way the existing `/v1/titles` handler does. The router looks for, in order:

1. `app.state.pool` / `app.state.db` (asyncpg or psycopg pool)
2. `DATABASE_URL` / `XPLORR_DATABASE_URL`
3. A `get_connection()` callable you assign:

```python
from routes_geochem_geophysics import router, configure

configure(get_connection=existing_get_conn)  # sync or async context manager
app.include_router(router)
```

Restart the unit (`systemctl restart xplorr-api` or whatever `ps` showed). Caddy does not need a new route — `/v1/*` is already proxied.

## Confirm

```bash
curl -sS 'https://xplorr.143.198.52.4.sslip.io/health'
curl -sS 'https://xplorr.143.198.52.4.sslip.io/v1/geochem?bbox=138.6,-32.6,138.8,-32.4&limit=5'
curl -sS 'https://xplorr.143.198.52.4.sslip.io/v1/geophysics?bbox=129,-26,138,-11&type=magnetics&limit=5'
curl -sS 'https://xplorr.143.198.52.4.sslip.io/openapi.json' | python3 -c "import json,sys; print([p for p in json.load(sys.stdin)['paths'] if 'geochem' in p or 'geophys' in p])"
```

A live answer is a GeoJSON `FeatureCollection` plus `truncated` / `limit` / `offset`. If the table is missing, the path still exists and returns `available: false` with an empty collection — never invented values.

## Endpoint contract (map already implements this)

### `GET /v1/geochem`

| Query | Required | Notes |
| --- | --- | --- |
| `bbox` | yes* | `west,south,east,north` (WGS84). *or `hex=lon,lat` or `hole_id=` |
| `hex` | no | hex-cell centre; server uses ±0.09° (same as the map hex card) |
| `hole_id` | no | join when a `hole_id` / `drillhole_id` column exists |
| `element` | no | filter on the real element/analyte column if present (`Au`, `Cu`, …) |
| `limit` | no | default 200, hard cap 500 |
| `offset` | no | pagination |

Each feature uses **only columns that exist** on the discovered table:

`sample` / `sample_id` / `native_id`, `element` / `analyte`, `value` / `result`, `unit` / `uom`, `method` / `assay_method`, `depth` / `depth_m`, `sample_type`, `hole_id`, `jurisdiction`, `licence`, `commercial_use`.

Empty cells stay empty. Do not fill ppm / method from hex `%`.

### `GET /v1/geophysics`

| Query | Required | Notes |
| --- | --- | --- |
| `bbox` | no | if omitted, still cap the page — do not dump 13k polygons |
| `type` | no | `magnetics` / `gravity` / `radiometrics` (aliases: magnetic, mag, grav, radio) |
| `limit` | no | default 100, hard cap 200 |
| `offset` | no | pagination |

Returns survey **footprints** (polygons), not imagery. Type filter applies only when a type/method column exists.

## Table discovery

At first request the router reads `information_schema.columns` and picks the first table whose name matches:

- geochem: `geochem`, `geochem_samples`, `samples`, `assays`, `geochem_points`
- geophysics: `geophysics`, `geophysical_surveys`, `gp_surveys`, `gp_footprints`, `geophysical_datasets`

Geometry column: `geom`, `geometry`, `the_geom`, `wkb_geometry` (must be Point-like for geochem, Polygon/MultiPolygon for footprints).

If nothing matches, the endpoint stays up and says so. That is better than 404 — the map can tell “table not mounted” from “path missing”.

## CORS / safety

Reuse the existing CORS middleware (GitHub Pages + localhost + `app.xplorr.ai`). Do not add write methods. Cap + bbox are mandatory for the 4.2M-row table.

## After deploy

The B-wave map (`app.js`) already:

- fills the hex sample table from `/v1/geochem`
- exports AOI CSV from the same path
- asks `/v1/geophysics` before falling back to GA GADDS WMS
- joins hole clicks with `hole_id` when the column exists

No second frontend deploy is required for the hooks; only the droplet restart unlocks point assays.
