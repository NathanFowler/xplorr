#!/usr/bin/env python3
"""Count honest Quaternary/cover vs basement labels on geology_kinds.geojson."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GJ = ROOT / "data" / "geology_kinds.geojson"

COVER_KIND = {"alluvium", "other_regolith"}
COVER_NAME = re.compile(r"\b(quaternary|regolith and recent|holocene|pleistocene|alluvium|colluvium|aeolian|lacustrine)\b", re.I)
COVER_CODE = re.compile(r"^(q[a-z]{0,3}|cz[a-z]{0,3})\b", re.I)
BASEMENT_NAME = re.compile(
    r"\b(precambrian|archaean|archean|proterozoic|palaeozoic|paleozoic|cambrian|ordovician|"
    r"silurian|devonian|carboniferous|permian|triassic|jurassic|cretaceous|mesozoic|neoproterozoic)\b",
    re.I,
)


def age_class(props: dict) -> str:
    kind = str(props.get("kind") or "").lower()
    name = str(props.get("name") or "").strip()
    if kind in COVER_KIND:
        return "cover"
    if COVER_NAME.search(name) or COVER_CODE.search(name):
        return "cover"
    if BASEMENT_NAME.search(name):
        return "basement"
    return "unclassified"


def main() -> int:
    gj = json.loads(GJ.read_text())
    counts = Counter()
    by_state = Counter()
    for feat in gj.get("features") or []:
        p = feat.get("properties") or {}
        cls = age_class(p)
        counts[cls] += 1
        by_state[(str(p.get("state") or "?"), cls)] += 1
    print("geology age_class", dict(counts))
    for (st, cls), n in sorted(by_state.items()):
        print(f"  {st:4} {cls:13} {n}")
    if counts["cover"] < 20:
        print("FAIL expected some cover units from alluvium/regolith + Q/CZ codes")
        return 1
    if counts["unclassified"] == 0:
        print("FAIL expected unclassified units where age is absent")
        return 1
    print("ok  cover/basement split is derived, not invented")
    return 0


if __name__ == "__main__":
    sys.exit(main())
