"""Official catalogue URL templates used by the map (keep in sync with app.js)."""

from __future__ import annotations

import re
from urllib.parse import quote

WAMEX_DETAILS = "https://wamex.dmp.wa.gov.au/Wamex/Search/ReportDetails?ANumber="
DIGS_REPORT = "https://search.geoscience.nsw.gov.au/report/"
DIGS_SEARCH = "https://search.geoscience.nsw.gov.au/search?query="
GSQ_DATASET = "https://geoscience.data.qld.gov.au/data/dataset/"
GSQ_REPORT = "https://geoscience.data.qld.gov.au/data/report/"

PORTAL_HOMES = {
    "nsw": {"https://search.geoscience.nsw.gov.au", "https://search.geoscience.nsw.gov.au/"},
    "qld": {"https://geoscience.data.qld.gov.au", "https://geoscience.data.qld.gov.au/"},
    "wa": {"https://wamex.dmp.wa.gov.au/Wamex", "https://wamex.dmp.wa.gov.au/Wamex/"},
}


def _norm(u: str) -> str:
    return (u or "").strip().rstrip("/").lower()


def is_portal_home(url: str, state: str) -> bool:
    homes = {_norm(h) for h in PORTAL_HOMES.get(state, ())}
    return _norm(url) in homes


def report_href(rec: dict) -> str:
    st = str(rec.get("st") or rec.get("jurisdiction") or rec.get("state") or "").lower()
    raw = str(rec.get("u") or rec.get("url") or rec.get("href") or "")

    if st == "wa":
        a = rec.get("a")
        if a is not None and str(a).strip() != "":
            return WAMEX_DETAILS + quote(str(int(a)), safe="")
        if raw.startswith("http") and not is_portal_home(raw, "wa"):
            return raw
        return ""

    if st == "nsw":
        m = re.search(r"search\.geoscience\.nsw\.gov\.au/report/([^/?#]+)", raw, re.I)
        if m:
            return DIGS_REPORT + quote(m.group(1), safe="")
        if raw.startswith("http") and not is_portal_home(raw, "nsw"):
            return raw
        title = str(rec.get("t") or "")
        if title:
            return DIGS_SEARCH + quote(title[:180], safe="")
        return ""

    if st == "qld":
        m = re.search(r"geoscience\.data\.qld\.gov\.au/(?:data/)?(?:dataset|report)/([^/?#]+)", raw, re.I)
        rid = m.group(1) if m else rec.get("id") or ""
        if rid and re.match(r"cr\d+", str(rid), re.I):
            return GSQ_REPORT + quote(str(rid), safe="")
        if rid:
            return GSQ_DATASET + quote(str(rid), safe="")
        if raw.startswith("http") and not is_portal_home(raw, "qld"):
            return raw
        return ""

    if raw.startswith("http") and not is_portal_home(raw, st):
        return raw
    return ""
