#!/usr/bin/env python3
"""Contract checks for the public Xplorr PostGIS API.

The GitHub Pages map (app.js) calls these read-only endpoints. This script
is the documented non-browser test: AL7 held, Sydney open, Find BHP.

  python3 tools/test_live_api.py
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://xplorr.143.198.52.4.sslip.io"
ORIGIN = "https://nathanfowler.github.io"


def get(path: str, params: dict | None = None, timeout: int = 20) -> dict:
    url = BASE + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Origin": ORIGIN, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        cors = resp.headers.get("Access-Control-Allow-Origin", "")
        body = json.loads(resp.read().decode("utf-8"))
    return {"cors": cors, "body": body}


def expect(cond: bool, msg: str, failures: list[str]) -> None:
    if cond:
        print("  ok  " + msg)
    else:
        print("  FAIL " + msg)
        failures.append(msg)


def main() -> int:
    failures: list[str] = []
    print("Xplorr live API · " + BASE)

    health = get("/health")
    h = health["body"]
    expect(h.get("ok") is True, "GET /health ok=true", failures)
    expect(int(h.get("titles") or 0) > 400000, "health titles > 400k (national register)", failures)
    expect(
        health["cors"] in (ORIGIN, "*"),
        "CORS allows GitHub Pages origin",
        failures,
    )

    al7 = get("/v1/open-ground", {"lng": "150.5992", "lat": "-31.37045"})["body"]
    expect(al7.get("open") is False, "AL7 150.5992,-31.37045 is held", failures)
    names = [str(t.get("name") or "") for t in (al7.get("titles") or [])]
    holders = [str(t.get("holder") or "") for t in (al7.get("titles") or [])]
    expect(any(n.upper() == "AL7" for n in names), "AL7 title name in covering list", failures)
    expect(
        any("ZEOLITE" in h.upper() for h in holders),
        "AL7 holder is Zeolite Australia",
        failures,
    )
    expect(bool(al7.get("disclaimer")), "open-ground keeps a disclaimer", failures)
    if al7.get("titles"):
        t0 = al7["titles"][0]
        expect("commercial_use" in t0, "title includes commercial_use", failures)

    syd = get("/v1/open-ground", {"lng": "151.2093", "lat": "-33.8688"})["body"]
    expect(syd.get("open") is True, "Sydney 151.2093,-33.8688 is open", failures)
    expect(not (syd.get("titles") or []), "Sydney has no covering live titles", failures)
    expect(bool(syd.get("disclaimer")), "Sydney open-ground keeps a disclaimer", failures)

    bhp = get("/v1/company", {"q": "BHP"})["body"]
    expect(int(bhp.get("title_count") or 0) >= 900, "q=BHP title_count >= 900 (full register)", failures)
    feats = ((bhp.get("titles") or {}).get("features") or [])
    expect(len(feats) > 0, "q=BHP returns title features to plot", failures)
    expect(len(feats) <= 200, "q=BHP feature cap is 200", failures)
    if feats:
        props = feats[0].get("properties") or {}
        expect("holder" in props and "jurisdiction" in props, "company title props include holder + jurisdiction", failures)

    ident = get("/v1/identify", {"lng": "150.5992", "lat": "-31.37045"})["body"]
    expect(len(ident.get("titles") or []) >= 1, "identify AL7 returns covering titles", failures)
    expect("occurrences" in ident and "holes" in ident, "identify returns occs + holes", failures)

    wa = get("/v1/identify", {"lng": "121.5", "lat": "-30.8"})["body"]
    blocked = [o for o in (wa.get("occurrences") or []) if o.get("commercial_use") is False]
    expect(len(blocked) >= 1, "WA identify includes commercial_use=false (MINEDEX / BY-NC)", failures)

    titles = get(
        "/v1/titles",
        {"bbox": "150.5,-31.4,150.7,-31.3", "status": "live", "limit": "20"},
    )["body"]
    expect(titles.get("type") == "FeatureCollection", "titles bbox returns GeoJSON", failures)
    expect(len(titles.get("features") or []) >= 1, "titles bbox around AL7 has features", failures)

    aoi = get("/v1/aoi", {"bbox": "150.5,-31.4,150.7,-31.3"}, timeout=30)["body"]
    expect(int(aoi.get("title_count") or 0) >= 1, "aoi title_count around AL7", failures)
    expect("hole_count" in aoi, "aoi includes hole_count (not full collar dump)", failures)
    sample_n = len(((aoi.get("holes_sample") or {}).get("features") or []))
    expect(sample_n <= 25, "aoi holes_sample capped at 25", failures)

    if failures:
        print("\n%d failed" % len(failures))
        return 1
    print("\nAll live API checks passed.")
    print("Map wiring: serve the repo and open")
    print("  http://127.0.0.1:8765/?open=150.59920,-31.37045")
    print("  http://127.0.0.1:8765/?open=151.20930,-33.86880")
    print("  http://127.0.0.1:8765/?company=BHP")
    return 0


if __name__ == "__main__":
    sys.exit(main())
