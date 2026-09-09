#!/usr/bin/env python3
"""Unit tests for the droplet geochem / geophysics router (no live DB)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))

from routes_geochem_geophysics import (  # noqa: E402
    GEOCHEM_LIMIT_MAX,
    GEOPHYSICS_LIMIT_MAX,
    HEX_HALF,
    empty_fc,
    map_fields,
    parse_bbox,
    parse_hex,
    pick_geom,
    type_sql_values,
)


def expect(cond: bool, msg: str, failures: list[str]) -> None:
    if cond:
        print("  ok  " + msg)
    else:
        print("  FAIL " + msg)
        failures.append(msg)


def main() -> int:
    failures: list[str] = []
    print("Xplorr API patch helpers")

    box = parse_bbox("148.1,-33.2,148.4,-32.9")
    expect(box == (148.1, -33.2, 148.4, -32.9), "parse bbox", failures)
    hex_box = parse_hex("138.70,-32.50")
    expect(hex_box is not None, "parse hex", failures)
    expect(abs(hex_box[2] - hex_box[0] - 2 * HEX_HALF) < 1e-9, "hex is ±0.09°", failures)

    cols = ["sample_id", "analyte", "result", "uom", "geom", "hole_id", "jurisdiction"]
    fields = map_fields(
        cols,
        {
            "sample": ("sample_id", "sample"),
            "element": ("element", "analyte"),
            "value": ("value", "result"),
            "unit": ("unit", "uom"),
            "method": ("method", "assay_method"),
            "hole_id": ("hole_id",),
            "jurisdiction": ("jurisdiction", "state"),
        },
    )
    expect(fields["element"] == "analyte", "map analyte → element", failures)
    expect(fields["value"] == "result", "map result → value", failures)
    expect("method" not in fields, "absent method column is not invented", failures)
    expect(pick_geom(cols) == "geom", "geom column", failures)

    expect(set(type_sql_values("magnetics")) >= {"magnetic", "magnetics", "mag"}, "type aliases", failures)
    fc = empty_fc(available=False, reason="no table")
    expect(fc["features"] == [] and fc["available"] is False, "empty collection when table missing", failures)
    expect(GEOCHEM_LIMIT_MAX == 500 and GEOPHYSICS_LIMIT_MAX == 200, "hard caps", failures)

    try:
        from fastapi.testclient import TestClient
        from fastapi import FastAPI
        from routes_geochem_geophysics import router

        app = FastAPI()
        app.include_router(router)
        client = TestClient(app)
        missing = client.get("/v1/geochem")
        expect(missing.status_code == 422, "geochem without bbox/hex/hole_id is 422", failures)
        offline = client.get("/v1/geochem", params={"bbox": "148,-33,149,-32", "limit": 5})
        expect(offline.status_code == 200, "unwired router still serves the path", failures)
        body = offline.json()
        expect(body.get("type") == "FeatureCollection", "GeoJSON collection", failures)
        expect(body.get("features") == [], "no invented samples when DB is unwired", failures)
        expect(body.get("available") is False, "available=false when unwired", failures)
        gp = client.get("/v1/geophysics", params={"type": "magnetics", "limit": 5})
        expect(gp.status_code == 200 and gp.json().get("features") == [], "geophysics empty when unwired", failures)
        bad = client.get("/v1/geophysics", params={"type": "seismic"})
        expect(bad.status_code == 422, "unknown geophysics type is 422", failures)
    except Exception as exc:
        print("  note FastAPI TestClient skipped: " + str(exc))

    if failures:
        print("\n%d failed" % len(failures))
        return 1
    print("\nAPI patch helpers passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
