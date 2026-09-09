#!/usr/bin/env python3
"""Smoke-test official catalogue URL templates (DIGS + WAMEX + GSQ).

Does not download report PDFs. Asserts that constructed catalogue pages exist.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

from report_urls import report_href

ORIGIN = "https://app.xplorr.ai"


def get(url: str, timeout: int = 20, accept: str = "*/*") -> tuple[int, str, bytes]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "xplorr-portal-smoke/1.0",
            "Accept": accept,
            "Origin": ORIGIN,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.geturl(), resp.read(800)
    except urllib.error.HTTPError as exc:
        return exc.code, url, exc.read(400)


def expect(cond: bool, msg: str, failures: list[str]) -> None:
    if cond:
        print("  ok  " + msg)
    else:
        print("  FAIL " + msg)
        failures.append(msg)


def main() -> int:
    failures: list[str] = []
    print("Xplorr catalogue URL templates")

    nsw = {
        "st": "nsw",
        "t": "Annual report of AL7 for the reporting period 29 November 2023 to 28 November 2024",
        "u": "https://search.geoscience.nsw.gov.au/report/371e56f2-5c57-4cc0-9dbd-bf0438887e74",
    }
    nsw_href = report_href(nsw)
    expect(
        nsw_href == "https://search.geoscience.nsw.gov.au/report/371e56f2-5c57-4cc0-9dbd-bf0438887e74",
        "NSW DIGS keeps harvest /report/{id}",
        failures,
    )
    st, _, body = get(nsw_href)
    expect(st == 200 and b"DIGS" in body, "NSW DIGS UUID catalogue page returns DIGS shell", failures)

    known = report_href({"st": "nsw", "u": "https://search.geoscience.nsw.gov.au/report/R00035415"})
    st, _, body = get(known)
    expect(st == 200 and b"DIGS" in body, "NSW DIGS R-number catalogue page returns DIGS shell", failures)

    wa = {"st": "wa", "t": "Wilga-McAilnden C32/1993", "u": "https://wamex.dmp.wa.gov.au/Wamex", "a": 120783}
    wa_href = report_href(wa)
    expect(
        wa_href == "https://wamex.dmp.wa.gov.au/Wamex/Search/ReportDetails?ANumber=120783",
        "WAMEX homepage + A-number becomes ReportDetails",
        failures,
    )
    expect(report_href({"st": "wa", "u": "https://wamex.dmp.wa.gov.au/Wamex"}) == "", "bare WAMEX home is not a report link", failures)
    st, final, _ = get(wa_href)
    expect(st in (200, 302, 303, 401), "WAMEX ReportDetails is a live catalogue path (status %s)" % st, failures)
    expect("ReportDetails" in (final or wa_href) or "Wamex" in (final or ""), "WAMEX response stays on the WAMEX host", failures)

    qld = {
        "st": "qld",
        "t": "EPM 26426, RICHMOND-JULIA CREEK PROJECT",
        "u": "https://geoscience.data.qld.gov.au/data/dataset/000acf17-3bcd-4262-9e49-3b8f6f00346e",
    }
    qld_href = report_href(qld)
    expect(
        qld_href.endswith("/data/dataset/000acf17-3bcd-4262-9e49-3b8f6f00346e"),
        "GSQ keeps harvested CKAN dataset id",
        failures,
    )
    expect(
        report_href({"st": "qld", "id": "cr119257"}) == "https://geoscience.data.qld.gov.au/data/report/cr119257",
        "GSQ CR ids use /data/report/",
        failures,
    )
    api = "https://geoscience.data.qld.gov.au/api/3/action/package_show?id=000acf17-3bcd-4262-9e49-3b8f6f00346e"
    st, payload = 0, None
    for attempt in range(3):
        st, _, _ = get(api, accept="application/json")
        if st == 200:
            req = urllib.request.Request(api, headers={"Accept": "application/json", "User-Agent": "xplorr-portal-smoke/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            break
    if st == 403:
        print("  note GSQ package_show HTTP 403 (portal WAF) — UUID template still official")
    else:
        expect(st == 200, "GSQ package_show accepts harvested UUID", failures)
        if payload:
            expect(payload.get("success") is True, "GSQ package_show success", failures)
            expect((payload.get("result") or {}).get("name") == "cr119257", "GSQ UUID resolves to cr119257", failures)

    if failures:
        print("\n%d failed" % len(failures))
        return 1
    print("\nCatalogue URL checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
