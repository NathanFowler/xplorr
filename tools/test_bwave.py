#!/usr/bin/env python3
"""B-wave contract: heats, joins, reports, portals — no invented values."""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

from bwave import (
    APPLY_PORTALS,
    ELEMENTS,
    GAPS,
    HEAT_MIN_HEXES,
    MINVIEW_PARITY,
    heat_supported,
    hole_geochem_join,
    parse_element_tokens,
    report_file_hosted,
    report_matches,
    split_ids,
)

ROOT = Path(__file__).resolve().parents[1]


def expect(cond: bool, msg: str, failures: list[str]) -> None:
    if cond:
        print("  ok  " + msg)
    else:
        print("  FAIL " + msg)
        failures.append(msg)


def main() -> int:
    failures: list[str] = []
    print("Xplorr B-wave contracts")

    expect(parse_element_tokens("Au 40%, Cu 30%") == {"au", "cu"}, "Au/Cu tokens from hex %", failures)
    expect(parse_element_tokens("uranium") == {"u"}, "uranium word maps to U", failures)
    expect(parse_element_tokens("Sunshine (Ionex) 34") == set(), "VIC place name is not an element", failures)
    expect(parse_element_tokens("ROCKCHIP 100%") == set(), "sample type is not an element", failures)
    expect(parse_element_tokens("Fe") == {"fe"}, "Fe symbol", failures)
    expect("mt" not in {t for spec in ELEMENTS for t in spec["tokens"]}, "Mt/Mount is not an element token", failures)

    gj = json.loads((ROOT / "data" / "geochem_hex.geojson").read_text())
    counts = Counter()
    samples = Counter()
    for feat in gj["features"]:
        p = feat.get("properties") or {}
        ids = parse_element_tokens(p.get("top_commodities"))
        for eid in ids:
            counts[eid] += 1
            samples[eid] += int(p.get("n") or 0)
    print("  note hexes with real element tokens:", dict(counts))
    expect(counts["cu"] >= HEAT_MIN_HEXES, "Cu hex density supports a heat", failures)
    expect(counts["au"] >= HEAT_MIN_HEXES, "Au hex density supports a heat", failures)
    expect(not heat_supported(counts.get("li", 0)), "Li is below heat threshold — empty state, not a fake surface", failures)
    expect(heat_supported(counts["cu"]), "Cu heat_supported", failures)

    expect(hole_geochem_join(["R03", "AA"], ["aa", "bb"]) == {"aa"}, "hole/sample id intersection is case-insensitive", failures)
    expect(hole_geochem_join(["R03"], ["377443"]) == set(), "no invented join when keys differ", failures)
    expect(split_ids("R03, AA; bb") == {"r03", "aa", "bb"}, "id split", failures)

    rec = {"st": "nsw", "t": "Annual report of EL8694 for BHP", "y": 2022, "u": "https://search.geoscience.nsw.gov.au/report/abc"}
    expect(report_matches(rec, company="BHP"), "report company token in title", failures)
    expect(report_matches(rec, tenement="EL8694"), "report tenement in title", failures)
    expect(report_matches(rec, year="2022"), "report year", failures)
    expect(not report_matches(rec, year="1999"), "year miss", failures)
    expect(not report_file_hosted(rec), "catalogue URL is not a hosted file", failures)

    for st, portal in APPLY_PORTALS.items():
        expect(portal["apply"].startswith("https://"), f"{st} apply URL is https", failures)
        expect("xplorr" not in portal["apply"].lower(), f"{st} apply URL is a state portal, not Xplorr", failures)
    expect("au" not in APPLY_PORTALS and "national" not in APPLY_PORTALS, "no fake national vacant listing", failures)

    ids = {g["id"] for g in GAPS}
    expect("qld-holes" in ids and "report-files" in ids, "gaps panel includes QLD holes + unhosted files", failures)
    expect(any(r["status"] == "lag" and "geochem" in r["item"].lower() for r in MINVIEW_PARITY), "parity lists geochem lag", failures)
    expect(any(r["status"] == "match" and "title" in r["item"].lower() for r in MINVIEW_PARITY), "parity lists titles match", failures)

    if failures:
        print("\n%d failed" % len(failures))
        return 1
    print("\nB-wave contracts passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
