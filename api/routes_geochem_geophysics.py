"""Drop-in FastAPI router for GET /v1/geochem and GET /v1/geophysics.

The live register is not in the public map repo. Copy this file onto the
droplet next to main.py and `app.include_router(router)`. See api/README.md.

Introspects information_schema so we only SELECT columns that exist.
Never invents assay values, units, or methods.
"""
from __future__ import annotations

import os
import re
from typing import Any, Callable, Iterable

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter()

_GET_CONNECTION: Callable | None = None
_CACHE: dict[str, Any] = {}

GEOCHEM_TABLES = (
    "geochem",
    "geochem_samples",
    "samples",
    "assays",
    "geochem_points",
)
GEOPHYSICS_TABLES = (
    "geophysics",
    "geophysical_surveys",
    "gp_surveys",
    "gp_footprints",
    "geophysical_datasets",
)
GEOM_NAMES = ("geom", "geometry", "the_geom", "wkb_geometry")

GEOCHEM_ALIASES = {
    "sample": ("sample_id", "sample", "id", "native_id"),
    "element": ("element", "elem", "analyte", "commodity"),
    "value": ("value", "result", "assay_value", "ppm"),
    "unit": ("unit", "uom", "units"),
    "method": ("method", "assay_method", "lab_method"),
    "depth": ("depth", "depth_m", "sample_depth"),
    "sample_type": ("sample_type", "type", "medium"),
    "hole_id": ("hole_id", "drillhole_id", "hole", "collar_id"),
    "jurisdiction": ("jurisdiction", "state"),
    "licence": ("licence", "license"),
    "commercial_use": ("commercial_use",),
}
GEOPHYSICS_ALIASES = {
    "name": ("survey_name", "surveyname", "name", "title"),
    "type": ("data_type", "datatype", "type", "method", "survey_type"),
    "operator": ("operator", "operatorname", "custodian", "owner"),
    "year": ("year", "startdate", "start_year", "acquisition_year"),
    "jurisdiction": ("jurisdiction", "state"),
    "licence": ("licence", "license"),
    "id": ("id", "survey_id", "native_id", "gadds_id"),
}
TYPE_ALIASES = {
    "magnetics": ("magnetics", "magnetic", "mag", "tmi", "rtp"),
    "gravity": ("gravity", "grav", "bouguer"),
    "radiometrics": ("radiometrics", "radiometric", "radio", "gamma"),
}

BBOX_RE = re.compile(
    r"^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$"
)
HEX_RE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$")

GEOCHEM_LIMIT_DEFAULT = 200
GEOCHEM_LIMIT_MAX = 500
GEOPHYSICS_LIMIT_DEFAULT = 100
GEOPHYSICS_LIMIT_MAX = 200
HEX_HALF = 0.09


def configure(get_connection: Callable | None = None) -> None:
    """Optional hook: pass the droplet's existing connection factory."""
    global _GET_CONNECTION
    _GET_CONNECTION = get_connection
    _CACHE.clear()


def _clamp(n: int, lo: int, hi: int) -> int:
    return max(lo, min(int(n), hi))


def parse_bbox(raw: str | None) -> tuple[float, float, float, float] | None:
    if not raw:
        return None
    m = BBOX_RE.match(raw)
    if not m:
        raise HTTPException(status_code=422, detail="bbox must be west,south,east,north")
    west, south, east, north = (float(x) for x in m.groups())
    if west >= east or south >= north:
        raise HTTPException(status_code=422, detail="bbox must have west<east and south<north")
    if west < -180 or east > 180 or south < -90 or north > 90:
        raise HTTPException(status_code=422, detail="bbox out of WGS84 range")
    return west, south, east, north


def parse_hex(raw: str | None) -> tuple[float, float, float, float] | None:
    if not raw:
        return None
    m = HEX_RE.match(raw)
    if not m:
        raise HTTPException(status_code=422, detail="hex must be lon,lat")
    lon, lat = float(m.group(1)), float(m.group(2))
    return lon - HEX_HALF, lat - HEX_HALF, lon + HEX_HALF, lat + HEX_HALF


def pick_alias(columns: Iterable[str], aliases: tuple[str, ...]) -> str | None:
    have = {c.lower(): c for c in columns}
    for a in aliases:
        if a in have:
            return have[a]
    return None


def map_fields(columns: Iterable[str], aliases: dict[str, tuple[str, ...]]) -> dict[str, str]:
    out = {}
    for public, names in aliases.items():
        col = pick_alias(columns, names)
        if col:
            out[public] = col
    return out


def pick_geom(columns: Iterable[str]) -> str | None:
    return pick_alias(columns, GEOM_NAMES)


def empty_fc(**extra: Any) -> dict[str, Any]:
    body = {"type": "FeatureCollection", "features": [], "truncated": False}
    body.update(extra)
    return body


def feature(lon: float, lat: float, props: dict[str, Any], geom: dict | None = None) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": geom or {"type": "Point", "coordinates": [lon, lat]},
        "properties": props,
    }


def type_sql_values(kind: str | None) -> list[str] | None:
    if not kind:
        return None
    key = kind.strip().lower()
    for canon, aliases in TYPE_ALIASES.items():
        if key == canon or key in aliases:
            return list(aliases) + [canon]
    raise HTTPException(status_code=422, detail="type must be magnetics, gravity, or radiometrics")


async def _fetchall(sql: str, params: tuple | list = ()) -> list[Any]:
    if _GET_CONNECTION is None:
        raise RuntimeError("no database connection configured")
    conn_cm = _GET_CONNECTION()
    if hasattr(conn_cm, "__aenter__"):
        async with conn_cm as conn:
            if hasattr(conn, "fetch"):
                return list(await conn.fetch(sql, *params))
            cur = await conn.execute(sql, params)
            return list(await cur.fetchall())
    with conn_cm as conn:
        cur = conn.execute(sql, params)
        return list(cur.fetchall())


async def introspect(kind: str) -> dict[str, Any] | None:
    cached = _CACHE.get(kind)
    if cached is not None:
        return cached or None
    names = GEOCHEM_TABLES if kind == "geochem" else GEOPHYSICS_TABLES
    aliases = GEOCHEM_ALIASES if kind == "geochem" else GEOPHYSICS_ALIASES
    try:
        rows = await _fetchall(
            """
            SELECT table_schema, table_name, column_name
            FROM information_schema.columns
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
              AND lower(table_name) = ANY(%s)
            ORDER BY table_schema, table_name, ordinal_position
            """,
            (list(names),),
        )
    except Exception:
        _CACHE[kind] = {}
        return None
    grouped: dict[tuple[str, str], list[str]] = {}
    for row in rows:
        if isinstance(row, dict) or hasattr(row, "keys"):
            schema, table, col = row["table_schema"], row["table_name"], row["column_name"]
        else:
            schema, table, col = row[0], row[1], row[2]
        grouped.setdefault((schema, table), []).append(col)
    chosen = None
    for name in names:
        for (schema, table), cols in grouped.items():
            if table.lower() == name:
                geom = pick_geom(cols)
                if not geom:
                    continue
                chosen = {
                    "schema": schema,
                    "table": table,
                    "geom": geom,
                    "fields": map_fields(cols, aliases),
                    "columns": cols,
                }
                break
        if chosen:
            break
    _CACHE[kind] = chosen or {}
    return chosen


def _ident(name: str) -> str:
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name or ""):
        raise HTTPException(status_code=500, detail="unsafe identifier")
    return '"' + name + '"'


def _qual(meta: dict[str, Any]) -> str:
    return _ident(meta["schema"]) + "." + _ident(meta["table"])


@router.get("/v1/geochem")
async def geochem(
    bbox: str | None = Query(None, description="west,south,east,north"),
    hex: str | None = Query(None, description="lon,lat hex centre"),
    hole_id: str | None = Query(None),
    element: str | None = Query(None),
    limit: int = Query(GEOCHEM_LIMIT_DEFAULT),
    offset: int = Query(0, ge=0),
) -> JSONResponse:
    limit = _clamp(limit, 1, GEOCHEM_LIMIT_MAX)
    box = parse_hex(hex) or parse_bbox(bbox)
    if box is None and not hole_id:
        raise HTTPException(status_code=422, detail="bbox, hex, or hole_id is required")

    if _GET_CONNECTION is None and not os.environ.get("DATABASE_URL") and not os.environ.get("XPLORR_DATABASE_URL"):
        return JSONResponse(
            empty_fc(
                available=False,
                reason="droplet router not wired — see api/README.md",
                limit=limit,
                offset=offset,
            )
        )

    meta = await introspect("geochem")
    if not meta:
        return JSONResponse(
            empty_fc(
                available=False,
                reason="no geochem table mounted in PostGIS",
                limit=limit,
                offset=offset,
            )
        )

    fields = meta["fields"]
    geom = _ident(meta["geom"])
    rel = _qual(meta)
    select_bits = [f"ST_X({geom}::geometry) AS lon", f"ST_Y({geom}::geometry) AS lat"]
    public_cols = []
    for public, col in fields.items():
        select_bits.append(f"{_ident(col)} AS {_ident(public)}")
        public_cols.append(public)

    where = [f"{geom} IS NOT NULL"]
    params: list[Any] = []
    if box:
        where.append(
            f"ST_Intersects({geom}::geometry, ST_MakeEnvelope(%s, %s, %s, %s, 4326))"
        )
        params.extend(box)
    if hole_id and "hole_id" in fields:
        where.append(f"{_ident(fields['hole_id'])}::text = %s")
        params.append(hole_id)
    elif hole_id:
        return JSONResponse(
            empty_fc(
                available=True,
                reason="geochem table has no hole_id column — cannot join collars",
                limit=limit,
                offset=offset,
                join="absent",
            )
        )
    if element and "element" in fields:
        where.append(f"lower({_ident(fields['element'])}::text) = lower(%s)")
        params.append(element.strip())

    sql = (
        f"SELECT {', '.join(select_bits)} FROM {rel} WHERE "
        + " AND ".join(where)
        + " LIMIT %s OFFSET %s"
    )
    params.extend([limit + 1, offset])
    try:
        rows = await _fetchall(sql, params)
    except Exception as exc:
        return JSONResponse(
            empty_fc(
                available=False,
                reason="geochem query failed: " + str(exc).split("\n")[0][:180],
                limit=limit,
                offset=offset,
            )
        )

    truncated = len(rows) > limit
    feats = []
    for row in rows[:limit]:
        rec = _row_dict(row, ["lon", "lat"] + public_cols)
        lon, lat = rec.pop("lon", None), rec.pop("lat", None)
        props = {k: rec.get(k) for k in public_cols if rec.get(k) is not None and rec.get(k) != ""}
        if lon is None or lat is None:
            continue
        feats.append(feature(float(lon), float(lat), props))

    return JSONResponse(
        {
            "type": "FeatureCollection",
            "features": feats,
            "available": True,
            "truncated": truncated,
            "limit": limit,
            "offset": offset,
            "count": len(feats),
            "columns": public_cols,
        }
    )


@router.get("/v1/geophysics")
async def geophysics(
    bbox: str | None = Query(None, description="west,south,east,north"),
    type: str | None = Query(None, description="magnetics | gravity | radiometrics"),
    limit: int = Query(GEOPHYSICS_LIMIT_DEFAULT),
    offset: int = Query(0, ge=0),
) -> JSONResponse:
    limit = _clamp(limit, 1, GEOPHYSICS_LIMIT_MAX)
    box = parse_bbox(bbox)
    wanted = type_sql_values(type)

    if _GET_CONNECTION is None and not os.environ.get("DATABASE_URL") and not os.environ.get("XPLORR_DATABASE_URL"):
        return JSONResponse(
            empty_fc(
                available=False,
                reason="droplet router not wired — see api/README.md",
                limit=limit,
                offset=offset,
            )
        )

    meta = await introspect("geophysics")
    if not meta:
        return JSONResponse(
            empty_fc(
                available=False,
                reason="no geophysics footprint table mounted in PostGIS",
                limit=limit,
                offset=offset,
            )
        )

    fields = meta["fields"]
    geom = _ident(meta["geom"])
    rel = _qual(meta)
    select_bits = [f"ST_AsGeoJSON({geom}::geometry)::json AS geom"]
    public_cols = []
    for public, col in fields.items():
        select_bits.append(f"{_ident(col)} AS {_ident(public)}")
        public_cols.append(public)

    where = [f"{geom} IS NOT NULL"]
    params: list[Any] = []
    if box:
        where.append(
            f"ST_Intersects({geom}::geometry, ST_MakeEnvelope(%s, %s, %s, %s, 4326))"
        )
        params.extend(box)
    if wanted and "type" in fields:
        where.append(f"lower({_ident(fields['type'])}::text) = ANY(%s)")
        params.append(wanted)
    elif wanted:
        return JSONResponse(
            empty_fc(
                available=True,
                reason="geophysics table has no type column — cannot filter magnetics/gravity/radiometrics",
                limit=limit,
                offset=offset,
                filter="absent",
            )
        )

    sql = (
        f"SELECT {', '.join(select_bits)} FROM {rel} WHERE "
        + " AND ".join(where)
        + " LIMIT %s OFFSET %s"
    )
    params.extend([limit + 1, offset])
    try:
        rows = await _fetchall(sql, params)
    except Exception as exc:
        return JSONResponse(
            empty_fc(
                available=False,
                reason="geophysics query failed: " + str(exc).split("\n")[0][:180],
                limit=limit,
                offset=offset,
            )
        )

    truncated = len(rows) > limit
    feats = []
    for row in rows[:limit]:
        rec = _row_dict(row, ["geom"] + public_cols)
        geom_obj = rec.pop("geom", None)
        if isinstance(geom_obj, str):
            import json

            geom_obj = json.loads(geom_obj)
        props = {k: rec.get(k) for k in public_cols if rec.get(k) is not None and rec.get(k) != ""}
        if not geom_obj:
            continue
        feats.append({"type": "Feature", "geometry": geom_obj, "properties": props})

    return JSONResponse(
        {
            "type": "FeatureCollection",
            "features": feats,
            "available": True,
            "truncated": truncated,
            "limit": limit,
            "offset": offset,
            "count": len(feats),
            "columns": public_cols,
        }
    )


def _row_dict(row: Any, names: list[str]) -> dict[str, Any]:
    if isinstance(row, dict) or hasattr(row, "keys"):
        return {n: row[n] if n in row else row.get(n) for n in names}
    return {n: row[i] for i, n in enumerate(names) if i < len(row)}
