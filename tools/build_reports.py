#!/usr/bin/env python3
"""Slim report join index + title-centroid overlay. Harvest is read-only."""
from __future__ import annotations

import json
import math
import os
import re
from collections import defaultdict
from datetime import datetime, timezone

HARVEST = "/workspace/national-geoscience"
APP = "/workspace/au-titles-map"
OUT_INDEX = os.path.join(APP, "data", "reports_index.json")
OUT_PTS = os.path.join(APP, "data", "reports_pts.geojson")

STATES = ["nsw", "qld", "wa", "nt", "tas", "vic", "sa"]
PER_KEY = 6
PER_HEX = 8
PER_CO = 6
TITLE_EX = 3

PREFIX = r"(?:EPM|EPC|MDL|EMEL|EMPN|EMLN|HLDN|HLDC|AUTH|ELA|MLA|CCL|PLL|MPL|CML|EPL|ELR|MLN|MLC|MCC|EML|EMP|ERA|SEL|GML|MIL|LIC|MRC|LSE|PAL|TRL|TMA|TTL|TFA|ESP|MIN|EL|AL|ML|MC|PL|CL|GL|RL|WA|DL|TR|AA|MA)"
RE_BLOCK = re.compile(rf"\b({PREFIX})\s*[-\.]?\s*0*(\d{{1,6}})(?:\s*/\s*(\d{{2,4}}))?\b", re.I)
RE_WA = re.compile(r"\b(CML|MCI|ECI|GCI|TR|E|P|L|G|R|M)\s*[-\.]?\s*(\d{1,3})\s*/\s*(\d{1,5}[A-Z]?)\b", re.I)
RE_WA_TR = re.compile(r"\bT\.?\s*R\.?\s*(\d{1,3})\s*/\s*(\d{1,5}[A-Z]?)\b", re.I)
RE_TAS_PM = re.compile(r"\b(\d{3,4}P\s*/\s*M)\b", re.I)
RE_TAS_M = re.compile(r"\b(\d{1,3}M\s*/\s*\d{4})\b", re.I)
CO_STRIP = re.compile(r"\b(pty|ltd|limited|nl|inc|incorporated|the|company|co|corporation|corp|plc)\b", re.I)
NON_ALNUM = re.compile(r"[^a-z0-9]+")


def norm_space(s):
    return " ".join(str(s or "").split())


def compact_prefix(pref):
    return re.sub(r"[^a-z0-9]", "", pref.lower())


def tenement_key(state, pref, num, tail=None):
    p = compact_prefix(pref)
    n = str(num).lstrip("0") or "0"
    if tail:
        return f"{state}:{p}{n}/{str(tail).replace(' ', '').upper()}"
    return f"{state}:{p}{n}"


def extract_keys(state, *texts):
    blob = " | ".join(norm_space(t) for t in texts if t)
    if not blob:
        return []
    out, seen = [], set()

    def add(k):
        if k and k not in seen:
            seen.add(k)
            out.append(k)

    if state == "wa":
        for m in RE_WA.finditer(blob):
            add(tenement_key("wa", m.group(1), m.group(2), m.group(3)))
        for m in RE_WA_TR.finditer(blob):
            add(tenement_key("wa", "TR", m.group(1), m.group(2)))
    if state == "tas":
        for m in RE_TAS_PM.finditer(blob):
            add("tas:" + re.sub(r"[^a-z0-9/]", "", m.group(1).lower()))
        for m in RE_TAS_M.finditer(blob):
            add("tas:" + re.sub(r"[^a-z0-9/]", "", m.group(1).lower()))
    for m in RE_BLOCK.finditer(blob):
        add(tenement_key(state, m.group(1), m.group(2), m.group(3)))
    return out


def title_keys(state, name):
    n = norm_space(name)
    if not n:
        return []
    keys = extract_keys(state, n)
    compact = re.sub(r"[^a-z0-9/]", "", n.lower())
    if compact:
        k = f"{state}:{compact}"
        if k not in keys:
            keys.append(k)
        # also zero-stripped compact for VIC EL007115 → el7115 already via extract
    return keys


def norm_company(s):
    s = CO_STRIP.sub(" ", str(s or "").lower())
    s = NON_ALNUM.sub(" ", s)
    return " ".join(s.split())


def company_lookup_keys(s):
    """Distinctive company keys only — no generic first-token index."""
    n = norm_company(s)
    if not n or len(n) < 5:
        return []
    parts = n.split()
    out = []
    if len(n) >= 6:
        out.append(n)
    if len(parts) >= 2:
        two = parts[0] + " " + parts[1]
        if len(two) >= 6:
            out.append(two)
    # distinctive single tokens (real company names, not 'gold'/'mining')
    if len(parts) >= 1 and len(parts[0]) >= 4 and parts[0] in {
        "bhp", "iluka", "fortescue", "newmont", "anglogold", "glencore",
        "south32", "ozminerals", "evolution", "northern star", "ramelius",
        "regis", "goldfields", "igo", "lynas", "iluka"
    }:
        out.append(parts[0])
    if parts and parts[0] == "rio" and (len(parts) == 1 or parts[1] == "tinto"):
        out.append("rio tinto")
        out.append("rio")
    seen, uniq = set(), []
    for t in out:
        if t not in seen:
            seen.add(t)
            uniq.append(t)
    return uniq


def geom_center(geom):
    if not geom:
        return None
    if geom.get("type") == "Point":
        c = geom.get("coordinates") or []
        return [c[0], c[1]] if len(c) >= 2 else None
    xs = ys = n = 0

    def walk(c):
        nonlocal xs, ys, n
        if not c:
            return
        if isinstance(c[0], (int, float)):
            xs += c[0]
            ys += c[1]
            n += 1
        else:
            for x in c:
                walk(x)

    walk(geom.get("coordinates") or [])
    return [xs / n, ys / n] if n else None


def point_in_ring(x, y, ring):
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y):
            den = yj - yi
            if den != 0 and x < (xj - xi) * (y - yi) / den + xi:
                inside = not inside
        j = i
    return inside


def point_in_hex(x, y, geom):
    if not geom or geom.get("type") != "Polygon":
        return False
    rings = geom.get("coordinates") or []
    if not rings or not point_in_ring(x, y, rings[0]):
        return False
    for hole in rings[1:]:
        if point_in_ring(x, y, hole):
            return False
    return True


def _bbox(geom):
    if not geom:
        return None
    xs, ys = [], []

    def walk(c):
        if isinstance(c[0], (int, float)):
            xs.append(c[0])
            ys.append(c[1])
        else:
            for x in c:
                walk(x)

    walk(geom.get("coordinates") or [])
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def load_titles():
    titles = []
    key_to_titles = defaultdict(list)
    holder_keys = set()
    for st in STATES:
        for life in ("live", "dead"):
            path = os.path.join(APP, "data", f"{st}_{life}.geojson")
            if not os.path.exists(path) or os.path.getsize(path) < 200:
                continue
            with open(path) as f:
                gj = json.load(f)
            for feat in gj.get("features") or []:
                p = feat.get("properties") or {}
                if p.get("demo") in (True, "true", 1, "1"):
                    continue
                name = p.get("name") or ""
                holder = p.get("holder") or ""
                c = geom_center(feat.get("geometry"))
                if not c:
                    continue
                keys = title_keys(st, name)
                rec = {"state": st, "life": life, "name": name, "holder": holder, "lng": c[0], "lat": c[1], "keys": keys}
                if life == "live":
                    titles.append(rec)
                    for k in keys:
                        key_to_titles[k].append(rec)
                    for t in company_lookup_keys(holder):
                        holder_keys.add(t)
                else:
                    # dead holders still useful for company tokens (WA dead omitted anyway)
                    for t in company_lookup_keys(holder):
                        holder_keys.add(t)
    return titles, key_to_titles, holder_keys


def load_hexes():
    with open(os.path.join(APP, "data", "holes_hex.geojson")) as f:
        gj = json.load(f)
    hexes = []
    for feat in gj.get("features") or []:
        p = feat.get("properties") or {}
        if p.get("demo") in (True, "true", 1, "1"):
            continue
        lon, lat = p.get("lon"), p.get("lat")
        if lon is None:
            c = geom_center(feat.get("geometry"))
            if not c:
                continue
            lon, lat = c
        hid = f"{p.get('state')}|{round(float(lon),3)}|{round(float(lat),3)}"
        hexes.append({
            "id": hid, "state": p.get("state"), "lon": float(lon), "lat": float(lat),
            "geom": feat.get("geometry"), "operators": p.get("top_operators") or "",
            "bbox": _bbox(feat.get("geometry")),
        })
    return hexes


def report_url(state, rec):
    if state == "wa":
        a = rec.get("anumber")
        if a is not None and str(a).strip() != "":
            return f"https://wamex.dmp.wa.gov.au/Wamex/Search/ReportDetails?ANumber={a}"
    u = rec.get("url")
    if isinstance(u, str) and u.startswith("http"):
        if state == "wa" and u.rstrip("/").lower() in {
            "https://wamex.dmp.wa.gov.au/wamex",
            "http://wamex.dmp.wa.gov.au/wamex",
        }:
            return ""
        return u
    if state == "qld" and rec.get("id"):
        rid = str(rec["id"])
        if rid.lower().startswith("cr"):
            return f"https://geoscience.data.qld.gov.au/data/report/{rid}"
        return f"https://geoscience.data.qld.gov.au/data/dataset/{rid}"
    return ""


def report_title(rec):
    t = norm_space(rec.get("title") or rec.get("name") or rec.get("identifier") or "")
    if len(t) > 140:
        t = t[:137] + "…"
    return t


def report_year(rec):
    try:
        yi = int(rec.get("year"))
    except (TypeError, ValueError):
        return None
    return yi if 1800 <= yi <= 2030 else None


def report_company(state, rec):
    if state == "wa":
        return norm_space(rec.get("company") or rec.get("operator") or "")
    if state == "vic":
        authors = rec.get("authors") or []
        if isinstance(authors, list) and authors:
            return norm_space(authors[0])
        return ""
    if state == "nsw":
        return norm_space((rec.get("author") or "").split("\n")[0])
    return ""


def report_keys(state, rec):
    if state == "nsw":
        texts = [rec.get("title"), rec.get("location"), rec.get("source")]
    elif state == "qld":
        texts = [rec.get("title"), rec.get("identifier"), rec.get("name")]
    elif state == "wa":
        texts = [rec.get("title"), rec.get("abstract"), rec.get("project")]
    elif state == "nt":
        texts = [rec.get("title"), rec.get("summary")]
    elif state == "tas":
        texts = [rec.get("title")]
    elif state == "vic":
        texts = [rec.get("title")]
        keys = extract_keys("vic", *texts)
        for t in rec.get("related_tenements") or []:
            for k in extract_keys("vic", t):
                if k not in keys:
                    keys.append(k)
            compact = re.sub(r"[^a-z0-9/]", "", str(t).lower())
            if compact:
                kk = f"vic:{compact}"
                if kk not in keys:
                    keys.append(kk)
        return keys
    else:
        return []
    return extract_keys(state, *texts)


def iter_jsonl(path):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def pick_centroid(keys, key_to_titles):
    live = dead = None
    for k in keys:
        for t in key_to_titles.get(k) or []:
            if t["life"] == "live":
                return t
            if dead is None:
                dead = t
    return dead


def slim_item(state, rec, loc):
    title = report_title(rec)
    if not title or title.upper().startswith("DEMO"):
        return None
    year = report_year(rec)
    url = report_url(state, rec)
    item = {"st": state, "t": title, "y": year, "u": url}
    if state == "wa" and rec.get("anumber") is not None:
        item["a"] = rec["anumber"]
        # portal home is already in portals; keep u for honesty
    if loc:
        item["_lx"] = round(loc["lng"], 5)
        item["_ly"] = round(loc["lat"], 5)
        item["_tn"] = loc["name"]
        item["_life"] = loc["life"]
    return item


def take_newest(ids, reports, cap):
    arr = sorted(set(ids), key=lambda i: reports[i].get("y") or 0, reverse=True)
    return arr[:cap], len(arr)


def main():
    print("titles…", flush=True)
    titles, key_to_titles, holder_keys = load_titles()
    print(f"  n={len(titles)} keys={len(key_to_titles)} cos={len(holder_keys)}", flush=True)
    hexes = load_hexes()
    print(f"hexes {len(hexes)}", flush=True)
    hex_ops = defaultdict(list)
    for h in hexes:
        for tok in company_lookup_keys(h["operators"]):
            hex_ops[tok].append(h["id"])

    reports = []
    by_key = defaultdict(list)
    by_co = defaultdict(list)
    seen = set()
    stats = {st: {"read": 0, "tenement": 0, "company": 0} for st in STATES}

    def add(state, rec, keys, via_co):
        if state == "wa":
            ded = f"wa:A{rec.get('anumber')}"
        else:
            ded = report_url(state, rec) or f"{state}:{rec.get('id')}"
        if ded in seen:
            return
        loc = pick_centroid(keys, key_to_titles) if keys else None
        item = slim_item(state, rec, loc)
        if not item:
            return
        seen.add(ded)
        idx = len(reports)
        reports.append(item)
        if keys:
            stats[state]["tenement"] += 1
            for k in keys:
                if k in key_to_titles:
                    by_key[k].append(idx)
        if via_co:
            stats[state]["company"] += 1
            company = report_company(state, rec)
            for tok in company_lookup_keys(company):
                if tok in holder_keys or tok in hex_ops:
                    by_co[tok].append(idx)

    for st in STATES:
        path = os.path.join(HARVEST, "data", st, "reports", "index.jsonl")
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            print(f"{st}: empty", flush=True)
            continue
        print(f"{st}: scan…", flush=True)
        for rec in iter_jsonl(path):
            stats[st]["read"] += 1
            keys = [k for k in report_keys(st, rec) if k in key_to_titles]
            company = report_company(st, rec)
            via_co = False
            if company:
                for tok in company_lookup_keys(company):
                    if tok in holder_keys or tok in hex_ops:
                        via_co = True
                        break
            if not keys and not via_co:
                continue
            add(st, rec, keys, via_co)
        print(f"  {st} read={stats[st]['read']} tenement={stats[st]['tenement']} company={stats[st]['company']}", flush=True)

    print(f"raw kept {len(reports)}", flush=True)

    # hex ← title centroids
    cell = 0.25
    grid = defaultdict(list)
    for i, h in enumerate(hexes):
        gi, gj = int(math.floor(h["lon"] / cell)), int(math.floor(h["lat"] / cell))
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                grid[(gi + di, gj + dj)].append(i)
    hex_ids = defaultdict(list)
    for t in titles:
        gi, gj = int(math.floor(t["lng"] / cell)), int(math.floor(t["lat"] / cell))
        for i in grid.get((gi, gj), []):
            h = hexes[i]
            if h["state"] and t["state"] != h["state"]:
                continue
            bb = h["bbox"]
            if bb and (t["lng"] < bb[0] or t["lng"] > bb[2] or t["lat"] < bb[1] or t["lat"] > bb[3]):
                continue
            if point_in_hex(t["lng"], t["lat"], h["geom"]):
                for k in t["keys"]:
                    hex_ids[h["id"]].extend(by_key.get(k, []))
                break
    hex_by_id = {h["id"]: h for h in hexes}
    for tok, hids in hex_ops.items():
        for idx in by_co.get(tok, []):
            st = reports[idx]["st"]
            for hid in hids:
                if hex_by_id[hid]["state"] == st:
                    hex_ids[hid].append(idx)

    # Cap + remap to referenced reports only
    used = set()
    by_key_c, by_co_c, hex_c = {}, {}, {}
    for k, ids in by_key.items():
        kept, total = take_newest(ids, reports, PER_KEY)
        by_key_c[k] = kept
        if total > PER_KEY:
            by_key_c[k + "#n"] = total
        used.update(kept)
    for k, ids in by_co.items():
        kept, total = take_newest(ids, reports, PER_CO)
        by_co_c[k] = kept
        if total > PER_CO:
            by_co_c[k + "#n"] = total
        used.update(kept)
    for hid, ids in hex_ids.items():
        kept, total = take_newest(ids, reports, PER_HEX)
        if not kept:
            continue
        hex_c[hid] = kept
        if total > PER_HEX:
            hex_c[hid + "#n"] = total
        used.update(kept)

    old_to_new = {}
    slim = []
    for old in sorted(used):
        old_to_new[old] = len(slim)
        r = reports[old]
        item = {"st": r["st"], "t": r["t"], "y": r.get("y"), "u": r.get("u") or ""}
        if r.get("a") is not None:
            item["a"] = r["a"]
        slim.append(item)

    def remap_map(m):
        out = {}
        for k, v in m.items():
            if k.endswith("#n"):
                out[k] = v
            else:
                out[k] = [old_to_new[i] for i in v if i in old_to_new]
        return out

    by_key_c = remap_map(by_key_c)
    by_co_c = remap_map(by_co_c)
    hex_c = remap_map(hex_c)

    # Overlay: one point per title that has tenement-joined reports
    title_bucket = {}
    for k, ids in by_key.items():
        for t in key_to_titles.get(k) or []:
            tk = (t["state"], t["name"], t["life"])
            b = title_bucket.setdefault(tk, {"t": t, "ids": set()})
            b["ids"].update(ids)
    pts = []
    for (st, name, life), b in title_bucket.items():
        ids = b["ids"]
        newest, total = take_newest(ids, reports, TITLE_EX)
        t = b["t"]
        examples = []
        for i in newest:
            if i not in old_to_new:
                continue
            r = reports[i]
            examples.append(old_to_new[i])
        if not examples:
            # still plot if we have a count from tenement join
            if not ids:
                continue
        props = {
            "st": st,
            "tn": name,
            "n": total,
            "life": life,
            "ids": examples,
        }
        pts.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(t["lng"], 5), round(t["lat"], 5)]},
            "properties": props,
        })

    portals = {
        "nsw": {"name": "DIGS", "home": "https://search.geoscience.nsw.gov.au/"},
        "qld": {"name": "GSQ", "home": "https://geoscience.data.qld.gov.au/"},
        "wa": {"name": "WAMEX", "home": "https://wamex.dmp.wa.gov.au/Wamex"},
        "nt": {"name": "GEMIS", "home": "https://geoscience.nt.gov.au/gemis/"},
        "tas": {"name": "MRT", "home": "https://www.mrt.tas.gov.au/products/database_searches/documents_and_reports"},
        "vic": {"name": "GSV", "home": "https://gsv.vic.gov.au/SearchAssistant2/search"},
        "sa": {"name": "SARIG", "home": "https://catalog.sarig.sa.gov.au/csw", "empty": True},
    }

    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "portals": portals,
        "stats": stats,
        "n_reports": len(slim),
        "n_pts": len(pts),
        "reports": slim,
        "by_key": by_key_c,
        "by_co": by_co_c,
        "hex": hex_c,
    }
    with open(OUT_INDEX, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    with open(OUT_PTS, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": pts}, f, ensure_ascii=False, separators=(",", ":"))
    print("index", os.path.getsize(OUT_INDEX), "pts", os.path.getsize(OUT_PTS), "reports", len(slim), "pts", len(pts))
    print("hexes", sum(1 for k in hex_c if not k.endswith("#n")))
    print("STATS", json.dumps(stats, indent=2))
    for hid, ids in hex_c.items():
        if hid.startswith("wa|") and not hid.endswith("#n") and ids:
            print("WA_HEX", hid, [slim[i] for i in ids[:2]])
            break
    for hid, ids in hex_c.items():
        if hid.startswith("nsw|") and not hid.endswith("#n") and ids:
            print("NSW_HEX", hid, slim[ids[0]])
            break
    # QLD title example
    for k, ids in by_key_c.items():
        if k.startswith("qld:epm") and ids:
            print("QLD_KEY", k, slim[ids[0]])
            break


if __name__ == "__main__":
    main()
