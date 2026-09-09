"""Shared B-wave rules (keep in sync with app.js).

Used by tools/test_bwave.py so heat / report / portal / gap copy cannot drift
into invented assays or a fake national vacant-ground list.
"""
from __future__ import annotations

import re
from typing import Iterable

# Hex heat is allowed only when this many cells carry a *real* element token.
# Below that the UI shows an empty state — no interpolated anomaly surface.
HEAT_MIN_HEXES = 40

# Tokens that actually appear as element-like values in geochem_hex top_commodities.
# Place names (Sunshine, Pyramid, Bendigo, …) are not elements.
ELEMENTS = (
    {"id": "au", "label": "Au", "color": "#ffd000", "tokens": ("au", "gold")},
    {"id": "cu", "label": "Cu", "color": "#ff7a1a", "tokens": ("cu", "copper")},
    {"id": "pb", "label": "Pb", "color": "#ff2bd6", "tokens": ("pb", "lead")},
    {"id": "zn", "label": "Zn", "color": "#3d9cff", "tokens": ("zn", "zinc")},
    {"id": "ag", "label": "Ag", "color": "#00e5ff", "tokens": ("ag", "silver")},
    {"id": "fe", "label": "Fe", "color": "#ff2d2d", "tokens": ("fe", "iron")},
    {"id": "ni", "label": "Ni", "color": "#00e0b8", "tokens": ("ni", "nickel")},
    {"id": "co", "label": "Co", "color": "#7b5cff", "tokens": ("co", "cobalt")},
    {"id": "u", "label": "U", "color": "#b8ff00", "tokens": ("u", "uranium")},
    {"id": "li", "label": "Li", "color": "#b44dff", "tokens": ("li", "lithium")},
)

# Official apply / lease portals — state systems only. No national listing.
APPLY_PORTALS = {
    "nsw": {
        "name": "NSW Titles Management System",
        "apply": "https://www.resources.nsw.gov.au/mining-and-exploration/titles-management-system",
        "info": "https://www.resources.nsw.gov.au/mining-and-exploration/applying-to-explore-and-mine-nsw",
    },
    "qld": {
        "name": "QLD GeoResGlobe / authorities",
        "apply": "https://www.business.qld.gov.au/industries/mining-energy-water/resources/minerals-coal/authorities-permits",
        "info": "https://georesglobe.information.qld.gov.au/",
    },
    "wa": {
        "name": "WA Mineral Titles Online",
        "apply": "https://www.dmp.wa.gov.au/Mineral-Titles-online-MTO-1464.aspx",
        "info": "https://www.dmp.wa.gov.au/Minerals/Applying-for-a-mining-tenement-1472.aspx",
    },
    "sa": {
        "name": "SA exploration licence",
        "apply": "https://www.energymining.sa.gov.au/industry/minerals-and-mining/exploration/applying-for-an-exploration-licence",
        "info": "https://map.sarig.sa.gov.au/",
    },
    "nt": {
        "name": "NT mineral titles",
        "apply": "https://nt.gov.au/industry/mining-and-energy/mineral-titles/apply-for-a-mineral-title",
        "info": "https://geoscience.nt.gov.au/gemis/",
    },
    "tas": {
        "name": "MRT exploration licence",
        "apply": "https://www.mrt.tas.gov.au/exploration/applying_for_an_exploration_licence",
        "info": "https://www.mrt.tas.gov.au/",
    },
    "vic": {
        "name": "VIC Earth Resources licensing",
        "apply": "https://earthresources.vic.gov.au/licensing-approvals/minerals-development",
        "info": "https://earthresources.vic.gov.au/licensing-approvals",
    },
}

GAPS = (
    {
        "id": "qld-holes",
        "title": "QLD drillholes",
        "status": "gap",
        "detail": "0 harvested collars. Two DEMO hex cells only — not a QLD hole layer.",
    },
    {
        "id": "report-files",
        "title": "Report files",
        "status": "gap",
        "detail": "Catalogue metadata + official portal URLs only. PDFs / ZIP / data files are not hosted here.",
    },
    {
        "id": "sa-reports",
        "title": "SA reports",
        "status": "gap",
        "detail": "SARIG CSW WAF 403 — harvest is empty.",
    },
    {
        "id": "geochem-points",
        "title": "Geochem point assays",
        "status": "lag",
        "detail": "4.8M harvest samples are hex-aggregated. /v1/geochem is 404 on the public API until the droplet patch is deployed.",
    },
    {
        "id": "qld-wa-geochem",
        "title": "QLD / WA geochem",
        "status": "gap",
        "detail": "No QLD or WA geochem pack in the harvest. NSW, NT, TAS, SA, VIC only.",
    },
    {
        "id": "gp-imagery",
        "title": "Geophysics imagery",
        "status": "lag",
        "detail": "GA GADDS survey footprints (and /v1/geophysics when mounted). MinView WMS drapes are not wired.",
    },
    {
        "id": "sa-occ",
        "title": "SA occurrences",
        "status": "gap",
        "detail": "120 DEMO preview points only — not a live SA harvest.",
    },
)

MINVIEW_PARITY = (
    {"item": "Live mineral titles", "minview": "NSW titles", "xplorr": "National live register via /v1/titles", "status": "match"},
    {"item": "Mineral occurrences", "minview": "NSW sites", "xplorr": "National occ pack (WA BY-NC; SA DEMO)", "status": "match"},
    {"item": "Drillholes", "minview": "NSW collars", "xplorr": "National hex density; QLD = 0", "status": "lag"},
    {"item": "Geochem samples", "minview": "NSW point assays", "xplorr": "Hex aggregates; point assays wait on /v1/geochem", "status": "lag"},
    {"item": "Geophysics imagery", "minview": "Statewide rasters", "xplorr": "GA survey footprints only", "status": "lag"},
    {"item": "Exploration reports", "minview": "DIGS catalogue + files", "xplorr": "National catalogue links; files not hosted", "status": "lag"},
    {"item": "Geology", "minview": "NSW detailed units", "xplorr": "State kinds + GA WMTS; WA/ACT kinds absent", "status": "partial"},
    {"item": "Open / vacant ground", "minview": "Not a vacant listing", "xplorr": "No-live-title point check + state apply portals", "status": "extra"},
    {"item": "Company vs company", "minview": "Not offered", "xplorr": "?vs= holder compare", "status": "extra"},
)

_TOKEN_SPLIT = re.compile(r"[,;/|]+")
_WORD = re.compile(r"[A-Za-z]{1,12}")


def parse_element_tokens(raw: str | None) -> set[str]:
    """Return element ids present in a hex top_commodities string.

    Only known element tokens count. Place names and type % strings do not.
    """
    text = str(raw or "")
    words = {w.lower() for w in _WORD.findall(text)}
    found = set()
    for spec in ELEMENTS:
        if any(tok in words for tok in spec["tokens"]):
            found.add(spec["id"])
    return found


def heat_supported(hex_count: int, min_hexes: int = HEAT_MIN_HEXES) -> bool:
    return int(hex_count or 0) >= min_hexes


def split_ids(raw: str | None) -> set[str]:
    out = set()
    for part in _TOKEN_SPLIT.split(str(raw or "")):
        t = part.strip()
        if t:
            out.add(t.lower())
    return out


def hole_geochem_join(hole_ids: Iterable[str], sample_ids: Iterable[str]) -> set[str]:
    """Intersection of real IDs only — empty if either side has no key."""
    a = {str(x).strip().lower() for x in hole_ids if str(x).strip()}
    b = {str(x).strip().lower() for x in sample_ids if str(x).strip()}
    return a & b


def report_file_hosted(rec: dict) -> bool:
    """This repo never hosts report files. Catalogue URL ≠ hosted file."""
    return False


def report_matches(rec: dict, company: str = "", tenement: str = "", year: str = "") -> bool:
    title = str(rec.get("t") or "").lower()
    st = str(rec.get("st") or "").lower()
    blob = f"{st} {title}"
    if company:
        tokens = [t for t in re.split(r"[^a-z0-9]+", company.lower()) if t]
        if tokens and not all(t in blob for t in tokens):
            return False
    if tenement:
        ten = re.sub(r"\s+", "", tenement.lower())
        compact = re.sub(r"[^a-z0-9/]", "", title)
        if ten not in title.replace(" ", "") and ten not in compact and ten not in st:
            return False
    if year:
        y = str(rec.get("y") or "")
        if y != str(year).strip():
            return False
    return True


def apply_portals_for_state(state: str | None) -> dict | None:
    if not state:
        return None
    return APPLY_PORTALS.get(str(state).strip().lower())
