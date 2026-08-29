(function () {
  const STATES = [
    { id: "nsw", name: "NSW", color: "#e4572e" },
    { id: "vic", name: "VIC", color: "#76b041" },
    { id: "qld", name: "QLD", color: "#4c78a8" },
    { id: "wa",  name: "WA",  color: "#f58518" },
    { id: "sa",  name: "SA",  color: "#b279a2" },
    { id: "tas", name: "TAS", color: "#54a24b" },
    { id: "nt",  name: "NT",  color: "#ff9da7" }
  ];

  // Approximate state extents used only to decide which live title layers to load.
  // ACT is inside the NSW box and has no titles register.
  const ACT_BBOX = { west: 148.73, south: -35.93, east: 149.40, north: -35.12 };
  const STATE_BBOXES = {
    nsw: { west: 140.99, south: -37.51, east: 153.64, north: -28.16 },
    vic: { west: 140.96, south: -39.16, east: 150.00, north: -33.98 },
    qld: { west: 137.99, south: -29.18, east: 153.55, north: -9.14 },
    wa:  { west: 112.92, south: -35.14, east: 129.00, north: -13.69 },
    sa:  { west: 129.00, south: -38.06, east: 141.00, north: -25.99 },
    tas: { west: 143.82, south: -43.65, east: 148.48, north: -39.20 },
    nt:  { west: 129.00, south: -26.00, east: 138.00, north: -10.97 }
  };
  const OPEN_DISCLAIMER = "This only means no live title in our state registers at this location. Not a grant. Not parks, native title, planning, pastoral or city lots. ACT has no titles register.";
  const API_BASE = "https://xplorr.143.198.52.4.sslip.io";
  const AU_BBOX = { west: 112.0, south: -44.0, east: 154.0, north: -10.0 };
  const LIVE_TITLES_MIN_ZOOM = 6;
  const LIVE_TITLES_SRC = "src-live-api";
  const LIVE_TITLES_FILL = "live-api-fill";
  const LIVE_TITLES_LINE = "live-api-line";
  const COMPANY_SRC = "src-company-api";
  const COMPANY_FILL = "company-api-fill";
  const COMPANY_LINE = "company-api-line";
  const TITLE_LIVE_COLOR = "#00c8ff";
  const TITLE_DEAD_COLOR = "#666666";
  const OCC_HEAT_SRC = "occ-heat";
  const OCC_HEAT_MAX_ZOOM = 8;
  const OCC_CLUSTER_MIN_ZOOM = 7.5;
  const HOLES_COLOR = "#c8ff00";
  const REPORTS_COLOR = "#ff7a1a";
  const AU_COAST_COLOR = "#f2f2f2";
  const AU_STATE_COLOR = "#3a3a3a";

  const KINDS = [
    { id: "granite", label: "granite", color: "#f4b6c2" },
    { id: "felsic_volcanic", label: "felsic volcanic", color: "#f2c14e" },
    { id: "mafic_volcanic", label: "mafic volcanic", color: "#c44e52" },
    { id: "mafic_intrusive", label: "mafic intrusive", color: "#7b5ea7" },
    { id: "ultramafic", label: "ultramafic", color: "#1b7f4e" },
    { id: "sandstone", label: "sandstone", color: "#d4b483" },
    { id: "mudstone", label: "mudstone", color: "#8c7b6b" },
    { id: "carbonate", label: "carbonate", color: "#7ec8c0" },
    { id: "metamorphic", label: "metamorphic", color: "#c47ac0" },
    { id: "alluvium", label: "alluvium", color: "#ffe08a" },
    { id: "other_regolith", label: "other regolith", color: "#c9b896" },
    { id: "mixed", label: "mixed", color: "#7a9e7e" },
    { id: "other", label: "other", color: "#9aa0a6" }
  ];


  // Mineral types from occ.json comm tokens (not invented). Titles have no commodity field.
  const MINERALS = [
    { id: "gold", label: "gold", color: "#ffd000" },
    { id: "copper", label: "copper", color: "#ff7a1a" },
    { id: "silver", label: "silver", color: "#00e5ff" },
    { id: "iron", label: "iron", color: "#ff2d2d" },
    { id: "lead", label: "lead", color: "#ff2bd6" },
    { id: "zinc", label: "zinc", color: "#3d9cff" },
    { id: "tin", label: "tin", color: "#ffb020" },
    { id: "nickel", label: "nickel", color: "#00e0b8" },
    { id: "coal", label: "coal", color: "#7b5cff" },
    { id: "lithium", label: "lithium", color: "#b44dff" },
    { id: "uranium", label: "uranium", color: "#b8ff00" },
    { id: "manganese", label: "manganese", color: "#ff6ec7" },
    { id: "tungsten", label: "tungsten", color: "#4d7cff" },
    { id: "diamond", label: "diamond", color: "#7affd6" },
    { id: "construction", label: "construction", color: "#ffc46b" },
    { id: "other", label: "other", color: "#ff3d8a" }
  ];

  // Verified from data/occ.json comm tokens via MINERAL_EXACT / phrases (2026-08-20 pack).
  const MINERAL_COUNTS = {
    gold: 60139,
    other: 19164,
    construction: 17497,
    silver: 14041,
    copper: 13009,
    tin: 8868,
    lead: 5441,
    iron: 4651,
    zinc: 3789,
    nickel: 2353,
    tungsten: 2316,
    diamond: 1667,
    manganese: 1597,
    uranium: 1358,
    coal: 1294,
    lithium: 694
  };
  const MINERAL_RAIL_TOP = 6;

  const MINERAL_EXACT = {
    au: "gold", gold: "gold",
    cu: "copper", copper: "copper",
    ag: "silver", silver: "silver",
    fe: "iron", iron: "iron", "iron ore": "iron", mag: "iron", magnetite: "iron",
    feore: "iron", fe2o3: "iron", "iron oxides - magnetite": "iron", "iron oxides": "iron",
    pb: "lead", lead: "lead",
    zn: "zinc", zinc: "zinc",
    sn: "tin", tin: "tin", sno2: "tin",
    ni: "nickel", nickel: "nickel",
    coal: "coal", "coal -general": "coal", "coal - general": "coal",
    "thermal coal": "coal", "coal-general": "coal",
    li: "lithium", lithium: "lithium",
    u: "uranium", uranium: "uranium",
    mn: "manganese", manganese: "manganese",
    w: "tungsten", tungsten: "tungsten",
    dmd: "diamond", diamond: "diamond", "diamond - gem": "diamond",
    "unprocessed construction materials": "construction",
    "gravel - aggregate": "construction", gvl: "construction", sd: "construction",
    sand: "construction", "sand - construction": "construction",
    "sand and gravel": "construction", gravel: "construction",
    "gravel - undifferentiated": "construction",
    "coarse aggregate - hard rock": "construction",
    "coarse aggregate - river gravel": "construction",
    "coarse aggregate": "construction",
    "coarse aggregate - armour stone": "construction",
    "coarse aggregate - sandstone": "construction",
    agg: "construction", aggc: "construction",
    gv: "construction", qr: "construction", aggreg: "construction",
    "quarry rock": "construction", "building stone": "construction",
    "foundry sand": "construction", "silica sand": "construction",
    cnc: "coal"
  };

  const MINERAL_PHRASES = [
    ["gold", ["gold"]],
    ["copper", ["copper"]],
    ["silver", ["silver"]],
    ["iron", ["iron", "magnetite"]],
    ["lead", ["lead"]],
    ["zinc", ["zinc"]],
    ["tin", ["tin"]],
    ["nickel", ["nickel"]],
    ["coal", ["coal"]],
    ["lithium", ["lithium"]],
    ["uranium", ["uranium"]],
    ["manganese", ["manganese"]],
    ["tungsten", ["tungsten"]],
    ["diamond", ["diamond"]],
    ["construction", ["construction", "aggregate", "gravel"]]
  ];

  const statusEl = document.getElementById("status");
  const liveBox = document.getElementById("live-toggles");
  const deadBox = document.getElementById("dead-toggles");
  const deadMaster = document.getElementById("dead-master");
  const osmToggle = document.getElementById("osm");
  const gaToggle = document.getElementById("ga-geol");
  const kindsMaster = document.getElementById("geo-kinds");
  const kindBox = document.getElementById("kind-toggles");
  const geoSearch = document.getElementById("geo-search");
  const kindsAll = document.getElementById("kinds-all");
  const kindsNone = document.getElementById("kinds-none");
  const mineralBox = document.getElementById("mineral-toggles");
  const minsAll = document.getElementById("mins-all");
  const minsNone = document.getElementById("mins-none");
  const occMaster = document.getElementById("occ-master");
  const occBox = document.getElementById("occ-toggles");
  const holesMaster = document.getElementById("holes-master");
  const holesBox = document.getElementById("holes-toggles");
  const holesLegend = document.getElementById("holes-legend");
  const gchemMaster = document.getElementById("gchem-master");
  const gchemBox = document.getElementById("gchem-toggles");
  const gchemLegend = document.getElementById("gchem-legend");
  const findInput = document.getElementById("find");
  const findResults = document.getElementById("find-results");
  const statusLine = document.getElementById("status-line");
  const legendLive = document.getElementById("legend-live");
  const apiChip = document.getElementById("api-chip");
  const liveMaster = document.getElementById("live-master");
  const mineralRail = document.getElementById("mineral-rail");
  const mineralMore = document.getElementById("mineral-more");
  const mineralMoreBtn = document.getElementById("mineral-more-btn");
  const occMinerals = document.getElementById("occ-minerals");
  const auOutline = document.getElementById("au-outline");
  const auStates = document.getElementById("au-states");
  const demoBanner = document.getElementById("demo-banner");
  const railToggle = document.getElementById("rail-toggle");
  const panelEl = document.getElementById("panel");
  const layerFilter = document.getElementById("layer-filter");

  let manifest = null;
  const layerMeta = {};
  let geoLoaded = false;
  let geoLoading = false;
  let overlayManifest = null;
  let occPack = null;
  let occLoaded = false;
  let occLoading = false;
  let occLoadPromise = null;
  let holesLoaded = false;
  let holesLoading = false;
  let gchemLoaded = false;
  let gchemLoading = false;
  const hexLoadPromise = { holes: null, gchem: null };
  let geoLoadPromise = null;
  let findQuery = "";
  const liveLoad = {};
  const liveTitleIndex = {};
  let openGroundMode = false;
  let lastOpenPoint = null;
  let occIndexed = false;
  let holesIndexed = false;
  let gchemIndexed = false;
  let findUserPicked = false;
  const findHexKinds = { holes: false, gchem: false };
  const findIndex = [];
  const FIND_LIST_CAP = { title: 30, occ: 20, holes: 12, gchem: 12 };
  let apiStatus = { live: false, checked: false, health: null, error: "" };
  let liveTitlesUsingApi = false;
  let liveTitlesTimer = null;
  let liveTitlesSeq = 0;
  let findApiSeq = 0;
  let identifySeq = 0;
  let companyApiCache = {};
  let lastLiveTitlesTruncated = false;
  const DEMO_NA = "DEMO — n/a";
  const DEMO_HOLDERS = [
    "DEMO Acme Gold Pty Ltd",
    "DEMO Southern Cross Minerals Pty Ltd",
    "DEMO Outback Exploration Pty Ltd",
    "DEMO Ironbark Resources Ltd",
    "DEMO Nullarbor Metals Pty Ltd",
    "DEMO Copperhead Mining Pty Ltd",
    "DEMO Red Earth Prospecting Pty Ltd"
  ];

  function log(msg) {
    if (statusEl) statusEl.textContent = msg;
    if (statusLine) {
      const first = String(msg || "").split("\n")[0];
      statusLine.textContent = first;
    }
  }

  function updateApiChip() {
    if (!apiChip) return;
    if (!apiStatus.checked) {
      apiChip.textContent = "Checking register…";
      apiChip.className = "api-chip";
      return;
    }
    if (apiStatus.live && apiStatus.health) {
      const n = Number(apiStatus.health.titles || 0);
      apiChip.textContent = "Live";
      apiChip.className = "api-chip live";
      apiChip.title = "Read-only national register · " + n.toLocaleString() + " titles · " +
        Number(apiStatus.health.holes || 0).toLocaleString() + " holes · " +
        Number(apiStatus.health.occs || 0).toLocaleString() + " occurrences";
    } else {
      apiChip.textContent = "Offline";
      apiChip.className = "api-chip offline";
      apiChip.title = apiStatus.error
        ? "Register unreachable: " + apiStatus.error + ". Using frozen GeoJSON title packs."
        : "Register unreachable. Using frozen GeoJSON title packs.";
    }
  }

  function apiUrl(path, params) {
    const u = new URL(path, API_BASE);
    Object.keys(params || {}).forEach(function (k) {
      const v = params[k];
      if (v != null && v !== "") u.searchParams.set(k, v);
    });
    return u.toString();
  }

  function fetchApi(path, params, timeoutMs) {
    const ctrl = new AbortController();
    const ms = timeoutMs || 15000;
    const timer = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(apiUrl(path, params), { signal: ctrl.signal })
      .then(function (r) {
        if (!r.ok) throw new Error(path + " HTTP " + r.status);
        return r.json();
      })
      .finally(function () { clearTimeout(timer); });
  }

  function checkApiHealth() {
    return fetchApi("/health", null, 8000).then(function (h) {
      if (!h || !h.ok) throw new Error("health not ok");
      apiStatus = { live: true, checked: true, health: h, error: "" };
      updateApiChip();
      return true;
    }).catch(function (err) {
      apiStatus = {
        live: false,
        checked: true,
        health: null,
        error: (err && err.name === "AbortError") ? "timeout" : ((err && err.message) || "offline")
      };
      updateApiChip();
      return false;
    });
  }

  function emptyFC() {
    return { type: "FeatureCollection", features: [] };
  }

  function bboxParam(b) {
    return [b.west, b.south, b.east, b.north].map(function (n) {
      return Number(n).toFixed(5);
    }).join(",");
  }

  function mapBbox() {
    const b = map.getBounds();
    return {
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth()
    };
  }

  function liveTitlesLimit(zoom) {
    if (zoom < LIVE_TITLES_MIN_ZOOM) return 0;
    if (zoom < 7) return 200;
    if (zoom < 8.5) return 500;
    return 2000;
  }

  function jurisdictionToState(j) {
    return String(j || "").trim().toLowerCase();
  }

  function commercialUseBlocked(props) {
    const v = props && props.commercial_use;
    return v === false || v === "false" || v === 0 || v === "0";
  }

  function commercialUseRow(props) {
    if (!props) return null;
    if (commercialUseBlocked(props)) {
      const lic = String(props.licence || "CC BY-NC").trim();
      return ["Licence", lic + " — not for commercial use"];
    }
    if (!isBlank(props.licence)) return ["Licence", props.licence];
    return null;
  }

  function normalizeTitleProps(p) {
    p = p || {};
    return Object.assign({}, p, {
      state: jurisdictionToState(p.state || p.jurisdiction),
      tenure: p.tenure || p.tenure_type || "",
      grant: p.grant || p.grant_date || "",
      expiry: p.expiry || p.expiry_date || "",
      status: p.status || "",
      holder: p.holder || "",
      name: p.name || "",
      licence: p.licence || "",
      commercial_use: p.commercial_use
    });
  }

  function commFromProps(p) {
    if (!isBlank(p.comm)) return String(p.comm);
    const c = p.commodities;
    if (Array.isArray(c)) return c.filter(Boolean).join(", ");
    if (typeof c === "string") {
      const s = c.trim();
      if (!s) return "";
      if (s.charAt(0) === "[") {
        try {
          const arr = JSON.parse(s);
          if (Array.isArray(arr)) return arr.filter(Boolean).join(", ");
        } catch (e) {}
      }
      return s;
    }
    return "";
  }

  function normalizeOccProps(p) {
    p = p || {};
    return Object.assign({}, p, {
      state: jurisdictionToState(p.state || p.jurisdiction),
      name: p.name || "",
      comm: commFromProps(p),
      kind: p.kind || "",
      status: p.status || "",
      size: p.size || p.size_cat || "",
      licence: p.licence || "",
      commercial_use: p.commercial_use,
      sid: p.sid || p.native_id || ""
    });
  }

  function normalizeTitleFeature(f) {
    if (!f) return f;
    return {
      type: "Feature",
      id: f.id,
      geometry: f.geometry,
      properties: normalizeTitleProps(f.properties || {})
    };
  }

  function normalizeTitleCollection(gj) {
    return {
      type: "FeatureCollection",
      features: ((gj && gj.features) || []).map(normalizeTitleFeature)
    };
  }

  function titleItemFromProps(p, lng, lat) {
    p = normalizeTitleProps(p);
    return {
      kind: "title",
      state: p.state,
      life: String(p.status || "live").toLowerCase() === "dead" ? "dead" : "live",
      name: p.name || "",
      holder: p.holder || "",
      tenure: p.tenure || "",
      lng: lng,
      lat: lat,
      props: p
    };
  }

  function occItemFromProps(p, lng, lat) {
    p = normalizeOccProps(p);
    return {
      kind: "occ",
      state: p.state,
      name: p.name || "",
      comm: p.comm || "",
      lng: lng,
      lat: lat,
      props: p
    };
  }

  function featureCenter(f) {
    if (!f) return null;
    if (f.geometry) return geomCenter(f.geometry);
    const p = f.properties || {};
    if (p.lng != null && p.lat != null) return [Number(p.lng), Number(p.lat)];
    if (p.lon != null && p.lat != null) return [Number(p.lon), Number(p.lat)];
    return null;
  }

  function selectedLiveStates() {
    if (liveMaster && !liveMaster.checked) return [];
    const out = [];
    STATES.forEach(function (s) {
      const inp = liveBox ? liveBox.querySelector('input[data-state="' + s.id + '"][data-life="live"]') : null;
      if (inp && inp.checked && !inp.disabled) out.push(s.id);
    });
    return out;
  }

  function titlePaintColor(life) {
    return life === "dead" ? TITLE_DEAD_COLOR : TITLE_LIVE_COLOR;
  }

  function setLayerVisible(id, on) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  }

  function mineralsByCount() {
    return MINERALS.slice().sort(function (a, b) {
      return (MINERAL_COUNTS[b.id] || 0) - (MINERAL_COUNTS[a.id] || 0);
    });
  }

  function mineralLabel(m) {
    const s = m.label || m.id;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function mineralInputs() {
    const root = occMinerals || mineralBox;
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll('input[data-mineral]'));
  }

  function mineralColor(id) {
    for (let i = 0; i < MINERALS.length; i++) {
      if (MINERALS[i].id === id) return MINERALS[i].color;
    }
    return "#ff3d8a";
  }

  function occFamilyColor() {
    const ids = selectedMinerals();
    return mineralColor(ids[0] || "gold");
  }

  function mineralColorExpr() {
    const expr = ["match", ["get", "min"]];
    MINERALS.forEach(function (m) {
      expr.push(m.id, m.color);
    });
    expr.push("#ff3d8a");
    return expr;
  }

  function primaryMineral(types, selected) {
    const allow = {};
    (selected && selected.length ? selected : types).forEach(function (id) { allow[id] = true; });
    const order = mineralsByCount();
    for (let i = 0; i < order.length; i++) {
      if (types.indexOf(order[i].id) !== -1 && allow[order[i].id]) return order[i].id;
    }
    return types[0] || "other";
  }

  function hexToRgb(hex) {
    const h = String(hex || "#ff3d8a").replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16) || 0,
      g: parseInt(h.slice(2, 4), 16) || 0,
      b: parseInt(h.slice(4, 6), 16) || 0
    };
  }

  function rgbStr(c) {
    return c.r + "," + c.g + "," + c.b;
  }

  function hotterRgb(hex) {
    const c = hexToRgb(hex);
    const mx = Math.max(c.r, c.g, c.b, 1);
    const boost = 255 / mx;
    return {
      r: Math.min(255, Math.round(c.r * boost * 0.92 + 20)),
      g: Math.min(255, Math.round(c.g * boost * 0.92 + 20)),
      b: Math.min(255, Math.round(c.b * boost * 0.92 + 20))
    };
  }

  function occLayerIds() {
    return MINERALS.map(function (m) { return "occ-heat-" + m.id; }).concat([
      "occ-clusters",
      "occ-cluster-count",
      "occ-point",
      "occ-dots",
      "occ-sec-point"
    ]);
  }

  function updateDemoBanner() {
    if (!demoBanner) return;
    const occOn = occMaster && occMaster.checked;
    const holesOn = holesMaster && holesMaster.checked;
    if (!occOn && !holesOn) {
      demoBanner.hidden = true;
      return;
    }
    demoBanner.hidden = false;
    if (occOn && holesOn) demoBanner.textContent = "SA occurrences and QLD hole cells include DEMO fill.";
    else if (occOn) demoBanner.textContent = "SA occurrences are a small DEMO set.";
    else demoBanner.textContent = "QLD hole cells include DEMO fill.";
  }

  function setRailOpen(open) {
    document.body.classList.toggle("rail-open", !!open);
    if (railToggle) railToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function addAustraliaBase() {
    if (!map.getSource("au-coast")) {
      map.addSource("au-coast", { type: "geojson", data: "data/australia_coast.geojson" });
      map.addSource("au-states", { type: "geojson", data: "data/australia_states.geojson" });
      map.addLayer({
        id: "au-states",
        type: "line",
        source: "au-states",
        paint: {
          "line-color": AU_STATE_COLOR,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.55, 8, 0.8],
          "line-opacity": 0.95
        }
      });
      map.addLayer({
        id: "au-coast",
        type: "line",
        source: "au-coast",
        paint: {
          "line-color": AU_COAST_COLOR,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.25, 7, 1.0, 11, 0.7],
          "line-opacity": 1
        }
      });
    }
    setLayerVisible("au-coast", !auOutline || auOutline.checked);
    setLayerVisible("au-states", !auStates || auStates.checked);
  }

  const apiHealthPromise = checkApiHealth();

  function layerId(state, life) {
    return state + "-" + life;
  }

  function sourceId(state, life) {
    return "src-" + state + "-" + life;
  }

  const baseStyle = {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#000000" }
      }
    ]
  };

  const map = new maplibregl.Map({
    container: "map",
    style: baseStyle,
    center: [134.0, -26.5],
    zoom: 4.1,
    maxZoom: 14,
    fadeDuration: 0,
    attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }));

  let layerBusyGen = 0;

  function showLayerBusy(msg, row) {
    layerBusyGen += 1;
    const gen = layerBusyGen;
    const rows = document.querySelectorAll(".row.busy");
    for (let i = 0; i < rows.length; i++) rows[i].classList.remove("busy");
    if (row) row.classList.add("busy");
    const chip = document.getElementById("map-busy");
    const text = document.getElementById("map-busy-text");
    if (text) text.textContent = msg || "Updating map…";
    if (chip) chip.hidden = false;
    return gen;
  }

  function hideLayerBusy(gen) {
    if (gen != null && gen !== layerBusyGen) return;
    const rows = document.querySelectorAll(".row.busy");
    for (let i = 0; i < rows.length; i++) rows[i].classList.remove("busy");
    const chip = document.getElementById("map-busy");
    if (chip) chip.hidden = true;
  }

  function nextPaint() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function waitMapIdle(gen) {
    const finish = function () { hideLayerBusy(gen); };
    if (!map || typeof map.once !== "function") {
      finish();
      return;
    }
    let settled = false;
    const once = function () {
      if (settled) return;
      settled = true;
      finish();
    };
    try {
      map.once("idle", once);
    } catch (err) {
      once();
      return;
    }
    setTimeout(once, 5000);
  }

  function withLayerBusy(msg, row, work) {
    const gen = showLayerBusy(msg, row);
    return nextPaint()
      .then(function () { return work(); })
      .then(function () { waitMapIdle(gen); })
      .catch(function (err) {
        hideLayerBusy(gen);
        throw err;
      });
  }

  const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "400px" });

  function isBlank(v) {
    return v == null || String(v).trim() === "";
  }

  function demoHolder(seed) {
    const s = String(seed || "x");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return DEMO_HOLDERS[h % DEMO_HOLDERS.length];
  }

  function fillField(v, fallback) {
    if (!isBlank(v)) return String(v);
    return fallback;
  }

  function popupRowsHtml(rows) {
    return rows
      .map(function (r) {
        const demo = String(r[1]).indexOf("DEMO") === 0;
        return (
          '<div class="popup-row"><span>' +
          escapeHtml(r[0]) +
          "</span><span" +
          (demo ? ' class="popup-demo"' : "") +
          ">" +
          escapeHtml(String(r[1])) +
          "</span></div>"
        );
      })
      .join("");
  }

  function popupWrap(kicker, title, rows, kickerClass) {
    return (
      (kicker ? '<div class="popup-kicker' + (kickerClass ? " " + kickerClass : "") + '">' + escapeHtml(kicker) + "</div>" : "") +
      '<div class="popup-title">' +
      escapeHtml(String(title)) +
      "</div>" +
      popupRowsHtml(rows)
    );
  }

  function popupHtml(props) {
    props = normalizeTitleProps(props || {});
    const seed = props.name || props.tenure || props.state || "";
    const name = fillField(props.name, "DEMO unnamed title");
    const rows = [
      ["State", fillField(props.state ? String(props.state).toUpperCase() : "", DEMO_NA)],
      ["Tenure", fillField(props.tenure, DEMO_NA)],
      ["Status", fillField(props.status, "DEMO current")],
      ["Name", name],
      ["Holder", fillField(props.holder, demoHolder(seed))],
      ["Grant", fillField(props.grant, DEMO_NA)],
      ["Expiry", fillField(props.expiry, DEMO_NA)]
    ];
    const lic = commercialUseRow(props);
    if (lic) rows.push(lic);
    return popupWrap("Title", name, rows);
  }

  function geoPopupHtml(props) {
    const name = fillField(props.name, "DEMO unnamed unit");
    const rows = [
      ["State", fillField(props.state, DEMO_NA)],
      ["Kind", fillField(props.kind, DEMO_NA)],
      ["Unit", name],
      ["Source", fillField(props.source, DEMO_NA)]
    ];
    return popupWrap("Geology", name, rows);
  }

  function gaPopupHtml(props) {
    const pick = [
      ["Name", fillField(props.NAME || props.NAMEU || props.UNITNAME || props.STRATNAME || props.name, "DEMO unnamed unit")],
      ["Lithology", fillField(props.LITHNAME || props.LITHDESC || props.LITHOLOGY, DEMO_NA)],
      ["Age", fillField(props.AGE || props.AGE_NAME || props.MAXAGE, DEMO_NA)],
      ["Symbol", fillField(props.MAPSYMBOL || props.SYMBOL || props.GLCODE, DEMO_NA)],
      ["Layer", fillField(props.layer || props.LAYER, DEMO_NA)]
    ];
    const extra = Object.keys(props || {}).filter(function (k) {
      return pick.every(function (r) { return r[0] !== k; }) && props[k] != null && String(props[k]).trim() !== "";
    }).slice(0, 6);
    const rows = pick.concat(extra.map(function (k) { return [k, props[k]]; }));
    return popupWrap("Geology", "GA surface geology", rows);
  }

  function occRowDemo(r) {
    return isDemoFlag(r && r[7]);
  }

  function occRowPri(r) {
    return r && (r[16] === 1 || r[16] === true || r[16] === "1");
  }

  function occProps(r) {
    return {
      state: r[0],
      name: r[3] || "",
      comm: r[4] || "",
      kind: r[5] || "",
      status: r[6] || "",
      demo: occRowDemo(r),
      field: r[8] || "",
      work: r[9] || "",
      host: r[10] || "",
      style: r[11] || "",
      size: r[12] || "",
      prod: r[13] || "",
      sid: r[14] || "",
      url: r[15] || "",
      pri: occRowPri(r)
    };
  }

  function occPopupHtml(props) {
    const demo = isDemoFlag(props.demo);
    const name = demo
      ? fillField(props.name, "DEMO unnamed occurrence")
      : (isBlank(props.name) ? "Unnamed occurrence" : String(props.name));
    const rows = [];
    function add(label, val, force) {
      if (demo) {
        rows.push([label, fillField(val, DEMO_NA)]);
        return;
      }
      if (force || !isBlank(val)) rows.push([label, val]);
    }
    add("State", props.state ? String(props.state).toUpperCase() : "", true);
    add("Commodity", props.comm);
    add("Type", props.kind);
    add("Status", props.status);
    add("Field", props.field);
    add("Workings", props.work);
    add("Host", props.host);
    add("Style", props.style);
    add("Size", props.size);
    add("Production", props.prod);
    add("Source id", props.sid);
    const lic = commercialUseRow(props);
    if (lic) rows.push(lic);
    else if (String(props.state || "").toLowerCase() === "wa") {
      rows.push(["Licence", "WA MINEDEX CC BY-NC 4.0 — not for commercial use"]);
    } else if (demo) {
      rows.push(["Licence", DEMO_NA]);
    }
    if (demo) rows.push(["Note", "DEMO — not a real occurrence"]);
    let html = popupWrap("Occurrence", name, rows);
    const href = safeHttpUrl(props.url);
    if (href) {
      html +=
        '<div class="popup-links"><a class="popup-link" href="' +
        escapeHtml(href) +
        '" target="_blank" rel="noopener">Source record</a></div>';
    }
    return html;
  }

  function hexPopupHtml(props, label) {
    const demo = props.demo === true || props.demo === "true" || props.demo === 1;
    const nStr = props.n != null ? Number(props.n).toLocaleString() : DEMO_NA;
    const st = props.state ? String(props.state).toUpperCase() : DEMO_NA;
    const unit = label === "Holes" ? "holes" : "samples";
    const title = (demo ? "DEMO " : "") + nStr + " " + unit + " · " + st + " · ~20 km cell";
    let depth = "";
    if (props.depth_min != null && props.depth_max != null) {
      depth = Number(props.depth_min) + "–" + Number(props.depth_max) + " m";
      if (props.depth_med != null) depth += " (median " + Number(props.depth_med) + ")";
    }
    let years = "";
    if (props.year_min != null && props.year_max != null) {
      years = String(props.year_min) + "–" + String(props.year_max);
    } else if (props.year_min != null) {
      years = String(props.year_min);
    }
    const ids = props.sample_hole_ids || props.sample_ids || "";
    const rows = [
      ["Depth", fillField(depth, DEMO_NA)],
      ["Drilled", fillField(years, DEMO_NA)],
      ["Types", fillField(props.top_types, DEMO_NA)],
      ["Operators", fillField(props.top_operators, DEMO_NA)],
      [label === "Holes" ? "Targets" : "Elements", fillField(props.top_commodities, DEMO_NA)],
      ["Examples", fillField(ids, DEMO_NA)]
    ];
    if (demo) rows.push(["Note", "DEMO — not real harvest density"]);
    return popupWrap(label, title, rows);
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }


  function geomCenter(geom) {
    if (!geom) return null;
    if (geom.type === "Point") return geom.coordinates;
    let xs = 0, ys = 0, n = 0;
    function walk(c) {
      if (typeof c[0] === "number") { xs += c[0]; ys += c[1]; n++; }
      else c.forEach(walk);
    }
    walk(geom.coordinates || []);
    return n ? [xs / n, ys / n] : null;
  }

  function isDemoFlag(v) {
    return v === true || v === "true" || v === 1 || v === "1";
  }

  function isDemoString(v) {
    return String(v || "").trim().toUpperCase().indexOf("DEMO") === 0;
  }

  function addSearchText(out, v) {
    const s = String(v == null ? "" : v).trim();
    if (!s || isDemoString(s)) return;
    out.push(s.toLowerCase());
  }

  function findTexts(it) {
    const p = it.props || {};
    const out = [];
    if (it.kind === "title") {
      addSearchText(out, it.name || p.name);
      addSearchText(out, it.tenure || p.tenure);
      addSearchText(out, it.holder || p.holder);
      addSearchText(out, p.licensee);
      addSearchText(out, p.operator);
      addSearchText(out, p.company);
    } else if (it.kind === "occ") {
      addSearchText(out, it.name || p.name);
      addSearchText(out, it.comm || p.comm);
      addSearchText(out, p.company);
      addSearchText(out, p.operator);
      addSearchText(out, p.owner);
    } else {
      addSearchText(out, p.top_operators || it.operator);
      addSearchText(out, p.company);
      addSearchText(out, p.operator);
    }
    return out;
  }

  function itemIsDemo(it) {
    const p = it.props || {};
    return isDemoFlag(it.demo) || isDemoFlag(p.demo);
  }

  function itemMatches(it, q) {
    if (!q || itemIsDemo(it)) return false;
    const texts = findTexts(it);
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].indexOf(q) !== -1) return true;
    }
    return false;
  }

  function occRowMatches(r, q) {
    if (!q) return true;
    if (occRowDemo(r)) return false;
    const texts = [];
    addSearchText(texts, r[3]);
    addSearchText(texts, r[4]);
    addSearchText(texts, r[8]);
    addSearchText(texts, r[14]);
    addSearchText(texts, r.company);
    addSearchText(texts, r.operator);
    addSearchText(texts, r.owner);
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].indexOf(q) !== -1) return true;
    }
    return false;
  }

  function titleSearchFilter(q) {
    return [
      "any",
      ["in", q, ["downcase", ["to-string", ["get", "name"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "holder"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "tenure"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "licensee"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "operator"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "company"]]]]
    ];
  }

  function hexCompanyFilter(q) {
    return [
      "any",
      ["in", q, ["downcase", ["to-string", ["get", "top_operators"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "company"]]]],
      ["in", q, ["downcase", ["to-string", ["get", "operator"]]]]
    ];
  }

  function indexTitleFeatures(state, life, gj) {
    (gj.features || []).forEach(function (f) {
      const p = f.properties || {};
      if (isDemoFlag(p.demo)) return;
      const c = geomCenter(f.geometry);
      if (!c) return;
      findIndex.push({
        kind: "title",
        state: state,
        life: life,
        name: p.name || "",
        holder: p.holder || "",
        tenure: p.tenure || "",
        lng: c[0],
        lat: c[1],
        demo: isDemoFlag(p.demo),
        props: p
      });
        if (p.holder && !isDemoString(p.holder)) titleHolders.push(p.holder);
    });
  }

  function indexOccurrences(pack) {
    if (occIndexed) return;
    occIndexed = true;
    (pack.rows || []).forEach(function (r) {
      const props = occProps(r);
      findIndex.push({
        kind: "occ",
        state: r[0],
        name: props.name,
        comm: props.comm,
        lng: r[1],
        lat: r[2],
        demo: props.demo,
        props: props
      });
    });
  }

  function indexHexFeatures(kind, gj) {
    if (kind === "holes" && holesIndexed) return;
    if (kind === "gchem" && gchemIndexed) return;
    if (kind === "holes") holesIndexed = true;
    else gchemIndexed = true;
    (gj.features || []).forEach(function (f) {
      const p = f.properties || {};
      if (isDemoFlag(p.demo)) return;
      let lng = p.lon;
      let lat = p.lat;
      if (lng == null || lat == null) {
        const c = geomCenter(f.geometry);
        if (!c) return;
        lng = c[0];
        lat = c[1];
      }
      findIndex.push({
        kind: kind,
        state: p.state || "",
        name: (p.n != null ? Number(p.n).toLocaleString() + " " : "") + (kind === "holes" ? "holes" : "samples"),
        operator: p.top_operators || "",
        lng: lng,
        lat: lat,
        demo: isDemoFlag(p.demo),
        props: p
      });
    });
  }

  function ensureOccurrencesOn() {
    syncOccFromMinerals();
  }

  function occBusyMessage(input) {
    const selected = selectedMinerals();
    if (!selected.length) return null;
    const id = input && input.getAttribute ? input.getAttribute("data-mineral") : "";
    if (!occLoaded) {
      return id ? "Loading " + mineralLabel({ id: id, label: id }) + "…" : "Loading occurrences…";
    }
    if (input && input.checked) {
      return id ? "Loading " + mineralLabel({ id: id, label: id }) + "…" : "Updating map…";
    }
    return "Updating map…";
  }

  function syncOccFromMinerals(msg, row) {
    const ids = selectedMinerals();
    if (occMaster) occMaster.checked = ids.length > 0;
    if (ids.length) {
      if (occBox) occBox.classList.remove("disabled");
      if (msg) {
        void withLayerBusy(msg, row, function () { return loadOccurrences(); });
      } else {
        loadOccurrences();
      }
      if (map.getLayer("occ-clusters")) {
        map.setPaintProperty("occ-clusters", "circle-color", occFamilyColor());
      }
    } else {
      applyOccFilter();
    }
    updateLegend();
    updateDemoBanner();
  }

  function applyLayerFilterPair(fill, line, filter) {
    if (map.getLayer(fill)) map.setFilter(fill, filter);
    if (map.getLayer(line)) map.setFilter(line, filter);
  }

  function applyTitleSearch(q) {
    if ((vsPair && vsPair[0] && vsPair[1]) || (ground && (ground.company || (ground.titles && ground.titles.length)))) {
      applyGroundFilters();
      return;
    }
    STATES.forEach(function (s) {
      ["live", "dead"].forEach(function (life) {
        const fill = layerId(s.id, life) + "-fill";
        const line = layerId(s.id, life) + "-line";
        if (!map.getLayer(fill)) return;
        if (!q) {
          map.setFilter(fill, null);
          map.setFilter(line, null);
          return;
        }
        const f = titleSearchFilter(q);
        map.setFilter(fill, f);
        map.setFilter(line, f);
      });
    });
    applyLiveApiStateFilter(q);
  }

  function fitFindHits(hits) {
    const pts = [];
    for (let i = 0; i < hits.length; i++) {
      const it = hits[i];
      if (it && it.lng != null && it.lat != null) pts.push(it);
    }
    if (!pts.length) return;
    if (pts.length === 1) {
      map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: Math.max(map.getZoom(), 8) });
      return;
    }
    let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
    const cap = 1200;
    const step = pts.length > cap ? Math.ceil(pts.length / cap) : 1;
    for (let i = 0; i < pts.length; i += step) {
      const lng = Number(pts[i].lng);
      const lat = Number(pts[i].lat);
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
    if (minLng === maxLng) { minLng -= 0.2; maxLng += 0.2; }
    if (minLat === maxLat) { minLat -= 0.2; maxLat += 0.2; }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: 48,
      maxZoom: 9,
      duration: 700
    });
  }

  function ensureLiveTitleOn(stateId) {
    if (!liveBox) return;
    const inp = liveBox.querySelector('input[data-state="' + stateId + '"][data-life="live"]');
    if (!inp || inp.disabled || inp.checked) return;
    inp.checked = true;
    const st = STATES.find(function (x) { return x.id === stateId; });
    if (!st) return;
    addStateLayers(stateId, "live", st.color).then(function (ok) {
      if (!ok) return;
      setVisible(stateId, "live", true);
      if (findQuery) applyTitleSearch(findQuery);
      updateLegend();
    });
  }

  function ensureOverlayStateOn(box, kind, stateId) {
    if (!box) return;
    const inp = box.querySelector('input[data-ov="' + kind + '"][data-state="' + stateId + '"]');
    if (inp && !inp.disabled) inp.checked = true;
  }

  function enableHexLayer(kind) {
    const master = kind === "holes" ? holesMaster : gchemMaster;
    const box = kind === "holes" ? holesBox : gchemBox;
    const legend = kind === "holes" ? holesLegend : gchemLegend;
    if (master && !master.checked) {
      master.checked = true;
      if (box) box.classList.remove("disabled");
      if (legend) legend.hidden = false;
      const more = document.getElementById("more-group");
      if (more) more.open = true;
    }
    const loaded = kind === "holes" ? holesLoaded : gchemLoaded;
    if (loaded) applyHexFilter(kind);
    else {
      const label = kind === "holes" ? "Loading drilling…" : "Loading samples…";
      void withLayerBusy(label, null, function () { return loadHex(kind); });
    }
    updateLegend();
  }

  function enableOccLayer() {
    if (occMaster && !occMaster.checked) {
      occMaster.checked = true;
      if (occBox) occBox.classList.remove("disabled");
    }
    if (occLoaded) applyOccFilter();
    else void withLayerBusy("Loading occurrences…", null, function () { return loadOccurrences(); });
    updateLegend();
  }

  function hitPopupHtml(it) {
    if (it.kind === "occ") return occPopupHtml(it.props || {});
    if (it.kind === "holes") return hexPopupHtml(it.props || {}, "Holes");
    if (it.kind === "gchem") return hexPopupHtml(it.props || {}, "Samples");
    return popupHtml(it.props || {});
  }

  function hitLabel(it) {
    if (it.kind === "occ") return it.name || it.comm || "Occurrence";
    if (it.kind === "holes") return it.name || "Hole cell";
    if (it.kind === "gchem") return it.name || "Sample cell";
    return it.name || it.tenure || "Title";
  }

  function hitSub(it) {
    const st = (it.state || "").toUpperCase();
    if (it.kind === "occ") return st + " · " + (it.comm || "occurrence");
    if (it.kind === "holes") return st + " hole cell · " + (it.operator || it.props && it.props.top_operators || "");
    if (it.kind === "gchem") return st + " sample cell · " + (it.operator || it.props && it.props.top_operators || "");
    const life = it.life === "dead" ? " dead" : "";
    return st + life + " title · " + (it.holder || it.name || "");
  }

  function pickListHits(byKind) {
    const order = ["title", "occ", "holes", "gchem"];
    const shown = [];
    order.forEach(function (k) {
      const cap = FIND_LIST_CAP[k] || 10;
      const arr = byKind[k] || [];
      for (let i = 0; i < arr.length && i < cap; i++) shown.push(arr[i]);
    });
    return shown;
  }

  function runFind(q) {
    const next = String(q || "").trim().toLowerCase();
    if (next !== findQuery) findUserPicked = false;
    findQuery = next;
    if (!findResults) return;
    if (findQuery === "open" || findQuery === "open ground" || findQuery === "vacant" || findQuery === "held") {
      setOpenGroundMode(true);
      findResults.hidden = false;
      findResults.innerHTML =
        '<div class="find-summary"><strong>Open ground</strong> · click the map</div>' +
        '<p class="note">' + escapeHtml(OPEN_DISCLAIMER) + "</p>";
      applyTitleSearch("");
      applyOccFilter();
      applyHexFilter("holes");
      applyHexFilter("gchem");
      return;
    }
    if (!findQuery) {
      findHexKinds.holes = false;
      findHexKinds.gchem = false;
      findResults.hidden = true;
      findResults.innerHTML = "";
      findApiSeq += 1;
      if (liveTitlesUsingApi) clearCompanyOverlay();
      applyTitleSearch("");
      applyOccFilter();
      applyHexFilter("holes");
      applyHexFilter("gchem");
      if (liveTitlesUsingApi) scheduleLiveTitles();
      return;
    }
    if (occMaster && occMaster.checked && !occLoaded && !occLoading) {
      void withLayerBusy("Loading occurrences…", null, function () { return loadOccurrences(); });
    }
    if (holesMaster && holesMaster.checked && !holesLoaded && !holesLoading) {
      void withLayerBusy("Loading drilling…", null, function () { return loadHex("holes"); });
    }
    if (gchemMaster && gchemMaster.checked && !gchemLoaded && !gchemLoading) {
      void withLayerBusy("Loading samples…", null, function () { return loadHex("gchem"); });
    }

    const byKind = { title: [], occ: [], holes: [], gchem: [] };
    for (let i = 0; i < findIndex.length; i++) {
      const it = findIndex[i];
      if (!itemMatches(it, findQuery)) continue;
      if (byKind[it.kind]) byKind[it.kind].push(it);
    }

    const findPending = (occMaster && occMaster.checked && !occLoaded) ||
      (holesMaster && holesMaster.checked && !holesLoaded) ||
      (gchemMaster && gchemMaster.checked && !gchemLoaded);
    renderFindResults(byKind, {
      pending: findPending,
      sourceNote: apiStatus.live ? "" : (apiStatus.checked ? "Register offline — searching loaded packs only." : "")
    });

    if (apiStatus.live) {
      const seq = ++findApiSeq;
      findResults.hidden = false;
      fetchCompanyAndTitles(findQuery).then(function (apiHits) {
        if (seq !== findApiSeq || findQuery !== String(q || "").trim().toLowerCase()) return;
        mergeApiFindHits(byKind, apiHits);
        renderFindResults(byKind, {
          pending: findPending,
          sourceNote: apiHits.note || "",
          titleTotal: apiHits.titleCount,
          occTotal: apiHits.occCount,
          mapCap: apiHits.mapCap
        });
      }).catch(function (err) {
        if (seq !== findApiSeq) return;
        renderFindResults(byKind, {
          pending: findPending,
          sourceNote: "Register query failed (" + ((err && err.message) || "error") + ") — showing loaded packs only."
        });
      });
    }

    applyTitleSearch(findQuery);
    applyOccFilter();
    if (holesLoaded) applyHexFilter("holes");
    if (gchemLoaded) applyHexFilter("gchem");
    if (liveTitlesUsingApi) scheduleLiveTitles();
  }

  function mergeApiFindHits(byKind, apiHits) {
    const seen = {};
    (byKind.title || []).forEach(function (it) {
      seen["t:" + titleCoverKey(it.props || it)] = true;
    });
    (apiHits.titles || []).forEach(function (it) {
      const k = "t:" + titleCoverKey(it.props || it);
      if (seen[k]) return;
      seen[k] = true;
      byKind.title.push(it);
    });
    const seenOcc = {};
    (byKind.occ || []).forEach(function (it) {
      seenOcc["o:" + (it.name || "") + "|" + (it.state || "")] = true;
    });
    (apiHits.occs || []).forEach(function (it) {
      const k = "o:" + (it.name || "") + "|" + (it.state || "");
      if (seenOcc[k]) return;
      seenOcc[k] = true;
      byKind.occ.push(it);
    });
  }

  function fetchCompanyAndTitles(q) {
    return fetchApi("/v1/company", { q: q }, 15000).then(function (data) {
      const titleCount = Number(data.title_count || 0);
      const occCount = Number(data.occurrence_count || 0);
      const titleFeats = ((data.titles && data.titles.features) || []).map(normalizeTitleFeature);
      const occFeats = ((data.occurrences && data.occurrences.features) || []);
      const titles = titleFeats.map(function (f) {
        const c = featureCenter(f) || [null, null];
        return titleItemFromProps(f.properties, c[0], c[1]);
      });
      const occs = occFeats.map(function (f) {
        const c = featureCenter(f) || [null, null];
        return occItemFromProps(f.properties || {}, c[0], c[1]);
      });
      if (titleFeats.length) setCompanyFeatures(titleFeats, false);
      else clearCompanyOverlay();
      companyApiCache[q.toLowerCase()] = { title_count: titleCount, features: titleFeats, occs: occs };
      if (titleCount > 0) {
        return {
          titles: titles,
          occs: occs,
          titleCount: titleCount,
          occCount: occCount,
          mapCap: titleFeats.length,
          note: titleCount > titleFeats.length
            ? "National register · map plots " + titleFeats.length.toLocaleString() + " of " + titleCount.toLocaleString() + " live titles."
            : "National register."
        };
      }
      return fetchApi("/v1/titles", {
        bbox: bboxParam(AU_BBOX),
        status: "live",
        q: q,
        limit: "200"
      }, 15000).then(function (gj) {
        const feats = normalizeTitleCollection(gj).features || [];
        const t2 = feats.map(function (f) {
          const c = featureCenter(f) || [null, null];
          return titleItemFromProps(f.properties, c[0], c[1]);
        });
        if (feats.length) setCompanyFeatures(feats, false);
        return {
          titles: t2,
          occs: occs,
          titleCount: feats.length,
          occCount: occCount,
          mapCap: feats.length,
          note: feats.length
            ? "National register title search (substring, capped)."
            : (occCount ? "National register." : "")
        };
      });
    });
  }

  function renderFindResults(byKind, opts) {
    opts = opts || {};
    const titleN = opts.titleTotal != null ? opts.titleTotal : byKind.title.length;
    const occN = opts.occTotal != null ? opts.occTotal : byKind.occ.length;
    const holeN = byKind.holes.length;
    const gchemN = byKind.gchem.length;
    const listed = byKind.title.length + byKind.occ.length + holeN + gchemN;
    const total = (opts.titleTotal != null || opts.occTotal != null)
      ? titleN + occN + holeN + gchemN
      : listed;
    const allHits = byKind.title.concat(byKind.occ, byKind.holes, byKind.gchem);

    findHexKinds.holes = holeN > 0;
    findHexKinds.gchem = gchemN > 0;

    const titleStates = {};
    byKind.title.forEach(function (it) {
      if (it.life !== "dead" && it.state) titleStates[it.state] = true;
    });
    if (!liveTitlesUsingApi) Object.keys(titleStates).forEach(ensureLiveTitleOn);

    if ((occN || byKind.occ.length) && occMaster && occMaster.checked) {
      byKind.occ.forEach(function (it) { ensureOverlayStateOn(occBox, "occ", it.state); });
      enableOccLayer();
    }
    if (holeN && holesMaster && holesMaster.checked) {
      byKind.holes.forEach(function (it) { ensureOverlayStateOn(holesBox, "holes", it.state); });
      enableHexLayer("holes");
    }
    if (gchemN && gchemMaster && gchemMaster.checked) {
      byKind.gchem.forEach(function (it) { ensureOverlayStateOn(gchemBox, "gchem", it.state); });
      enableHexLayer("gchem");
    }

    const shown = pickListHits(byKind);
    findResults.hidden = false;
    if (!listed && !total) {
      findResults.innerHTML = opts.pending
        ? '<p class="note">No matches yet — still loading layers…</p>'
        : '<p class="note">' + (opts.sourceNote || "No matches in loaded layers.") + "</p>";
      return;
    }
    const parts = [];
    parts.push(Number(titleN).toLocaleString() + " title" + (titleN === 1 ? "" : "s"));
    parts.push(Number(occN).toLocaleString() + " occurrence" + (occN === 1 ? "" : "s"));
    parts.push(holeN.toLocaleString() + " hole cell" + (holeN === 1 ? "" : "s"));
    parts.push(gchemN.toLocaleString() + " sample cell" + (gchemN === 1 ? "" : "s"));
    let extra = "";
    if (opts.mapCap != null && titleN > opts.mapCap) {
      extra = '<p class="note">Showing ' + shown.length.toLocaleString() + " in the list. " +
        escapeHtml(opts.sourceNote || "") + "</p>";
    } else if (shown.length < listed) {
      extra = '<p class="note">Showing ' + shown.length.toLocaleString() + " of " + listed.toLocaleString() + ". Map plots matching features.</p>";
    } else if (opts.sourceNote) {
      extra = '<p class="note">' + escapeHtml(opts.sourceNote) + "</p>";
    }
    findResults.innerHTML =
      '<div class="find-summary"><strong>' +
      Number(total).toLocaleString() +
      " match" + (total === 1 ? "" : "es") +
      "</strong> · " +
      escapeHtml(parts.join(" · ")) +
      "</div>" +
      extra +
      shown.map(function (it, i) {
        return (
          '<button type="button" class="find-hit" data-i="' + i + '"><strong>' +
          escapeHtml(String(hitLabel(it))) +
          "</strong><span>" +
          escapeHtml(String(hitSub(it))) +
          "</span></button>"
        );
      }).join("");
    findResults.querySelectorAll(".find-hit").forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        const it = shown[i];
        if (!it || it.lng == null) return;
        findUserPicked = true;
        map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 9) });
        if (it.kind === "title") showTitleIdentify({ lng: it.lng, lat: it.lat }, it.props || {});
        else if (it.kind === "holes") showHexIdentify({ lng: it.lng, lat: it.lat }, it.props || {}, "Holes");
        else if (it.kind === "gchem") showHexIdentify({ lng: it.lng, lat: it.lat }, it.props || {}, "Samples");
        else showOccIdentify({ lng: it.lng, lat: it.lat }, it.props || {});
      });
    });
    if (!findUserPicked) fitFindHits(allHits);
  }

  function updateLegend() {
    if (legendLive) {
      const rows = [];
      if (vsPair && vsPair[0] && vsPair[1]) {
        rows.push(
          '<div class="legend-row vs-a"><span class="swatch"></span><span>' + escapeHtml(vsPair[0]) + '</span></div>' +
          '<div class="legend-row vs-b"><span class="swatch"></span><span>' + escapeHtml(vsPair[1]) + '</span></div>'
        );
      } else if (liveTitlesUsingApi && lastLiveTitlesTruncated) {
        rows.push('<div class="legend-row"><span class="swatch" style="background:' + TITLE_LIVE_COLOR + '"></span><span>Live titles · viewport capped</span></div>');
      }
      legendLive.innerHTML = rows.join("");
    }
    updateOccLegend();
  }


  function firstTitleLayerId() {
    const layers = map.getStyle().layers || [];
    for (let i = 0; i < layers.length; i++) {
      const id = layers[i].id;
      if (id !== "geo-fill" && id !== "geo-line" && id.endsWith("-fill")) return id;
      if (id !== "geo-line" && id.endsWith("-line") && id.indexOf("geo") !== 0) return id;
    }
    return undefined;
  }

  function addStateLayers(state, life, color) {
    const sid = sourceId(state, life);
    const fill = layerId(state, life) + "-fill";
    const line = layerId(state, life) + "-line";
    const url = "data/" + state + "_" + life + ".geojson";

    if (map.getSource(sid)) return Promise.resolve(true);
    if (liveLoad[sid]) return liveLoad[sid];

    liveLoad[sid] = fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(url + " HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        const n = (gj.features || []).length;
        if (n === 0) return false;
        indexTitleFeatures(state, life, gj);
        if (life === "live") indexLiveTitleGeoms(state, gj);
        if (map.getSource(sid)) return true;
        map.addSource(sid, { type: "geojson", data: gj, generateId: true });
        const paintColor = titlePaintColor(life);
        const opacityFill = life === "live" ? 0.22 : 0.1;
        const opacityLine = life === "live" ? 0.95 : 0.55;
        map.addLayer({
          id: fill,
          type: "fill",
          source: sid,
          paint: {
            "fill-color": paintColor,
            "fill-opacity": opacityFill
          }
        });
        map.addLayer({
          id: line,
          type: "line",
          source: sid,
          paint: {
            "line-color": paintColor,
            "line-width": life === "live" ? 1.15 : 0.7,
            "line-opacity": opacityLine
          }
        });
        map.on("mouseenter", fill, function () {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", fill, function () {
          map.getCanvas().style.cursor = "";
        });
        if (vsPair || (ground && (ground.company || (ground.titles && ground.titles.length)))) {
          applyGroundFilters();
        }
        return true;
      })
      .catch(function (err) {
        delete liveLoad[sid];
        throw err;
      });
    return liveLoad[sid];
  }

  function setVisible(state, life, visible) {
    const fill = layerId(state, life) + "-fill";
    const line = layerId(state, life) + "-line";
    if (!map.getLayer(fill)) return;
    const v = visible ? "visible" : "none";
    map.setLayoutProperty(fill, "visibility", v);
    map.setLayoutProperty(line, "visibility", v);
    if (life === "live" && liveTitlesUsingApi) applyLiveApiStateFilter(findQuery);
  }

  function liveApiFilter(q) {
    const ids = selectedLiveStates();
    const stateFilter = !ids.length
      ? ["==", ["get", "name"], "__none__"]
      : (ids.length === STATES.length ? null : ["in", ["get", "state"], ["literal", ids]]);
    if (q && !ground.company && !(vsPair && vsPair[0] && vsPair[1]) && !(ground.titles && ground.titles.length)) {
      const search = titleSearchFilter(q);
      return stateFilter ? ["all", stateFilter, search] : search;
    }
    return stateFilter;
  }

  function applyLiveApiStateFilter(q) {
    const f = liveApiFilter(q || findQuery);
    applyLayerFilterPair(LIVE_TITLES_FILL, LIVE_TITLES_LINE, f);
  }

  function ensureApiTitleLayers() {
    if (!map.getSource(LIVE_TITLES_SRC)) {
      map.addSource(LIVE_TITLES_SRC, { type: "geojson", data: emptyFC(), generateId: true });
      map.addLayer({
        id: LIVE_TITLES_FILL,
        type: "fill",
        source: LIVE_TITLES_SRC,
        paint: { "fill-color": TITLE_LIVE_COLOR, "fill-opacity": 0.22 }
      });
      map.addLayer({
        id: LIVE_TITLES_LINE,
        type: "line",
        source: LIVE_TITLES_SRC,
        paint: { "line-color": TITLE_LIVE_COLOR, "line-width": 1.15, "line-opacity": 0.95 }
      });
      map.on("mouseenter", LIVE_TITLES_FILL, function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", LIVE_TITLES_FILL, function () { map.getCanvas().style.cursor = ""; });
    }
    if (!map.getSource(COMPANY_SRC)) {
      map.addSource(COMPANY_SRC, { type: "geojson", data: emptyFC(), generateId: true });
      map.addLayer({
        id: COMPANY_FILL,
        type: "fill",
        source: COMPANY_SRC,
        paint: { "fill-color": TITLE_LIVE_COLOR, "fill-opacity": 0.32 }
      });
      map.addLayer({
        id: COMPANY_LINE,
        type: "line",
        source: COMPANY_SRC,
        paint: { "line-color": TITLE_LIVE_COLOR, "line-width": 1.4, "line-opacity": 0.95 }
      });
      map.on("mouseenter", COMPANY_FILL, function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", COMPANY_FILL, function () { map.getCanvas().style.cursor = ""; });
    }
    liveTitlesUsingApi = true;
  }

  function setCompanyFeatures(features, vsMode) {
    ensureApiTitleLayers();
    const gj = { type: "FeatureCollection", features: features || [] };
    const src = map.getSource(COMPANY_SRC);
    if (src) src.setData(gj);
    if (vsMode && vsPair && vsPair[0] && vsPair[1]) {
      const paint = [
        "case",
        ["==", ["get", "_vs"], "a"], VS_A_COLOR,
        ["==", ["get", "_vs"], "b"], VS_B_COLOR,
        TITLE_LIVE_COLOR
      ];
      if (map.getLayer(COMPANY_FILL)) map.setPaintProperty(COMPANY_FILL, "fill-color", paint);
      if (map.getLayer(COMPANY_LINE)) map.setPaintProperty(COMPANY_LINE, "line-color", paint);
    } else {
      if (map.getLayer(COMPANY_FILL)) map.setPaintProperty(COMPANY_FILL, "fill-color", TITLE_LIVE_COLOR);
      if (map.getLayer(COMPANY_LINE)) map.setPaintProperty(COMPANY_LINE, "line-color", TITLE_LIVE_COLOR);
    }
    const hideLive = !!(features && features.length);
    const liveOn = !liveMaster || liveMaster.checked;
    if (map.getLayer(LIVE_TITLES_FILL)) {
      map.setLayoutProperty(LIVE_TITLES_FILL, "visibility", hideLive || !liveOn ? "none" : "visible");
      map.setLayoutProperty(LIVE_TITLES_LINE, "visibility", hideLive || !liveOn ? "none" : "visible");
    }
  }

  function clearCompanyOverlay() {
    if (map.getSource(COMPANY_SRC)) map.getSource(COMPANY_SRC).setData(emptyFC());
    const liveOn = !liveMaster || liveMaster.checked;
    if (map.getLayer(LIVE_TITLES_FILL)) {
      map.setLayoutProperty(LIVE_TITLES_FILL, "visibility", liveOn ? "visible" : "none");
      map.setLayoutProperty(LIVE_TITLES_LINE, "visibility", liveOn ? "visible" : "none");
    }
    if (map.getLayer(COMPANY_FILL)) map.setPaintProperty(COMPANY_FILL, "fill-color", TITLE_LIVE_COLOR);
    if (map.getLayer(COMPANY_LINE)) map.setPaintProperty(COMPANY_LINE, "line-color", TITLE_LIVE_COLOR);
  }

  function refreshLiveTitles() {
    if (!apiStatus.live || !map.getSource(LIVE_TITLES_SRC)) return Promise.resolve();
    if (liveMaster && !liveMaster.checked) {
      lastLiveTitlesTruncated = false;
      map.getSource(LIVE_TITLES_SRC).setData(emptyFC());
      return Promise.resolve();
    }
    const zoom = map.getZoom();
    const limit = liveTitlesLimit(zoom);
    if (!limit) {
      lastLiveTitlesTruncated = false;
      map.getSource(LIVE_TITLES_SRC).setData(emptyFC());
      return Promise.resolve();
    }
    const seq = ++liveTitlesSeq;
    const bbox = bboxParam(mapBbox());
    const params = { bbox: bbox, status: "live", limit: String(limit) };
    if (ground && ground.company && !(vsPair && vsPair[0])) params.holder = ground.company;
    if (findQuery && !params.holder) params.q = findQuery;
    return fetchApi("/v1/titles", params, 18000).then(function (gj) {
      if (seq !== liveTitlesSeq) return;
      const norm = normalizeTitleCollection(gj);
      lastLiveTitlesTruncated = (norm.features || []).length >= limit;
      map.getSource(LIVE_TITLES_SRC).setData(norm);
      applyLiveApiStateFilter(findQuery);
      if (vsPair || (ground && (ground.company || (ground.titles && ground.titles.length)))) {
        applyGroundFilters();
      }
    }).catch(function (err) {
      if (seq !== liveTitlesSeq) return;
      log("Live titles API: " + ((err && err.message) || "failed") + " — keeping last layer.");
    });
  }

  function scheduleLiveTitles() {
    if (!apiStatus.live) return;
    if (liveTitlesTimer) clearTimeout(liveTitlesTimer);
    liveTitlesTimer = setTimeout(function () { refreshLiveTitles(); }, 350);
  }

  function buildToggles() {
    STATES.forEach(function (s) {
      const liveMeta = layerMeta[s.id + "_live"] || { features: 0 };
      const deadMeta = layerMeta[s.id + "_dead"] || { features: 0 };

      const liveLabel = document.createElement("label");
      liveLabel.className = "row";
      liveLabel.innerHTML =
        '<input type="checkbox" checked data-state="' +
        s.id +
        '" data-life="live" ' +
        (liveMeta.features ? "" : "disabled") +
        ' />' +
        '<span class="swatch" style="background:' +
        s.color +
        '"></span>' +
        "<span>" +
        s.name +
        (apiStatus.live ? "" : (liveMeta.features ? " · " + Number(liveMeta.features).toLocaleString() : "")) +
        "</span>";
      liveBox.appendChild(liveLabel);

      const deadLabel = document.createElement("label");
      deadLabel.className = "row";
      deadLabel.innerHTML =
        '<input type="checkbox" data-state="' +
        s.id +
        '" data-life="dead" ' +
        (deadMeta.features ? "" : "disabled") +
        ' />' +
        '<span class="swatch" style="background:' +
        s.color +
        ';opacity:0.45"></span>' +
        "<span>" +
        s.name +
        " dead" +
        (deadMeta.features ? " · " + Number(deadMeta.features).toLocaleString() : "") +
        "</span>";
      deadBox.appendChild(deadLabel);
    });

    liveBox.addEventListener("change", onToggle);
    deadBox.addEventListener("change", onToggle);
  }

  function buildMineralToggles() {
    const ordered = mineralsByCount();
    const top = mineralRail || mineralBox;
    const tail = mineralMore;
    if (!top) return;
    ordered.forEach(function (m, i) {
      const lab = document.createElement("label");
      lab.className = "row";
      lab.setAttribute("data-keys", m.id + " " + m.label + " occurrences minerals");
      lab.innerHTML =
        '<input type="checkbox" data-mineral="' +
        m.id +
        '" />' +
        '<span class="swatch round" style="background:' +
        m.color +
        '"></span>' +
        "<span>" +
        mineralLabel(m) +
        "</span>";
      if (i < MINERAL_RAIL_TOP || !tail) top.appendChild(lab);
      else tail.appendChild(lab);
    });
    if (mineralMoreBtn && tail && tail.children.length) {
      mineralMoreBtn.hidden = false;
      mineralMoreBtn.addEventListener("click", function () {
        const open = tail.hidden;
        tail.hidden = !open;
        mineralMoreBtn.textContent = open ? "Show less" : "See more";
      });
    }
    const root = occMinerals || top;
    root.addEventListener("change", function (e) {
      const input = e.target;
      const row = input && input.closest ? input.closest(".row") : null;
      syncOccFromMinerals(occBusyMessage(input), row);
    });
  }

  function selectedMinerals() {
    return mineralInputs()
      .filter(function (inp) { return inp.checked; })
      .map(function (inp) { return inp.getAttribute("data-mineral"); });
  }

  function normMineralToken(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\u2026/g, "")
      .replace(/[.;:]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function lookupMineral(token) {
    if (MINERAL_EXACT[token]) return MINERAL_EXACT[token];
    if (token === "sand" || token.indexOf("sand -") === 0 || token.indexOf("sand and") === 0) {
      if (token.indexOf("mineral") === -1) return "construction";
    }
    if (token.indexOf("unprocess") === 0) return "construction";
    if (token.indexOf("coarse aggregate") === 0) return "construction";
    for (let i = 0; i < MINERAL_PHRASES.length; i++) {
      const mid = MINERAL_PHRASES[i][0];
      const phrases = MINERAL_PHRASES[i][1];
      for (let j = 0; j < phrases.length; j++) {
        if (token.indexOf(phrases[j]) !== -1) {
          if (mid === "construction" && token.indexOf("mineral sand") !== -1) continue;
          return mid;
        }
      }
    }
    return null;
  }

  function mineralIdsFromComm(comm) {
    const raw = String(comm || "").trim();
    const n = normMineralToken(raw);
    if (!raw || n === "unknown" || n === "un" || n === "unk") return ["other"];
    const parts = raw.split(/[,;/|+&]+|\band\b/i);
    const ids = {};
    for (let i = 0; i < parts.length; i++) {
      const t = normMineralToken(parts[i]);
      if (!t) continue;
      const mid = lookupMineral(t);
      if (mid) ids[mid] = true;
    }
    const keys = Object.keys(ids);
    return keys.length ? keys : ["other"];
  }

  function buildKindToggles() {
    KINDS.forEach(function (k) {
      const lab = document.createElement("label");
      lab.className = "row";
      lab.innerHTML =
        '<input type="checkbox" checked data-kind="' +
        k.id +
        '" />' +
        '<span class="swatch" style="background:' +
        k.color +
        '"></span>' +
        "<span>" +
        k.label +
        "</span>";
      kindBox.appendChild(lab);
    });
    kindBox.addEventListener("change", applyGeoFilter);
  }

  function selectedKinds() {
    return Array.prototype.slice
      .call(kindBox.querySelectorAll('input[type="checkbox"]'))
      .filter(function (inp) { return inp.checked; })
      .map(function (inp) { return inp.getAttribute("data-kind"); });
  }

  function applyGeoFilter() {
    if (!map.getLayer("geo-fill")) return;
    const kinds = selectedKinds();
    const q = (geoSearch.value || "").trim().toLowerCase();
    let filter;
    if (!kindsMaster.checked || kinds.length === 0) {
      filter = ["==", ["get", "kind"], "__none__"];
    } else {
      filter = ["in", ["get", "kind"], ["literal", kinds]];
      if (q) {
        filter = ["all", filter, ["in", q, ["downcase", ["get", "name"]]]];
      }
    }
    map.setFilter("geo-fill", filter);
    map.setFilter("geo-line", filter);
  }

  function kindColorExpr() {
    const expr = ["match", ["get", "kind"]];
    KINDS.forEach(function (k) {
      expr.push(k.id, k.color);
    });
    expr.push("#9aa0a6");
    return expr;
  }

  function loadGeologyKinds() {
    if (geoLoaded) {
      applyGeoFilter();
      return Promise.resolve();
    }
    if (geoLoadPromise) return geoLoadPromise;
    geoLoading = true;
    log("Loading geology kinds…");
    geoLoadPromise = fetch("data/geology_kinds.geojson")
      .then(function (r) {
        if (!r.ok) throw new Error("geology_kinds.geojson HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        if (map.getSource("geo-kinds")) {
          map.getSource("geo-kinds").setData(gj);
        } else {
          map.addSource("geo-kinds", { type: "geojson", data: gj, generateId: true });
          const before = firstTitleLayerId();
          map.addLayer(
            {
              id: "geo-fill",
              type: "fill",
              source: "geo-kinds",
              paint: {
                "fill-color": kindColorExpr(),
                "fill-opacity": 0.42
              }
            },
            before
          );
          map.addLayer(
            {
              id: "geo-line",
              type: "line",
              source: "geo-kinds",
              paint: {
                "line-color": kindColorExpr(),
                "line-width": 0.6,
                "line-opacity": 0.7
              }
            },
            firstTitleLayerId()
          );
          map.on("mouseenter", "geo-fill", function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "geo-fill", function () {
            map.getCanvas().style.cursor = "";
          });
        }
        geoLoaded = true;
        geoLoading = false;
        applyGeoFilter();
        log("Geology kinds loaded (" + ((gj.features || []).length).toLocaleString() + " units). Filter by kind or name.");
      })
      .catch(function (err) {
        geoLoading = false;
        kindsMaster.checked = false;
        log("Failed geology kinds: " + err.message);
      })
      .then(function () {
        geoLoadPromise = null;
      });
    return geoLoadPromise;
  }

  function ensureGa(on) {
    if (on) {
      if (!map.getSource("ga-geol")) {
        map.addSource("ga-geol", {
          type: "raster",
          tiles: [
            "https://services.ga.gov.au/gis/rest/services/GA_Surface_Geology/MapServer/WMTS/tile/1.0.0/GA_Surface_Geology/default/GoogleMapsCompatible/{z}/{y}/{x}.png"
          ],
          tileSize: 256,
          attribution: "© Geoscience Australia CC BY 4.0"
        });
        const before = map.getLayer("geo-fill")
          ? "geo-fill"
          : firstTitleLayerId();
        map.addLayer(
          {
            id: "ga-geol",
            type: "raster",
            source: "ga-geol",
            paint: { "raster-opacity": 0.72 }
          },
          before
        );
      } else {
        map.setLayoutProperty("ga-geol", "visibility", "visible");
      }
    } else if (map.getLayer("ga-geol")) {
      map.setLayoutProperty("ga-geol", "visibility", "none");
    }
  }

  function identifyGa(lngLat) {
    const d = 0.03;
    const bbox = [lngLat.lat - d, lngLat.lng - d, lngLat.lat + d, lngLat.lng + d].join(",");
    const url =
      "https://services.ga.gov.au/gis/services/GA_Surface_Geology/MapServer/WmsServer?" +
      "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo" +
      "&LAYERS=AUS_GA_2500k_GUPoly_Lithostratigraphy,AUS_GA_1M_GUPoly_Lithostratigraphy" +
      "&QUERY_LAYERS=AUS_GA_2500k_GUPoly_Lithostratigraphy,AUS_GA_1M_GUPoly_Lithostratigraphy" +
      "&CRS=EPSG:4326&BBOX=" +
      bbox +
      "&WIDTH=101&HEIGHT=101&I=50&J=50&FEATURE_COUNT=1&INFO_FORMAT=application/geojson";
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("GetFeatureInfo " + r.status);
        return r.json();
      })
      .then(function (gj) {
        const f = (gj.features || [])[0];
        if (!f) {
          log("GA identify: no unit at click");
          return;
        }
        popup.setLngLat(lngLat).setHTML(gaPopupHtml(f.properties || {})).addTo(map);
      })
      .catch(function (err) {
        log("GA identify failed: " + err.message);
      });
  }

  function titleFillIds() {
    const ids = [];
    if (map.getLayer(LIVE_TITLES_FILL)) ids.push(LIVE_TITLES_FILL);
    if (map.getLayer(COMPANY_FILL)) ids.push(COMPANY_FILL);
    STATES.forEach(function (s) {
      ["live", "dead"].forEach(function (life) {
        const id = layerId(s.id, life) + "-fill";
        if (map.getLayer(id)) ids.push(id);
      });
    });
    return ids;
  }

  function overlayCounts(kind) {
    const o = overlayManifest || {};
    if (kind === "occ") return ((o.occurrences || {}).counts) || {};
    if (kind === "holes") return ((o.holes || {}).raw) || {};
    if (kind === "gchem") return ((o.geochem || {}).raw) || {};
    return {};
  }

  function buildStateMini(box, kind, counts) {
    box.innerHTML = "";
    STATES.forEach(function (s) {
      const n = counts[s.id] || 0;
      const lab = document.createElement("label");
      lab.className = "row";
      lab.innerHTML =
        '<input type="checkbox" checked data-ov="' +
        kind +
        '" data-state="' +
        s.id +
        '" ' +
        (n ? "" : "disabled") +
        " />" +
        '<span class="swatch' +
        (kind === "occ" ? " round" : "") +
        '" style="background:' +
        s.color +
        '"></span>' +
        "<span>" +
        s.name +
        (n ? " (" + Number(n).toLocaleString() + ")" : "") +
        "</span>";
      box.appendChild(lab);
    });
    box.addEventListener("change", function () {
      if (kind === "occ") applyOccFilter();
      else if (kind === "holes") applyHexFilter("holes");
      else applyHexFilter("gchem");
    });
  }

  function selectedOverlayStates(box) {
    return Array.prototype.slice
      .call(box.querySelectorAll('input[type="checkbox"]'))
      .filter(function (inp) { return inp.checked && !inp.disabled; })
      .map(function (inp) { return inp.getAttribute("data-state"); });
  }

  function occToGJ(pack, states) {
    const allow = {};
    (states || []).forEach(function (s) { allow[s] = true; });
    const allowMin = {};
    selectedMinerals().forEach(function (m) { allowMin[m] = true; });
    const pri = [];
    const sec = [];
    (pack.rows || []).forEach(function (r) {
      if (!allow[r[0]]) return;
      if (findQuery) {
        if (!occRowMatches(r, findQuery)) return;
      } else {
        const types = r._mins || mineralIdsFromComm(r[4]);
        let ok = false;
        for (let i = 0; i < types.length; i++) {
          if (allowMin[types[i]]) { ok = true; break; }
        }
        if (!ok) return;
      }
      const props = occProps(r);
      const types = r._mins || mineralIdsFromComm(r[4]);
      props.min = primaryMineral(types, selectedMinerals());
      props.fam = props.min;
      const feat = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [r[1], r[2]] },
        properties: props
      };
      if (findQuery || props.pri) pri.push(feat);
      else sec.push(feat);
    });
    return {
      pri: { type: "FeatureCollection", features: pri },
      sec: { type: "FeatureCollection", features: sec }
    };
  }

  function stateColorExpr() {
    const expr = ["match", ["get", "state"]];
    STATES.forEach(function (s) {
      expr.push(s.id, s.color);
    });
    expr.push("#d4d4d8");
    return expr;
  }

  function hexColorExpr(kind) {
    if (kind === "gchem") {
      return [
        "interpolate", ["linear"], ["log10", ["max", 1, ["get", "n"]]],
        0, "#3c096c",
        1, "#7b2cbf",
        2, "#c77dff",
        3, "#e0aaff",
        4, "#ff9e00",
        5, "#ff6d00"
      ];
    }
    return [
      "interpolate", ["linear"], ["log10", ["max", 1, ["get", "n"]]],
      0, "#1a3d00",
      1, "#4a8c00",
      2, HOLES_COLOR,
      3, "#e6ff66",
      4, "#f4ff99",
      5, "#ffffff"
    ];
  }

  function underTitlesId() {
    return firstTitleLayerId();
  }

  function applyHexFilter(kind) {
    const layer = kind === "holes" ? "holes-hex" : "gchem-hex";
    const master = kind === "holes" ? holesMaster : gchemMaster;
    const box = kind === "holes" ? holesBox : gchemBox;
    if (!map.getLayer(layer)) return;
    if (!master.checked) {
      map.setLayoutProperty(layer, "visibility", "none");
      return;
    }
    const states = selectedOverlayStates(box);
    map.setLayoutProperty(layer, "visibility", "visible");
    if (!states.length) {
      map.setFilter(layer, ["==", ["get", "state"], "__none__"]);
      return;
    }
    let filter = ["in", ["get", "state"], ["literal", states]];
    if (findQuery && findHexKinds[kind]) {
      filter = ["all", filter, ["!=", ["get", "demo"], true], hexCompanyFilter(findQuery)];
    }
    map.setFilter(layer, filter);
  }

  const OCC_LAYERS = occLayerIds();

  function occHeatPaint(hex) {
    const base = rgbStr(hexToRgb(hex));
    const peak = rgbStr(hotterRgb(hex));
    return {
      "heatmap-weight": 1,
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.4, 7, 1.05],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 14, 7, 22],
      "heatmap-opacity": [
        "interpolate", ["linear"], ["zoom"],
        3, 0.9,
        7, 0.75,
        OCC_HEAT_MAX_ZOOM, 0
      ],
      "heatmap-color": [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(" + base + ",0)",
        0.18, "rgba(" + base + ",0.4)",
        0.45, "rgba(" + base + ",0.75)",
        0.75, "rgba(" + peak + ",0.9)",
        1, "rgba(" + peak + ",1)"
      ]
    };
  }

  function applyOccFilter() {
    if (!occPack || !map.getSource("occ")) {
      updateOccLegend();
      return;
    }
    const selected = selectedMinerals();
    const on = !!(occMaster && occMaster.checked && selected.length);
    if (!on) {
      OCC_LAYERS.forEach(function (id) { setLayerVisible(id, false); });
      updateOccLegend();
      return;
    }
    const gj = occToGJ(occPack, selectedOverlayStates(occBox));
    map.getSource("occ").setData(gj.pri);
    if (map.getSource(OCC_HEAT_SRC)) map.getSource(OCC_HEAT_SRC).setData(gj.pri);
    if (map.getSource("occ-sec")) map.getSource("occ-sec").setData(gj.sec);
    const allow = {};
    selected.forEach(function (id) { allow[id] = true; });
    MINERALS.forEach(function (m) {
      setLayerVisible("occ-heat-" + m.id, !!allow[m.id]);
    });
    const mixed = selected.length > 1;
    setLayerVisible("occ-clusters", !mixed);
    setLayerVisible("occ-cluster-count", !mixed);
    setLayerVisible("occ-point", !mixed);
    setLayerVisible("occ-dots", mixed);
    setLayerVisible("occ-sec-point", true);
    if (!mixed && map.getLayer("occ-clusters")) {
      map.setPaintProperty("occ-clusters", "circle-color", mineralColor(selected[0]));
    }
    updateOccLegend();
  }

  function updateOccLegend() {
    const el = document.getElementById("occ-legend");
    if (!el) return;
    const ids = selectedMinerals();
    if (ids.length < 2 || !(occMaster && occMaster.checked)) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = ids.map(function (id) {
      return (
        '<div class="legend-row"><span class="swatch round" style="background:' +
        mineralColor(id) +
        '"></span><span>' +
        mineralLabel({ id: id, label: id }) +
        "</span></div>"
      );
    }).join("");
  }

  function loadOccurrences() {
    if (occLoaded) {
      applyOccFilter();
      return Promise.resolve();
    }
    if (occLoadPromise) return occLoadPromise;
    occLoading = true;
    log("Loading occurrences…");
    occLoadPromise = fetch(assetUrl("data/occ.json"))
      .then(function (r) {
        if (!r.ok) throw new Error("occ.json HTTP " + r.status);
        return r.json();
      })
      .then(function (pack) {
        occPack = pack;
        (pack.rows || []).forEach(function (r) {
          r._mins = mineralIdsFromComm(r[4]);
        });
        indexOccurrences(pack);
        const gj = occToGJ(pack, selectedOverlayStates(occBox));
        if (!map.getSource("occ")) {
          map.addSource("occ", {
            type: "geojson",
            data: gj.pri,
            cluster: true,
            clusterMaxZoom: 10,
            clusterRadius: 42,
            attribution: "Occurrences: GSNSW / GSQ / GSV / MRT / NTGS; WA MINEDEX CC BY-NC 4.0"
          });
          map.addSource(OCC_HEAT_SRC, {
            type: "geojson",
            data: gj.pri
          });
          map.addSource("occ-sec", {
            type: "geojson",
            data: gj.sec
          });
          MINERALS.forEach(function (m) {
            map.addLayer({
              id: "occ-heat-" + m.id,
              type: "heatmap",
              source: OCC_HEAT_SRC,
              maxzoom: OCC_HEAT_MAX_ZOOM,
              filter: ["==", ["get", "min"], m.id],
              paint: occHeatPaint(m.color)
            });
          });
          map.addLayer({
            id: "occ-clusters",
            type: "circle",
            source: "occ",
            minzoom: OCC_CLUSTER_MIN_ZOOM,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": occFamilyColor(),
              "circle-radius": ["step", ["get", "point_count"], 12, 25, 16, 100, 20, 500, 26],
              "circle-opacity": 0.88,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#000000"
            }
          });
          map.addLayer({
            id: "occ-cluster-count",
            type: "symbol",
            source: "occ",
            minzoom: OCC_CLUSTER_MIN_ZOOM,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 11
            },
            paint: { "text-color": "#000000" }
          });
          map.addLayer({
            id: "occ-dots",
            type: "circle",
            source: OCC_HEAT_SRC,
            minzoom: OCC_CLUSTER_MIN_ZOOM,
            layout: { visibility: "none" },
            paint: {
              "circle-color": mineralColorExpr(),
              "circle-radius": 4.6,
              "circle-opacity": 0.92,
              "circle-stroke-width": 0.8,
              "circle-stroke-color": "#000000"
            }
          });
          map.addLayer({
            id: "occ-point",
            type: "circle",
            source: "occ",
            minzoom: OCC_CLUSTER_MIN_ZOOM,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": mineralColorExpr(),
              "circle-radius": 5.4,
              "circle-opacity": 0.92,
              "circle-stroke-width": 0.9,
              "circle-stroke-color": "#000000"
            }
          });
          map.addLayer({
            id: "occ-sec-point",
            type: "circle",
            source: "occ-sec",
            minzoom: 11,
            paint: {
              "circle-color": mineralColorExpr(),
              "circle-radius": 2.1,
              "circle-opacity": 0.55,
              "circle-stroke-width": 0.4,
              "circle-stroke-color": "#000000"
            }
          });
          map.on("mouseenter", "occ-point", function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "occ-point", function () {
            map.getCanvas().style.cursor = "";
          });
          map.on("mouseenter", "occ-dots", function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "occ-dots", function () {
            map.getCanvas().style.cursor = "";
          });
          map.on("click", "occ-dots", function (e) {
            const f = (e.features || [])[0];
            if (!f) return;
            skipNextClick = true;
            showOccIdentify(e.lngLat, f.properties || {});
          });
          map.on("mouseenter", "occ-sec-point", function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "occ-sec-point", function () {
            map.getCanvas().style.cursor = "";
          });
          map.on("click", "occ-clusters", function (e) {
            const f = (e.features || [])[0];
            if (!f) return;
            skipNextClick = true;
            showOccCluster(e.lngLat, f.properties.cluster_id, f.geometry.coordinates);
          });
        } else {
          map.getSource("occ").setData(gj.pri);
          if (map.getSource(OCC_HEAT_SRC)) map.getSource(OCC_HEAT_SRC).setData(gj.pri);
          if (map.getSource("occ-sec")) map.getSource("occ-sec").setData(gj.sec);
        }
        occLoaded = true;
        occLoading = false;
        applyOccFilter();
        const n = ((pack.rows || []).length);
        const st = pack.stats || {};
        log(
          "Occurrences loaded (" +
            n.toLocaleString() +
            (st.gold_primary != null
              ? "; gold shows " + Number(st.gold_primary).toLocaleString() + " named/sized sites first"
              : "") +
            ")"
        );
        if (findQuery && findInput) runFind(findInput.value);
        updateLegend();
      })
      .catch(function (err) {
        occLoading = false;
        occMaster.checked = false;
        log("Failed occurrences: " + err.message);
      })
      .then(function () {
        occLoadPromise = null;
      });
    return occLoadPromise;
  }

  function loadHex(kind) {
    const loaded = kind === "holes" ? holesLoaded : gchemLoaded;
    if (loaded) {
      applyHexFilter(kind);
      return Promise.resolve();
    }
    if (hexLoadPromise[kind]) return hexLoadPromise[kind];
    if (kind === "holes") holesLoading = true;
    else gchemLoading = true;
    const file = kind === "holes" ? "data/holes_hex.geojson" : "data/geochem_hex.geojson";
    const sid = kind === "holes" ? "holes-hex" : "gchem-hex";
    const lid = sid;
    log("Loading " + kind + " density…");
    hexLoadPromise[kind] = fetch(file)
      .then(function (r) {
        if (!r.ok) throw new Error(file + " HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        if (!map.getSource(sid)) {
          map.addSource(sid, { type: "geojson", data: gj, attribution: kind === "holes" ? "Drillhole density from state open-file collars (aggregated)" : "Geochem sample density from state open data (aggregated)" });
          map.addLayer(
            {
              id: lid,
              type: "fill",
              source: sid,
              paint: {
                "fill-color": hexColorExpr(kind),
                "fill-opacity": 0.45,
                "fill-outline-color": "rgba(255,255,255,0.18)"
              }
            },
            underTitlesId()
          );
          map.on("mouseenter", lid, function () {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", lid, function () {
            map.getCanvas().style.cursor = "";
          });
        } else {
          map.getSource(sid).setData(gj);
        }
        if (kind === "holes") {
          holesLoaded = true;
          holesLoading = false;
        } else {
          gchemLoaded = true;
          gchemLoading = false;
        }
        hexStore[kind] = gj;
        indexHexFeatures(kind, gj);
        applyHexFilter(kind);
        log(kind + " density loaded (" + ((gj.features || []).length).toLocaleString() + " hexes).");
        if (findQuery && findInput) runFind(findInput.value);
      })
      .catch(function (err) {
        if (kind === "holes") {
          holesLoading = false;
          holesMaster.checked = false;
        } else {
          gchemLoading = false;
          gchemMaster.checked = false;
        }
        log("Failed " + kind + ": " + err.message);
      })
      .then(function () {
        hexLoadPromise[kind] = null;
      });
    return hexLoadPromise[kind];
  }

  function onToggle(ev) {
    const t = ev.target;
    if (t.tagName !== "INPUT") return;
    const state = t.getAttribute("data-state");
    const life = t.getAttribute("data-life");
    const st = STATES.find(function (x) {
      return x.id === state;
    });
    if (!st) return;

    updateLegend();
    if (life === "live" && liveTitlesUsingApi) {
      applyLiveApiStateFilter(findQuery);
      log(state.toUpperCase() + " live " + (t.checked ? "shown" : "hidden") + " on the register layer");
      return;
    }
    if (t.checked) {
      log("Loading " + state.toUpperCase() + " " + life + "…");
      addStateLayers(state, life, st.color)
        .then(function (ok) {
          if (!ok) {
            t.checked = false;
            log(state.toUpperCase() + " " + life + ": no features");
            return;
          }
          setVisible(state, life, true);
          log(state.toUpperCase() + " " + life + " visible");
        })
        .catch(function (err) {
          t.checked = false;
          log("Failed " + state + " " + life + ": " + err.message + "\nIf you opened index.html via file://, start a local server (see README).");
        });
    } else {
      setVisible(state, life, false);
    }
  }

  deadMaster.addEventListener("change", function (e) {
    const row = e.target && e.target.closest ? e.target.closest(".row") : null;
    if (deadMaster.checked) {
      deadBox.classList.remove("disabled");
      void withLayerBusy("Loading dead titles…", row, function () {
        const jobs = STATES.map(function (s) {
          const inp = deadBox.querySelector('input[data-state="' + s.id + '"][data-life="dead"]');
          if (!inp || inp.disabled) return Promise.resolve();
          inp.checked = true;
          return addStateLayers(s.id, "dead", TITLE_DEAD_COLOR).then(function (ok) {
            if (ok) setVisible(s.id, "dead", true);
          }).catch(function (err) {
            inp.checked = false;
            log("Failed " + s.id + " dead: " + err.message);
          });
        });
        return Promise.all(jobs);
      });
    } else {
      deadBox.classList.add("disabled");
      deadBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
        if (inp.checked) {
          inp.checked = false;
          setVisible(inp.getAttribute("data-state"), "dead", false);
        }
      });
    }
    updateLegend();
  });

  function ensureOsm(on) {
    if (on) {
      if (!map.getSource("osm")) {
        map.addSource("osm", {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap"
        });
        map.addLayer(
          {
            id: "osm",
            type: "raster",
            source: "osm",
            paint: {
              "raster-opacity": 0.38,
              "raster-saturation": -0.55,
              "raster-brightness-max": 0.58
            }
          },
          map.getLayer("au-states") ? "au-states" : (map.getLayer("au-coast") ? "au-coast" : undefined)
        );
      } else {
        map.setLayoutProperty("osm", "visibility", "visible");
      }
    } else if (map.getLayer("osm")) {
      map.setLayoutProperty("osm", "visibility", "none");
    }
  }

  if (findInput) {
    let findTimer = null;
    findInput.addEventListener("input", function () {
      clearTimeout(findTimer);
      findTimer = setTimeout(function () { runFind(findInput.value); }, 160);
    });
  }

  function layerTokenHit(blob, q) {
    if (!q) return true;
    const tokens = String(blob || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].indexOf(q) === 0) return true;
    }
    return false;
  }

  function applyLayerKeywordFilter() {
    if (!layerFilter) return;
    const q = String(layerFilter.value || "").trim().toLowerCase();
    document.querySelectorAll(".layers .lg").forEach(function (sec) {
      const groupKeys = sec.getAttribute("data-keys") || "";
      let any = false;
      let moreHit = false;
      sec.querySelectorAll(".row").forEach(function (row) {
        const keys = (row.getAttribute("data-keys") || "") + " " + (row.textContent || "") + " " + groupKeys;
        const hit = layerTokenHit(keys, q);
        row.hidden = !hit;
        if (hit) any = true;
        if (hit && mineralMore && mineralMore.contains(row)) moreHit = true;
      });
      sec.hidden = !!q && !any;
      if (mineralMore && mineralMoreBtn && sec.contains(mineralMore)) {
        if (q) {
          mineralMore.hidden = !moreHit;
          mineralMoreBtn.hidden = true;
        } else {
          mineralMoreBtn.hidden = !mineralMore.children.length;
          if (!mineralMoreBtn.hidden && mineralMoreBtn.textContent === "See more") {
            mineralMore.hidden = true;
          }
        }
      }
    });
  }

  if (layerFilter) {
    layerFilter.addEventListener("input", applyLayerKeywordFilter);
  }

  osmToggle.addEventListener("change", function () {
    ensureOsm(osmToggle.checked);
    updateLegend();
  });

  if (auOutline) {
    auOutline.addEventListener("change", function () {
      setLayerVisible("au-coast", auOutline.checked);
    });
  }
  if (auStates) {
    auStates.addEventListener("change", function () {
      setLayerVisible("au-states", auStates.checked);
    });
  }
  if (liveMaster) {
    liveMaster.addEventListener("change", function () {
      const on = liveMaster.checked;
      if (liveBox) {
        liveBox.querySelectorAll('input[data-life="live"]').forEach(function (inp) {
          if (!inp.disabled) inp.checked = on;
        });
      }
      if (liveTitlesUsingApi) {
        setLayerVisible(LIVE_TITLES_FILL, on);
        setLayerVisible(LIVE_TITLES_LINE, on);
        applyLiveApiStateFilter(findQuery);
        if (on) scheduleLiveTitles();
      } else if (on) {
        STATES.forEach(function (s) {
          const inp = liveBox && liveBox.querySelector('input[data-state="' + s.id + '"][data-life="live"]');
          if (!inp || inp.disabled) return;
          addStateLayers(s.id, "live", TITLE_LIVE_COLOR).then(function (ok) {
            if (ok) setVisible(s.id, "live", true);
          });
        });
      } else {
        STATES.forEach(function (s) { setVisible(s.id, "live", false); });
      }
      updateLegend();
    });
  }
  if (railToggle && panelEl) {
    railToggle.addEventListener("click", function () {
      setRailOpen(!document.body.classList.contains("rail-open"));
    });
  }

  gaToggle.addEventListener("change", function () {
    ensureGa(gaToggle.checked);
    updateLegend();
  });

  kindsMaster.addEventListener("change", function (e) {
    const row = e.target && e.target.closest ? e.target.closest(".row") : null;
    if (kindsMaster.checked) {
      kindBox.classList.remove("disabled");
      if (!geoLoaded) {
        void withLayerBusy("Loading geology…", row, function () { return loadGeologyKinds(); });
      } else {
        loadGeologyKinds();
      }
      if (geoSearch) geoSearch.hidden = false;
    } else {
      kindBox.classList.add("disabled");
      applyGeoFilter();
      if (geoSearch) geoSearch.hidden = true;
    }
    updateLegend();
  });

  geoSearch.addEventListener("input", function () {
    if (!kindsMaster.checked) {
      kindsMaster.checked = true;
      kindBox.classList.remove("disabled");
      if (geoSearch) geoSearch.hidden = false;
    }
    if (!geoLoaded) {
      const row = kindsMaster && kindsMaster.closest ? kindsMaster.closest(".row") : null;
      void withLayerBusy("Loading geology…", row, function () { return loadGeologyKinds(); });
    } else applyGeoFilter();
  });

  kindsAll.addEventListener("click", function () {
    kindBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = true;
    });
    applyGeoFilter();
  });
  kindsNone.addEventListener("click", function () {
    kindBox.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = false;
    });
    applyGeoFilter();
  });

  minsAll.addEventListener("click", function () {
    mineralInputs().forEach(function (inp) { inp.checked = true; });
    syncOccFromMinerals(occLoaded ? "Updating map…" : "Loading occurrences…", null);
  });
  minsNone.addEventListener("click", function () {
    mineralInputs().forEach(function (inp) { inp.checked = false; });
    syncOccFromMinerals();
  });

  occMaster.addEventListener("change", function () {
    if (occMaster.checked) {
      occBox.classList.remove("disabled");
      void withLayerBusy("Loading occurrences…", null, function () { return loadOccurrences(); });
    } else {
      occBox.classList.add("disabled");
      applyOccFilter();
    }
    updateLegend();
    updateDemoBanner();
  });
  holesMaster.addEventListener("change", function (e) {
    const row = e.target && e.target.closest ? e.target.closest(".row") : null;
    if (holesMaster.checked) {
      holesBox.classList.remove("disabled");
      if (holesLegend) holesLegend.hidden = false;
      if (!holesLoaded) {
        void withLayerBusy("Loading drilling…", row, function () { return loadHex("holes"); });
      } else {
        loadHex("holes");
      }
    } else {
      holesBox.classList.add("disabled");
      if (holesLegend) holesLegend.hidden = true;
      applyHexFilter("holes");
    }
    updateLegend();
    updateDemoBanner();
  });
  gchemMaster.addEventListener("change", function (e) {
    const row = e.target && e.target.closest ? e.target.closest(".row") : null;
    if (gchemMaster.checked) {
      gchemBox.classList.remove("disabled");
      if (gchemLegend) gchemLegend.hidden = false;
      if (!gchemLoaded) {
        void withLayerBusy("Loading samples…", row, function () { return loadHex("gchem"); });
      } else {
        loadHex("gchem");
      }
    } else {
      gchemBox.classList.add("disabled");
      if (gchemLegend) gchemLegend.hidden = true;
      applyHexFilter("gchem");
    }
    updateLegend();
  });


  const ASSET_V = "20260829f";
  const VS_A_COLOR = "#00c8ff";
  const VS_B_COLOR = "#ff2bd6";
  const GROUND_KEY = "xplorr.myground";
  const PACK_CAP = { title: 40, occ: 30, holes: 20, gchem: 20, report: 30 };

  const groundName = document.getElementById("ground-name");
  const groundCompany = document.getElementById("ground-company");
  const groundVs = document.getElementById("ground-vs");
  const groundTitles = document.getElementById("ground-titles");
  const groundPin = document.getElementById("ground-pin");
  const groundApply = document.getElementById("ground-apply");
  const groundClear = document.getElementById("ground-clear");
  const groundStatus = document.getElementById("ground-status");
  const reportsMaster = document.getElementById("reports-master");
  const boxTool = document.getElementById("box-tool");
  const drawBoxEl = document.getElementById("draw-box");
  const packEl = document.getElementById("pack");
  const packBody = document.getElementById("pack-body");
  const packClose = document.getElementById("pack-close");

  let reportsPack = null;
  let reportsLoading = false;
  let reportsLoaded = false;
  let reportsPtsLoaded = false;
  let reportsLoadPromise = null;
  let lastTitle = null;
  let ground = { name: "", company: "", titles: [] };
  let vsPair = null;
  let boxDrawMode = false;
  let boxDrawing = false;
  let boxStart = null;
  let skipNextClick = false;
  let lastBoxBounds = null;
  const hexStore = { holes: null, gchem: null };
  const titleHolders = [];

  const RE_BLOCK = /\b(EPM|EPC|MDL|EMEL|EMPN|EMLN|HLDN|HLDC|AUTH|ELA|MLA|CCL|PLL|MPL|CML|EPL|ELR|MLN|MLC|MCC|EML|EMP|ERA|SEL|GML|MIL|LIC|MRC|LSE|PAL|TRL|TMA|TTL|TFA|ESP|MIN|EL|AL|ML|MC|PL|CL|GL|RL|WA|DL|TR|AA|MA)\s*[-\.]?\s*0*(\d{1,6})(?:\s*\/\s*(\d{2,4}))?\b/gi;
  const RE_WA = /\b(CML|MCI|ECI|GCI|TR|E|P|L|G|R|M)\s*[-\.]?\s*(\d{1,3})\s*\/\s*(\d{1,5}[A-Z]?)\b/gi;
  const RE_WA_TR = /\bT\.?\s*R\.?\s*(\d{1,3})\s*\/\s*(\d{1,5}[A-Z]?)\b/gi;

  function assetUrl(path) {
    return path + (path.indexOf("?") >= 0 ? "&" : "?") + "v=" + ASSET_V;
  }

  function safeHttpUrl(u) {
    const s = String(u || "").trim();
    if (!s || isDemoString(s)) return "";
    if (s.indexOf("http://") !== 0 && s.indexOf("https://") !== 0) return "";
    return s;
  }

  function holderTokens(h) {
    return String(h || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  function holderMatchesCompany(holder, q) {
    const tokens = holderTokens(holder);
    const qt = holderTokens(q);
    if (!qt.length || itemIsDemo({ props: { holder: holder } }) && isDemoString(holder)) return false;
    if (isDemoString(holder)) return false;
    for (let i = 0; i <= tokens.length - qt.length; i++) {
      let ok = true;
      for (let j = 0; j < qt.length; j++) {
        if (tokens[i + j] !== qt[j]) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }

  function parseTitleList(s) {
    return String(s || "")
      .split(/[,;\n]+/)
      .map(function (x) { return x.trim(); })
      .filter(function (x) { return x && !isDemoString(x); });
  }

  function titleMatchesPin(name, pins) {
    const n = String(name || "").trim().toLowerCase();
    if (!n) return false;
    for (let i = 0; i < pins.length; i++) {
      if (n === String(pins[i]).trim().toLowerCase()) return true;
    }
    return false;
  }

  function compactName(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9/]/g, "");
  }

  function extractTitleKeys(state, name) {
    const st = String(state || "").toLowerCase();
    const blob = String(name || "");
    const keys = [];
    const seen = {};
    function add(k) {
      if (k && !seen[k]) { seen[k] = true; keys.push(k); }
    }
    function tenementKey(pref, num, tail) {
      const p = String(pref || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const n = String(num || "").replace(/^0+/, "") || "0";
      if (tail) return st + ":" + p + n + "/" + String(tail).replace(/\s+/g, "").toUpperCase();
      return st + ":" + p + n;
    }
    if (st === "wa") {
      RE_WA.lastIndex = 0;
      let m;
      while ((m = RE_WA.exec(blob))) add(tenementKey(m[1], m[2], m[3]));
      RE_WA_TR.lastIndex = 0;
      while ((m = RE_WA_TR.exec(blob))) add(tenementKey("TR", m[1], m[2]));
    }
    RE_BLOCK.lastIndex = 0;
    let m;
    while ((m = RE_BLOCK.exec(blob))) add(tenementKey(m[1], m[2], m[3]));
    const compact = compactName(blob);
    if (compact) add(st + ":" + compact);
    return keys;
  }

  function companyLookupKeys(s) {
    let n = String(s || "").toLowerCase();
    n = n.replace(/\b(pty|ltd|limited|nl|inc|incorporated|the|company|co|corporation|corp|plc)\b/g, " ");
    n = n.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    if (!n || n.length < 5) return [];
    const parts = n.split(" ");
    const out = [];
    if (n.length >= 6) out.push(n);
    if (parts.length >= 2) {
      const two = parts[0] + " " + parts[1];
      if (two.length >= 6) out.push(two);
    }
    if (parts[0] === "bhp") out.push("bhp");
    if (parts[0] === "rio" && (parts.length === 1 || parts[1] === "tinto")) {
      out.push("rio tinto");
      out.push("rio");
    }
    const seen = {};
    return out.filter(function (t) {
      if (seen[t]) return false;
      seen[t] = true;
      return true;
    });
  }

  function hexLookupKey(props) {
    if (!props) return "";
    const st = String(props.state || "").toLowerCase();
    const lon = Number(props.lon);
    const lat = Number(props.lat);
    if (!st || !isFinite(lon) || !isFinite(lat)) return "";
    return st + "|" + lon.toFixed(3) + "|" + lat.toFixed(3);
  }

  function ensureReports() {
    if (reportsPack) return Promise.resolve(reportsPack);
    if (reportsLoading) {
      return new Promise(function (resolve) {
        const t = setInterval(function () {
          if (reportsPack || !reportsLoading) {
            clearInterval(t);
            resolve(reportsPack);
          }
        }, 80);
      });
    }
    reportsLoading = true;
    return fetch(assetUrl("data/reports_index.json"))
      .then(function (r) {
        if (!r.ok) throw new Error("reports_index HTTP " + r.status);
        return r.json();
      })
      .then(function (pack) {
        reportsPack = pack;
        reportsLoaded = true;
        reportsLoading = false;
        return pack;
      })
      .catch(function (err) {
        reportsLoading = false;
        log("Reports index: " + err.message);
        return null;
      });
  }

  function reportHref(r) {
    if (!r) return "";
    return safeHttpUrl(r.u);
  }

  function reportLabel(r) {
    if (!r) return "";
    const y = r.y != null ? " (" + r.y + ")" : "";
    if (r.st === "wa" && r.a != null) return "WAMEX A" + r.a + " · " + (r.t || "") + y;
    const portal = (reportsPack && reportsPack.portals && reportsPack.portals[r.st]) || {};
    const who = portal.name ? portal.name + " · " : "";
    return who + (r.t || "Report") + y;
  }

  function lookupReportsByKeys(keys, cos) {
    const pack = reportsPack;
    if (!pack) return { rows: [], total: 0 };
    const seen = {};
    const rows = [];
    let total = 0;
    function addList(obj, key) {
      const ids = obj[key] || [];
      const extra = obj[key + "#n"];
      total += extra || ids.length;
      ids.forEach(function (i) {
        if (seen[i]) return;
        seen[i] = true;
        if (pack.reports[i]) rows.push(pack.reports[i]);
      });
    }
    (keys || []).forEach(function (k) { addList(pack.by_key || {}, k); });
    (cos || []).forEach(function (k) { addList(pack.by_co || {}, k); });
    rows.sort(function (a, b) { return (b.y || 0) - (a.y || 0); });
    if (total < rows.length) total = rows.length;
    return { rows: rows, total: total };
  }

  function reportsForHex(props) {
    if (!reportsPack || isDemoFlag(props.demo)) return { rows: [], total: 0, portal: null };
    const hid = hexLookupKey(props);
    const hexMap = reportsPack.hex || {};
    const ids = hexMap[hid] || [];
    const extra = hexMap[hid + "#n"];
    const rows = ids.map(function (i) { return reportsPack.reports[i]; }).filter(Boolean);
    let total = extra || rows.length;
    if (!rows.length) {
      const keys = [];
      const cos = companyLookupKeys(props.top_operators || "");
      const st = String(props.state || "").toLowerCase();
      findIndex.forEach(function (it) {
        if (it.kind !== "title" || itemIsDemo(it)) return;
        if (st && String(it.state).toLowerCase() !== st) return;
        if (it.lng == null) return;
        // cheap bbox around hex centre (~0.18°)
        if (Math.abs(it.lng - Number(props.lon)) > 0.2) return;
        if (Math.abs(it.lat - Number(props.lat)) > 0.2) return;
        extractTitleKeys(it.state, it.name || (it.props && it.props.name)).forEach(function (k) { keys.push(k); });
        companyLookupKeys(it.holder).forEach(function (c) { cos.push(c); });
      });
      const found = lookupReportsByKeys(keys, cos);
      return { rows: found.rows, total: found.total, portal: (reportsPack.portals || {})[st] };
    }
    if (total < rows.length) total = rows.length;
    return { rows: rows, total: total, portal: (reportsPack.portals || {})[String(props.state || "").toLowerCase()] };
  }

  function reportsForTitle(props) {
    if (!reportsPack || isDemoFlag(props.demo)) return { rows: [], total: 0 };
    const st = String(props.state || "").toLowerCase();
    const keys = extractTitleKeys(st, props.name || "");
    const cos = companyLookupKeys(props.holder || "");
    return lookupReportsByKeys(keys, cos);
  }

  function reportsHtml(found, cap) {
    cap = cap || 8;
    if (!found) return "";
    const rows = found.rows || [];
    const total = found.total || rows.length;
    let html = '<div class="popup-links"><h4>Reports</h4>';
    if (!rows.length) {
      const p = found.portal;
      if (p && p.home && !p.empty) {
        html += '<a class="popup-link" href="' + escapeHtml(p.home) + '" target="_blank" rel="noopener">' +
          escapeHtml((p.name || "Portal") + " search") + "</a>";
      } else if (p && p.empty) {
        html += '<p class="popup-more">No SA reports in the harvest (catalogue WAF 403).</p>';
      } else {
        html += '<p class="popup-more">No joined reports for this cell.</p>';
      }
      html += "</div>";
      return html;
    }
    const show = rows.slice(0, cap);
    show.forEach(function (r) {
      if (isDemoString(r.t)) return;
      const href = reportHref(r);
      const label = reportLabel(r);
      if (href) {
        html += '<a class="popup-link" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' +
          escapeHtml(label) + "</a>";
      } else {
        html += '<div class="popup-id">' + escapeHtml(label) + "</div>";
      }
    });
    if (total > show.length) {
      html += '<p class="popup-more">Showing ' + show.length.toLocaleString() + " of " + total.toLocaleString() + "</p>";
    }
    html += "</div>";
    return html;
  }

  function exampleIdsHtml(props) {
    const raw = props.sample_hole_ids || props.sample_ids || "";
    if (isBlank(raw) || isDemoString(raw) || isDemoFlag(props.demo)) {
      return escapeHtml(fillField(raw, DEMO_NA));
    }
    return String(raw)
      .split(/[,;]+/)
      .map(function (id) { return id.trim(); })
      .filter(Boolean)
      .map(function (id) {
        return '<span class="popup-id">' + escapeHtml(id) + "</span>";
      })
      .join(", ");
  }

  function bindPinButton(props) {
    const btn = document.getElementById("pin-this");
    if (!btn || !props || !props.name) return;
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      pinTitleName(props.name);
    });
  }

  function pinTitleName(name) {
    if (!name || isDemoString(name)) return;
    const pins = parseTitleList((groundTitles && groundTitles.value) || ground.titles.join(","));
    if (pins.map(function (x) { return x.toLowerCase(); }).indexOf(String(name).toLowerCase()) < 0) {
      pins.push(name);
    }
    if (groundTitles) groundTitles.value = pins.join(", ");
    applyGroundFromForm(true);
  }

  function nearbyLiveTitles(lng, lat, state) {
    const st = String(state || "").toLowerCase();
    const out = [];
    const seen = {};
    function add(p, dist) {
      if (!p || isDemoFlag(p.demo)) return;
      if (st && p.state && String(p.state).toLowerCase() !== st) return;
      const key = String(p.name || "") + "|" + String(p.tenure || p.holder || "");
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push({ props: p, dist: dist == null ? 0 : dist });
    }
    const layers = titleFillIds();
    if (layers.length && map.project) {
      const pt = map.project([lng, lat]);
      map.queryRenderedFeatures(pt, { layers: layers }).forEach(function (f) {
        add(f.properties || {}, 0);
      });
    }
    const radius = 0.03;
    findIndex.forEach(function (it) {
      if (it.kind !== "title" || it.life === "dead" || itemIsDemo(it)) return;
      if (st && String(it.state || "").toLowerCase() !== st) return;
      if (it.lng == null || it.lat == null) return;
      const dx = Number(it.lng) - lng;
      const dy = Number(it.lat) - lat;
      if (Math.abs(dx) > radius || Math.abs(dy) > radius) return;
      add(it.props || { name: it.name, holder: it.holder, state: it.state, tenure: it.tenure }, Math.sqrt(dx * dx + dy * dy));
    });
    out.sort(function (a, b) { return a.dist - b.dist; });
    return out.slice(0, 6);
  }

  function reportsForOcc(props, titles) {
    if (!reportsPack || isDemoFlag(props.demo)) return { rows: [], total: 0, portal: null };
    const st = String(props.state || "").toLowerCase();
    const keys = [];
    const cos = [];
    (titles || []).forEach(function (t) {
      const p = t.props || t;
      extractTitleKeys(p.state || st, p.name || "").forEach(function (k) { keys.push(k); });
      companyLookupKeys(p.holder || "").forEach(function (c) { cos.push(c); });
    });
    const found = lookupReportsByKeys(keys, cos);
    return { rows: found.rows, total: found.total, portal: (reportsPack.portals || {})[st] };
  }

  function occLeafSub(p) {
    const bits = [];
    if (p.state) bits.push(String(p.state).toUpperCase());
    if (p.comm) bits.push(p.comm);
    if (p.prod) bits.push(p.prod);
    else if (p.size) bits.push(p.size);
    return bits.join(" · ");
  }

  function showOccIdentify(lngLat, props) {
    props = props || {};
    popup.setLngLat(lngLat).setHTML(occPopupHtml(props) + '<div id="popup-extra"></div>').addTo(map);
    const extraWait = function () {
      const el = document.getElementById("popup-extra");
      if (!el) return;
      if (isDemoFlag(props.demo)) {
        el.innerHTML = '<p class="popup-more">DEMO — no title or report join.</p>';
        return;
      }
      const titles = nearbyLiveTitles(lngLat.lng, lngLat.lat, props.state);
      let html = "";
      if (titles.length) {
        html += '<div class="popup-links"><h4>Nearby live titles</h4>';
        titles.slice(0, 4).forEach(function (t, i) {
          const p = t.props || {};
          const label = p.name || p.tenure || "Title";
          const sub = [p.state ? String(p.state).toUpperCase() : "", p.holder || ""].filter(Boolean).join(" · ");
          html +=
            '<button type="button" class="find-hit occ-near-title" data-i="' +
            i +
            '"><strong>' +
            escapeHtml(String(label)) +
            "</strong><span>" +
            escapeHtml(sub) +
            "</span></button>";
        });
        html += "</div>";
      }
      html += reportsHtml(reportsForOcc(props, titles), 6);
      el.innerHTML = html;
      el.querySelectorAll(".occ-near-title").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const t = titles[Number(btn.getAttribute("data-i"))];
          if (!t) return;
          const p = t.props || {};
          showTitleIdentify(lngLat, p);
        });
      });
    };
    if (reportsPack) extraWait();
    else ensureReports().then(extraWait);
  }

  function showOccCluster(lngLat, clusterId, coords) {
    const src = map.getSource("occ");
    if (!src || src.getClusterLeaves == null) {
      map.easeTo({ center: coords, zoom: Math.min(map.getZoom() + 2, 12) });
      return;
    }
    src.getClusterLeaves(clusterId, 80, 0).then(function (leaves) {
      const named = [];
      let unnamed = 0;
      (leaves || []).forEach(function (f) {
        const p = f.properties || {};
        const xy = (f.geometry && f.geometry.coordinates) || coords;
        if (p.name) named.push({ props: p, lng: xy[0], lat: xy[1] });
        else unnamed++;
      });
      named.sort(function (a, b) {
        const ap = a.props.prod ? 1 : 0;
        const bp = b.props.prod ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return String(a.props.name || "").localeCompare(String(b.props.name || ""));
      });
      const show = named.slice(0, 12);
      const title = named.length
        ? named.length.toLocaleString() + " named site" + (named.length === 1 ? "" : "s") + " in this cluster"
        : "Historic workings in this cluster";
      let html =
        '<div class="popup-kicker">Occurrences</div><div class="popup-title">' +
        escapeHtml(title) +
        "</div>";
      show.forEach(function (it, i) {
        html +=
          '<button type="button" class="find-hit occ-leaf" data-i="' +
          i +
          '"><strong>' +
          escapeHtml(String(it.props.name)) +
          "</strong><span>" +
          escapeHtml(occLeafSub(it.props)) +
          "</span></button>";
      });
      if (named.length > show.length) {
        html +=
          '<p class="popup-more">Showing ' +
          show.length.toLocaleString() +
          " of " +
          named.length.toLocaleString() +
          " named sites</p>";
      }
      if (unnamed) {
        html +=
          '<p class="popup-more">+ ' +
          unnamed.toLocaleString() +
          " unnamed historic working" +
          (unnamed === 1 ? "" : "s") +
          "</p>";
      }
      html += '<button type="button" class="popup-pin" id="cluster-zoom">Zoom in</button>';
      popup.setLngLat(lngLat).setHTML(html).addTo(map);
      const root = popup.getElement();
      if (root) {
        root.querySelectorAll(".occ-leaf").forEach(function (btn) {
          btn.addEventListener("click", function () {
            const it = show[Number(btn.getAttribute("data-i"))];
            if (!it) return;
            showOccIdentify({ lng: it.lng, lat: it.lat }, it.props);
          });
        });
        const zbtn = root.querySelector("#cluster-zoom");
        if (zbtn) {
          zbtn.addEventListener("click", function () {
            src.getClusterExpansionZoom(clusterId).then(function (z) {
              map.easeTo({ center: coords, zoom: z });
            });
          });
        }
      }
    }).catch(function () {
      map.easeTo({ center: coords, zoom: Math.min(map.getZoom() + 2, 12) });
    });
  }

  function showTitleIdentify(lngLat, props) {
    lastTitle = { name: props.name, holder: props.holder, state: props.state, lng: lngLat.lng, lat: lngLat.lat };
    const extra = '<button type="button" class="popup-pin" id="pin-this">Pin this title</button><div id="popup-extra"></div>';
    popup.setLngLat(lngLat).setHTML(popupHtml(props) + extra).addTo(map);
    bindPinButton(props);
    ensureReports().then(function () {
      const el = document.getElementById("popup-extra");
      if (el) el.innerHTML = reportsHtml(reportsForTitle(props), 8);
    });
  }

  function showHexIdentify(lngLat, props, label) {
    const rows = hexPopupHtml(props, label);
    popup.setLngLat(lngLat).setHTML(rows + '<div id="popup-extra"><p class="popup-more">Loading reports…</p></div>').addTo(map);
    const extraWait = function () {
      const el = document.getElementById("popup-extra");
      if (!el) return;
      if (isDemoFlag(props.demo)) {
        el.innerHTML = '<p class="popup-more">DEMO cell — no report links.</p>';
        return;
      }
      el.innerHTML = reportsHtml(reportsForHex(props), 8);
    };
    if (reportsPack) extraWait();
    else ensureReports().then(extraWait);
  }

  function showReportIdentify(lngLat, props) {
    const n = Number(props.n) || 0;
    const title = (props.tn || "Title") + (n ? " · " + n.toLocaleString() + " report" + (n === 1 ? "" : "s") : "");
    let html = popupWrap("Reports", title, [
      ["State", fillField(String(props.st || "").toUpperCase(), DEMO_NA)],
      ["Title", fillField(props.tn, DEMO_NA)]
    ]);
    html += '<div id="popup-extra"></div>';
    popup.setLngLat(lngLat).setHTML(html).addTo(map);
    ensureReports().then(function (pack) {
      const el = document.getElementById("popup-extra");
      if (!el || !pack) return;
      const ids = String(props.ids || "").split(",").map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); });
      // geojson may stringify arrays
      let idList = props.ids;
      if (typeof idList === "string") {
        try { idList = JSON.parse(idList); } catch (e) {
          idList = idList.split(/[,\s]+/).map(Number).filter(function (x) { return !isNaN(x); });
        }
      }
      const rows = (idList || []).map(function (i) { return pack.reports[i]; }).filter(Boolean);
      const found = { rows: rows, total: n || rows.length, portal: (pack.portals || {})[props.st] };
      if (!rows.length && props.tn) {
        const alt = lookupReportsByKeys(extractTitleKeys(props.st, props.tn), []);
        found.rows = alt.rows;
        found.total = alt.total || n;
      }
      el.innerHTML = reportsHtml(found, 8);
    });
  }

  function readStoredGround() {
    try {
      return JSON.parse(localStorage.getItem(GROUND_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeStoredGround() {
    try {
      localStorage.setItem(GROUND_KEY, JSON.stringify(ground));
    } catch (e) {}
  }

  function formToGround() {
    ground = {
      name: groundName ? String(groundName.value || "").trim() : "",
      company: groundCompany ? String(groundCompany.value || "").trim() : "",
      titles: groundTitles ? parseTitleList(groundTitles.value) : []
    };
    const vsRaw = groundVs ? String(groundVs.value || "").trim() : "";
    if (vsRaw) {
      const parts = vsRaw.split(/[,/|]+/).map(function (x) { return x.trim(); }).filter(Boolean);
      vsPair = parts.length >= 2 ? [parts[0], parts[1]] : null;
    } else {
      vsPair = null;
    }
  }

  function groundToForm() {
    if (groundName) groundName.value = ground.name || "";
    if (groundCompany) groundCompany.value = ground.company || "";
    if (groundTitles) groundTitles.value = (ground.titles || []).join(", ");
    if (groundVs) groundVs.value = vsPair ? vsPair.join(", ") : "";
  }

  function syncShareUrl() {
    const u = new URL(window.location.href);
    ["company", "vs", "titles", "name"].forEach(function (k) { u.searchParams.delete(k); });
    if (vsPair && vsPair[0] && vsPair[1]) u.searchParams.set("vs", vsPair[0] + "," + vsPair[1]);
    else if (ground.company) u.searchParams.set("company", ground.company);
    if (ground.titles && ground.titles.length) u.searchParams.set("titles", ground.titles.join(","));
    if (ground.name) u.searchParams.set("name", ground.name);
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  }

  function loadGroundFromUrlOrStorage() {
    const u = new URL(window.location.href);
    const stored = readStoredGround();
    ground = {
      name: u.searchParams.get("name") || stored.name || "",
      company: u.searchParams.get("company") || stored.company || "",
      titles: parseTitleList(u.searchParams.get("titles") || (stored.titles || []).join(","))
    };
    const vs = u.searchParams.get("vs");
    if (vs) {
      const parts = vs.split(/[,/|]+/).map(function (x) { return x.trim(); }).filter(Boolean);
      vsPair = parts.length >= 2 ? [parts[0], parts[1]] : null;
    } else if (stored.vs && stored.vs.length >= 2) {
      vsPair = [stored.vs[0], stored.vs[1]];
    } else {
      vsPair = null;
    }
    groundToForm();
  }

  function holdersMatching(q) {
    const out = {};
    if (!q) return [];
    findIndex.forEach(function (it) {
      if (it.kind !== "title" || itemIsDemo(it)) return;
      if (holderMatchesCompany(it.holder || "", q)) out[it.holder] = true;
    });
    titleHolders.forEach(function (h) {
      if (holderMatchesCompany(h, q)) out[h] = true;
    });
    return Object.keys(out);
  }

  function countTitlesForCompany(q) {
    const cached = companyApiCache[String(q || "").toLowerCase()];
    if (cached && cached.title_count != null) return cached.title_count;
    let n = 0;
    findIndex.forEach(function (it) {
      if (it.kind !== "title" || itemIsDemo(it) || it.life === "dead") return;
      if (holderMatchesCompany(it.holder || "", q)) n++;
    });
    return n;
  }

  function applyGroundFilters() {
    const pins = ground.titles || [];
    const company = ground.company;
    const vs = vsPair;
    STATES.forEach(function (s) {
      ["live", "dead"].forEach(function (life) {
        const fill = layerId(s.id, life) + "-fill";
        const line = layerId(s.id, life) + "-line";
        if (!map.getLayer(fill)) return;
        if (vs && vs[0] && vs[1]) {
          const ha = holdersMatching(vs[0]);
          const hb = holdersMatching(vs[1]);
          const all = ha.concat(hb);
          if (!all.length) {
            map.setFilter(fill, ["==", ["get", "name"], "__none__"]);
            map.setFilter(line, ["==", ["get", "name"], "__none__"]);
          } else {
            const f = ["in", ["get", "holder"], ["literal", all]];
            map.setFilter(fill, f);
            map.setFilter(line, f);
            map.setPaintProperty(fill, "fill-color", [
              "case",
              ["in", ["get", "holder"], ["literal", ha.length ? ha : ["__none__"]]],
              VS_A_COLOR,
              VS_B_COLOR
            ]);
            map.setPaintProperty(line, "line-color", [
              "case",
              ["in", ["get", "holder"], ["literal", ha.length ? ha : ["__none__"]]],
              VS_A_COLOR,
              VS_B_COLOR
            ]);
          }
          return;
        }
        map.setPaintProperty(fill, "fill-color", titlePaintColor(life));
        map.setPaintProperty(line, "line-color", titlePaintColor(life));
        const clauses = [];
        if (company) {
          const hs = holdersMatching(company);
          if (hs.length) clauses.push(["in", ["get", "holder"], ["literal", hs]]);
          else clauses.push(["==", ["get", "name"], "__none__"]);
        }
        if (pins.length) {
          clauses.push(["in", ["downcase", ["to-string", ["get", "name"]]], ["literal", pins.map(function (p) { return p.toLowerCase(); })]]);
        }
        if (clauses.length && !findQuery) {
          const f = clauses.length === 1 ? clauses[0] : ["any"].concat(clauses);
          map.setFilter(fill, f);
          map.setFilter(line, f);
        } else if (findQuery) {
          map.setFilter(fill, titleSearchFilter(findQuery));
          map.setFilter(line, titleSearchFilter(findQuery));
        } else {
          map.setFilter(fill, null);
          map.setFilter(line, null);
        }
      });
    });
    if (groundStatus) {
      if (vs && vs[0] && vs[1]) {
        const na = countTitlesForCompany(vs[0]);
        const nb = countTitlesForCompany(vs[1]);
        groundStatus.textContent = vs[0] + " " + na.toLocaleString() + " vs " + vs[1] + " " + nb.toLocaleString() + " live titles. Share this URL.";
      } else if (company || pins.length) {
        const n = company ? countTitlesForCompany(company) : 0;
        groundStatus.textContent = (ground.name ? ground.name + " · " : "") +
          (company ? company + " · " + n.toLocaleString() + " live titles" : "") +
          (pins.length ? (company ? " · " : "") + pins.length + " pinned" : "") +
          ". Saved in this browser.";
      } else {
        groundStatus.textContent = "Saved in this browser. Share with ?company=BHP or ?vs=BHP,RIO.";
      }
      if (apiStatus.live && (company || (vs && vs[0]))) {
        groundStatus.textContent += " National register.";
      } else if (!apiStatus.live && apiStatus.checked && (company || (vs && vs[0]))) {
        groundStatus.textContent += " Register offline — counts from loaded packs.";
      }
    }
    updateLegend();
  }

  function applyGroundFromForm(persist) {
    formToGround();
    if (persist) {
      const stored = { name: ground.name, company: ground.company, titles: ground.titles, vs: vsPair };
      try { localStorage.setItem(GROUND_KEY, JSON.stringify(stored)); } catch (e) {}
      syncShareUrl();
    }
    const jobs = [];
    if (vsPair && vsPair[0]) {
      jobs.push(ensureLiveForCompany(vsPair[0]));
      jobs.push(ensureLiveForCompany(vsPair[1]));
    } else if (ground.company) {
      jobs.push(ensureLiveForCompany(ground.company));
    }
    Promise.all(jobs).then(function () {
      if (apiStatus.live) plotCompanyGroundOverlay();
      applyGroundFilters();
      if (liveTitlesUsingApi) scheduleLiveTitles();
    });
  }

  function plotCompanyGroundOverlay() {
    if (!apiStatus.live) return;
    if (vsPair && vsPair[0] && vsPair[1]) {
      const a = companyApiCache[String(vsPair[0]).toLowerCase()] || { features: [] };
      const b = companyApiCache[String(vsPair[1]).toLowerCase()] || { features: [] };
      const feats = [];
      (a.features || []).forEach(function (f) {
        const p = Object.assign({}, f.properties || {}, { _vs: "a" });
        feats.push({ type: "Feature", id: f.id, geometry: f.geometry, properties: p });
      });
      (b.features || []).forEach(function (f) {
        const p = Object.assign({}, f.properties || {}, { _vs: "b" });
        feats.push({ type: "Feature", id: f.id, geometry: f.geometry, properties: p });
      });
      setCompanyFeatures(feats, true);
      return;
    }
    if (ground.company) {
      const rec = companyApiCache[String(ground.company).toLowerCase()];
      if (rec && rec.features && rec.features.length) {
        setCompanyFeatures(rec.features, false);
        return;
      }
    }
    if (!findQuery) clearCompanyOverlay();
  }

  function ensureLiveForCompany(q) {
    if (!q) return;
    if (apiStatus.live) {
      const key = String(q).toLowerCase();
      if (companyApiCache[key] && companyApiCache[key].features) {
        return Promise.resolve(companyApiCache[key]);
      }
      return fetchApi("/v1/company", { q: q }, 15000).then(function (data) {
        const feats = ((data.titles && data.titles.features) || []).map(normalizeTitleFeature);
        companyApiCache[key] = {
          title_count: Number(data.title_count || 0),
          features: feats,
          occs: ((data.occurrences && data.occurrences.features) || []).map(function (f) {
            const c = featureCenter(f) || [null, null];
            return occItemFromProps(f.properties || {}, c[0], c[1]);
          })
        };
        return companyApiCache[key];
      }).catch(function (err) {
        log("Company register: " + ((err && err.message) || "failed"));
        return null;
      });
    }
    const states = {};
    findIndex.forEach(function (it) {
      if (it.kind !== "title" || it.life === "dead") return;
      if (holderMatchesCompany(it.holder || "", q)) states[it.state] = true;
    });
    Object.keys(states).forEach(ensureLiveTitleOn);
    return Promise.resolve(null);
  }

  function initGroundUi() {
    loadGroundFromUrlOrStorage();
    if (groundApply) groundApply.addEventListener("click", function () { applyGroundFromForm(true); });
    if (groundClear) groundClear.addEventListener("click", function () {
      ground = { name: "", company: "", titles: [] };
      vsPair = null;
      groundToForm();
      try { localStorage.removeItem(GROUND_KEY); } catch (e) {}
      syncShareUrl();
      if (liveTitlesUsingApi) clearCompanyOverlay();
      applyGroundFilters();
      if (liveTitlesUsingApi) scheduleLiveTitles();
    });
    if (groundPin) groundPin.addEventListener("click", function () {
      if (lastTitle && lastTitle.name) pinTitleName(lastTitle.name);
    });
    ["change", "keydown"].forEach(function (ev) {
      [groundCompany, groundVs, groundTitles, groundName].forEach(function (el) {
        if (!el) return;
        el.addEventListener(ev, function (e) {
          if (ev === "keydown" && e.key !== "Enter") return;
          applyGroundFromForm(true);
        });
      });
    });
  }

  function pointInBox(lng, lat, b) {
    return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
  }

  function geomBbox(geom) {
    if (!geom) return null;
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    function walk(c) {
      if (typeof c[0] === "number") {
        if (c[0] < minX) minX = c[0];
        if (c[1] < minY) minY = c[1];
        if (c[0] > maxX) maxX = c[0];
        if (c[1] > maxY) maxY = c[1];
      } else c.forEach(walk);
    }
    walk(geom.coordinates || []);
    return [minX, minY, maxX, maxY];
  }

  function bboxHits(a, b) {
    return !(a[2] < b.west || a[0] > b.east || a[3] < b.south || a[1] > b.north);
  }

  function pointInLngLatBbox(lng, lat, b) {
    return lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;
  }

  function lngLatBboxesOverlap(a, b) {
    return !(a.east < b.west || a.west > b.east || a.north < b.south || a.south > b.north);
  }

  function isInAct(lng, lat) {
    return pointInLngLatBbox(lng, lat, ACT_BBOX);
  }

  function statesForPoint(lng, lat) {
    if (isInAct(lng, lat)) return [];
    const out = [];
    STATES.forEach(function (s) {
      const bb = STATE_BBOXES[s.id];
      if (bb && pointInLngLatBbox(lng, lat, bb)) out.push(s.id);
    });
    return out;
  }

  function statesForBounds(bounds) {
    const out = [];
    STATES.forEach(function (s) {
      const bb = STATE_BBOXES[s.id];
      if (bb && lngLatBboxesOverlap(bb, bounds)) out.push(s.id);
    });
    return out;
  }

  function statesInView() {
    const b = map.getBounds();
    return statesForBounds({
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth()
    });
  }

  function pointInRing(lng, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const denom = yj - yi;
      if (((yi > lat) !== (yj > lat)) && denom !== 0 && (lng < (xj - xi) * (lat - yi) / denom + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  function pointInPolygonCoords(lng, lat, coords) {
    if (!coords || !coords.length) return false;
    if (!pointInRing(lng, lat, coords[0])) return false;
    for (let h = 1; h < coords.length; h++) {
      if (pointInRing(lng, lat, coords[h])) return false;
    }
    return true;
  }

  function pointInGeom(lng, lat, geom) {
    if (!geom) return false;
    if (geom.type === "Polygon") return pointInPolygonCoords(lng, lat, geom.coordinates);
    if (geom.type === "MultiPolygon") {
      for (let i = 0; i < (geom.coordinates || []).length; i++) {
        if (pointInPolygonCoords(lng, lat, geom.coordinates[i])) return true;
      }
    }
    return false;
  }

  function anyCoordInBox(geom, bounds) {
    let hit = false;
    function walk(c) {
      if (hit) return;
      if (typeof c[0] === "number") {
        if (pointInBox(c[0], c[1], bounds)) hit = true;
      } else c.forEach(walk);
    }
    if (geom && geom.coordinates) walk(geom.coordinates);
    return hit;
  }

  function geomOverlapsBox(geom, bb, bounds) {
    if (!geom || !bb) return false;
    if (!bboxHits(bb, bounds)) return false;
    if (anyCoordInBox(geom, bounds)) return true;
    if (pointInGeom(bounds.west, bounds.south, geom)) return true;
    if (pointInGeom(bounds.east, bounds.south, geom)) return true;
    if (pointInGeom(bounds.west, bounds.north, geom)) return true;
    if (pointInGeom(bounds.east, bounds.north, geom)) return true;
    const cx = (bounds.west + bounds.east) / 2;
    const cy = (bounds.south + bounds.north) / 2;
    return pointInGeom(cx, cy, geom);
  }

  function indexLiveTitleGeoms(state, gj) {
    const rows = [];
    (gj.features || []).forEach(function (f) {
      const p = f.properties || {};
      if (isDemoFlag(p.demo)) return;
      const geom = f.geometry;
      const bb = geomBbox(geom);
      if (!bb) return;
      rows.push({ props: p, geom: geom, bbox: bb, state: state });
    });
    liveTitleIndex[state] = rows;
  }

  function titleCoverKey(p) {
    return String((p && p.state) || "") + "|" + String((p && p.name) || "") + "|" +
      String((p && p.tenure) || "") + "|" + String((p && p.holder) || "");
  }

  function titlesCoveringPoint(lng, lat, stateIds) {
    const out = [];
    const seen = {};
    (stateIds || []).forEach(function (id) {
      const rows = liveTitleIndex[id] || [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const bb = row.bbox;
        if (lng < bb[0] || lng > bb[2] || lat < bb[1] || lat > bb[3]) continue;
        if (!pointInGeom(lng, lat, row.geom)) continue;
        const k = titleCoverKey(row.props);
        if (seen[k]) continue;
        seen[k] = true;
        out.push(row);
      }
    });
    return out;
  }

  function titlesOverlappingBox(bounds, stateIds) {
    const out = [];
    const seen = {};
    (stateIds || []).forEach(function (id) {
      const rows = liveTitleIndex[id] || [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!geomOverlapsBox(row.geom, row.bbox, bounds)) continue;
        const k = titleCoverKey(row.props);
        if (seen[k]) continue;
        seen[k] = true;
        out.push(row);
      }
    });
    return out;
  }

  function sampleGridSize(bounds) {
    const area = Math.abs((bounds.east - bounds.west) * (bounds.north - bounds.south));
    if (area > 4) return 10;
    if (area > 0.25) return 8;
    return 6;
  }

  function sampleOpenGroundApi(bounds) {
    const n = 3;
    const stepLng = (bounds.east - bounds.west) / n;
    const stepLat = (bounds.north - bounds.south) / n;
    const pts = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        pts.push({
          lng: bounds.west + (c + 0.5) * stepLng,
          lat: bounds.south + (r + 0.5) * stepLat
        });
      }
    }
    return Promise.all(pts.map(function (pt) {
      return fetchApi("/v1/open-ground", { lng: pt.lng, lat: pt.lat }, 8000);
    })).then(function (rows) {
      let vacant = 0, held = 0;
      rows.forEach(function (data) {
        if (data && data.open) vacant += 1;
        else held += 1;
      });
      return { n: pts.length, vacant: vacant, held: held, grid: n };
    });
  }

  function sampleOpenGround(bounds, stateIds) {
    const n = sampleGridSize(bounds);
    let vacant = 0;
    let held = 0;
    const stepLng = (bounds.east - bounds.west) / n;
    const stepLat = (bounds.north - bounds.south) / n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const lng = bounds.west + (c + 0.5) * stepLng;
        const lat = bounds.south + (r + 0.5) * stepLat;
        if (titlesCoveringPoint(lng, lat, stateIds).length) held++;
        else vacant++;
      }
    }
    return { n: n * n, vacant: vacant, held: held, grid: n };
  }

  function ensureLiveStates(stateIds, forceStatic) {
    if (apiStatus.live && !forceStatic) {
      ensureApiTitleLayers();
      scheduleLiveTitles();
      return Promise.resolve((stateIds || []).map(function () { return true; }));
    }
    const jobs = (stateIds || []).map(function (id) {
      const inp = liveBox ? liveBox.querySelector('input[data-state="' + id + '"][data-life="live"]') : null;
      if (inp && inp.disabled) return Promise.resolve(false);
      const st = STATES.find(function (x) { return x.id === id; });
      if (!st) return Promise.resolve(false);
      if (inp) inp.checked = true;
      return addStateLayers(id, "live", st.color).then(function (ok) {
        if (ok) {
          setVisible(id, "live", true);
          if (findQuery) applyTitleSearch(findQuery);
        }
        return ok;
      }).catch(function (err) {
        log("Live titles " + id.toUpperCase() + ": " + err.message);
        return false;
      });
    });
    return Promise.all(jobs).then(function (oks) {
      updateLegend();
      return oks;
    });
  }

  function fmtCoord(n) {
    return Number(n).toFixed(5);
  }

  function openDisclaimerHtml() {
    return '<p class="popup-more">' + escapeHtml(OPEN_DISCLAIMER) + "</p>";
  }

  function setOpenParam(val) {
    const u = new URL(window.location.href);
    if (val) u.searchParams.set("open", val);
    else u.searchParams.delete("open");
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  }

  function setOpenGroundMode(on, shareVal) {
    openGroundMode = !!on;
    const btn = document.getElementById("open-ground");
    if (btn) {
      btn.classList.toggle("active", openGroundMode);
      btn.setAttribute("aria-pressed", openGroundMode ? "true" : "false");
    }
    if (openGroundMode) {
      if (apiStatus.live) {
        log("Open ground on — click the map. Checking the live national register.");
      } else {
        ensureLiveStates(statesInView());
        log("Open ground on — click the map. Register offline; using loaded title packs.");
      }
      if (shareVal) setOpenParam(shareVal);
      else if (!new URL(window.location.href).searchParams.get("open")) setOpenParam("1");
    } else {
      setOpenParam("");
      log("Open ground off");
    }
  }

  function renderOpenGroundPopup(lngLat, titles, opts) {
    opts = opts || {};
    const lng = lngLat.lng;
    const lat = lngLat.lat;
    const share = fmtCoord(lng) + "," + fmtCoord(lat);
    const disclaimer = openDisclaimerHtml();
    if (opts.act) {
      popup.setHTML(
        popupWrap("Open ground", "ACT has no titles register", [
          ["Longitude", fmtCoord(lng)],
          ["Latitude", fmtCoord(lat)],
          ["Coverage", "ACT is not in the state title feeds"]
        ], "popup-open") + disclaimer
      );
      if (openGroundMode) setOpenParam(share);
      return;
    }
    if (opts.failed) {
      popup.setHTML(
        popupWrap("Open ground", opts.failedTitle || "Could not check titles", [
          ["Longitude", fmtCoord(lng)],
          ["Latitude", fmtCoord(lat)],
          ["Status", opts.failed]
        ], "popup-open") +
        '<p class="popup-more">Not marking this point as open.</p>'
      );
      return;
    }
    if (!titles.length) {
      popup.setHTML(
        popupWrap("Open ground", "No live title covers this point", [
          ["Status", "Open ground"],
          ["State", opts.stateLabel || ""],
          ["Longitude", fmtCoord(lng)],
          ["Latitude", fmtCoord(lat)],
          ["Source", opts.source || "Live register"]
        ].filter(function (r) { return r[1]; }), "popup-open") + disclaimer
      );
      if (openGroundMode) setOpenParam(share);
      return;
    }
    const first = titles[0].props || titles[0] || {};
    const np = normalizeTitleProps(first);
    const heading = titles.length === 1
      ? fillField(np.name, "Live title")
      : titles.length.toLocaleString() + " live titles cover this point";
    const rows = [
      ["State", fillField(np.state ? String(np.state).toUpperCase() : "", DEMO_NA)],
      ["Tenure", fillField(np.tenure, DEMO_NA)],
      ["Status", fillField(np.status, "DEMO current")],
      ["Name", fillField(np.name, "DEMO unnamed title")],
      ["Holder", fillField(np.holder, demoHolder(np.name || np.tenure || ""))],
      ["Grant", fillField(np.grant, DEMO_NA)],
      ["Expiry", fillField(np.expiry, DEMO_NA)]
    ];
    const lic = commercialUseRow(np);
    if (lic) rows.push(lic);
    let html = popupWrap("Held", heading, rows, "popup-held");
    html += '<div class="popup-links"><h4>Covering live titles</h4>';
    titles.slice(0, 8).forEach(function (t, i) {
      const p = normalizeTitleProps(t.props || t);
      const label = p.name || p.tenure || "Title";
      const sub = [p.state ? String(p.state).toUpperCase() : "", p.tenure || "", p.holder || ""].filter(Boolean).join(" · ");
      html +=
        '<button type="button" class="find-hit open-title" data-i="' +
        i +
        '"><strong>' +
        escapeHtml(String(label)) +
        "</strong><span>" +
        escapeHtml(sub) +
        "</span></button>";
    });
    if (titles.length > 8) {
      html += '<p class="popup-more">Showing 8 of ' + titles.length.toLocaleString() + "</p>";
    }
    html += "</div>";
    html += '<button type="button" class="popup-pin" id="pin-this">Pin this title</button>';
    html += disclaimer;
    popup.setHTML(html);
    lastTitle = { name: np.name, holder: np.holder, state: np.state, lng: lng, lat: lat };
    bindPinButton(np);
    const root = popup.getElement();
    if (root) {
      root.querySelectorAll(".open-title").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const t = titles[Number(btn.getAttribute("data-i"))];
          if (t) showTitleIdentify(lngLat, t.props || t);
        });
      });
    }
    if (openGroundMode) setOpenParam(share);
  }

  function showOpenGroundFromIndex(lngLat) {
    const lng = lngLat.lng;
    const lat = lngLat.lat;
    if (isInAct(lng, lat)) {
      renderOpenGroundPopup(lngLat, [], { act: true });
      return Promise.resolve();
    }
    const states = statesForPoint(lng, lat);
    if (!states.length) {
      popup.setHTML(
        popupWrap("Open ground", "Outside title coverage", [
          ["Longitude", fmtCoord(lng)],
          ["Latitude", fmtCoord(lat)],
          ["Coverage", "Outside NSW, VIC, QLD, WA, SA, TAS, NT bounding boxes"]
        ], "popup-open") +
        '<p class="popup-more">No state title layer is loaded for this point. ACT has no titles register. This is not a vacant-land listing.</p>'
      );
      if (openGroundMode) setOpenParam(fmtCoord(lng) + "," + fmtCoord(lat));
      return Promise.resolve();
    }
    return ensureLiveStates(states, true).then(function (oks) {
      if (!popup.isOpen()) return;
      const failed = [];
      states.forEach(function (id, i) {
        if (oks[i] === false && !liveTitleIndex[id]) {
          const meta = layerMeta[id + "_live"];
          if (meta && meta.features) failed.push(id.toUpperCase());
        }
      });
      if (failed.length) {
        renderOpenGroundPopup(lngLat, [], {
          failed: "Could not load live titles for " + failed.join(", ") + ".",
          failedTitle: "Titles not loaded"
        });
        return;
      }
      const titles = titlesCoveringPoint(lng, lat, states);
      renderOpenGroundPopup(lngLat, titles, {
        stateLabel: states.map(function (s) { return s.toUpperCase(); }).join(" / "),
        source: "Static title packs (register offline or API error)"
      });
    });
  }

  function showOpenGroundIdentify(lngLat) {
    const lng = lngLat.lng;
    const lat = lngLat.lat;
    lastOpenPoint = { lng: lng, lat: lat };
    popup.setLngLat(lngLat).setHTML(
      popupWrap("Open ground", "Checking live titles…", [
        ["Longitude", fmtCoord(lng)],
        ["Latitude", fmtCoord(lat)]
      ], "popup-open")
    ).addTo(map);

    if (isInAct(lng, lat)) {
      renderOpenGroundPopup(lngLat, [], { act: true });
      return Promise.resolve();
    }

    if (!apiStatus.live) {
      if (apiStatus.checked) {
        log("Register offline — open-ground using loaded title packs.");
      }
      return showOpenGroundFromIndex(lngLat);
    }

    return fetchApi("/v1/open-ground", { lng: lng, lat: lat }, 12000).then(function (data) {
      if (!popup.isOpen()) return;
      const titles = (data.titles || []).map(function (t) {
        return { props: normalizeTitleProps(t) };
      });
      renderOpenGroundPopup(lngLat, titles, {
        source: "Live national register",
        stateLabel: titles[0] && titles[0].props && titles[0].props.state
          ? String(titles[0].props.state).toUpperCase()
          : ""
      });
    }).catch(function (err) {
      log("Open ground API failed — using loaded titles. " + ((err && err.message) || ""));
      return showOpenGroundFromIndex(lngLat);
    });
  }

  function initOpenGround() {
    const btn = document.getElementById("open-ground");
    if (btn) {
      btn.addEventListener("click", function () {
        setOpenGroundMode(!openGroundMode);
      });
    }
    map.on("moveend", function () {
      if (!openGroundMode) return;
      if (apiStatus.live) scheduleLiveTitles();
      else ensureLiveStates(statesInView());
    });
    const raw = new URL(window.location.href).searchParams.get("open");
    if (raw == null) return;
    const parts = String(raw).split(",");
    if (parts.length >= 2 && isFinite(Number(parts[0])) && isFinite(Number(parts[1]))) {
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      setOpenGroundMode(true, raw);
      map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 8) });
      map.once("moveend", function () {
        showOpenGroundIdentify({ lng: lng, lat: lat });
      });
    } else {
      setOpenGroundMode(true, raw || "1");
    }
  }

  function showBoxOnMap(b) {
    const ring = [
      [b.west, b.south], [b.east, b.south], [b.east, b.north], [b.west, b.north], [b.west, b.south]
    ];
    const gj = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: {} }] };
    if (!map.getSource("box-sel")) {
      map.addSource("box-sel", { type: "geojson", data: gj });
      map.addLayer({
        id: "box-sel-line",
        type: "line",
        source: "box-sel",
        paint: { "line-color": "#f2f2f2", "line-width": 1.2, "line-dasharray": [2, 1] }
      });
      map.addLayer({
        id: "box-sel-fill",
        type: "fill",
        source: "box-sel",
        paint: { "fill-color": "#ffffff", "fill-opacity": 0.06 }
      }, "box-sel-line");
    } else {
      map.getSource("box-sel").setData(gj);
    }
    map.fitBounds([[b.west, b.south], [b.east, b.north]], { padding: 48, maxZoom: 10, duration: 500 });
  }

  function packRow(label, sub, onClick, href) {
    const subHtml = href
      ? '<span><a href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + escapeHtml(sub) + "</a></span>"
      : "<span>" + escapeHtml(sub) + "</span>";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pack-row";
    btn.innerHTML = "<strong>" + escapeHtml(label) + "</strong>" + subHtml;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderPack(bounds) {
    lastBoxBounds = bounds;
    if (!packEl || !packBody) return;
    packEl.hidden = false;
    packBody.innerHTML = "<p class='note'>Collecting features in the box…</p>";
    if (occMaster && occMaster.checked && !occLoaded && !occLoading) {
      void withLayerBusy("Loading occurrences…", null, function () { return loadOccurrences(); });
    }
    if (holesMaster && holesMaster.checked && !holesLoaded && !holesLoading) {
      void withLayerBusy("Loading drilling…", null, function () { return loadHex("holes"); });
    }
    if (gchemMaster && gchemMaster.checked && !gchemLoaded && !gchemLoading) {
      void withLayerBusy("Loading samples…", null, function () { return loadHex("gchem"); });
    }
    const boxStates = statesForBounds(bounds);
    const aoiJob = apiStatus.live
      ? fetchApi("/v1/aoi", { bbox: bboxParam(bounds) }, 25000).catch(function (err) {
          log("Box pack AOI failed: " + ((err && err.message) || "error"));
          return null;
        })
      : Promise.resolve(null);
    const openJob = apiStatus.live
      ? sampleOpenGroundApi(bounds).catch(function () { return null; })
      : Promise.resolve(null);
    Promise.all([ensureLiveStates(boxStates), ensureReports(), aoiJob, openJob]).then(function (results) {
      const aoi = results[2];
      const openSample = results[3];
      const staticReady = (!aoi)
        ? ensureLiveStates(boxStates, true)
        : Promise.resolve();
      return staticReady.then(function () {
        return { aoi: aoi, openSample: openSample };
      });
    }).then(function (results) {
      const aoi = results.aoi;
      const openSample = results.openSample;
      const titles = [];
      const occs = [];
      const holes = [];
      const gchems = [];
      const holeCollars = [];
      if (aoi) {
        ((aoi.titles && aoi.titles.features) || []).forEach(function (f) {
          const p = normalizeTitleProps(f.properties || {});
          const c = featureCenter(f) || [null, null];
          titles.push(titleItemFromProps(p, c[0], c[1]));
        });
        ((aoi.occurrences && aoi.occurrences.features) || []).forEach(function (f) {
          const c = featureCenter(f) || [null, null];
          occs.push(occItemFromProps(f.properties || {}, c[0], c[1]));
        });
        ((aoi.holes_sample && aoi.holes_sample.features) || []).forEach(function (f) {
          const p = f.properties || {};
          const c = featureCenter(f) || [null, null];
          holeCollars.push({
            kind: "hole",
            state: jurisdictionToState(p.jurisdiction || p.state),
            name: p.hole_id || p.native_id || "Collar",
            lng: c[0],
            lat: c[1],
            props: p
          });
        });
      }
      if (!aoi) {
      findIndex.forEach(function (it) {
        if (itemIsDemo(it) || it.lng == null) return;
        if (it.kind === "title" && it.life !== "dead" && pointInBox(it.lng, it.lat, bounds)) titles.push(it);
        else if (it.kind === "occ" && pointInBox(it.lng, it.lat, bounds)) occs.push(it);
      });
      }
      const titleSeen = {};
      titles.forEach(function (it) {
        titleSeen[titleCoverKey(it.props || { name: it.name, holder: it.holder, state: it.state, tenure: it.tenure })] = true;
      });
      if (!aoi) titlesOverlappingBox(bounds, boxStates).forEach(function (row) {
        const p = row.props || {};
        const k = titleCoverKey(p);
        if (titleSeen[k]) return;
        titleSeen[k] = true;
        const c = geomCenter(row.geom);
        titles.push({
          kind: "title",
          state: row.state,
          life: "live",
          name: p.name || "",
          holder: p.holder || "",
          tenure: p.tenure || "",
          lng: c ? c[0] : (row.bbox[0] + row.bbox[2]) / 2,
          lat: c ? c[1] : (row.bbox[1] + row.bbox[3]) / 2,
          props: p
        });
      });
      function collectHex(kind, store, dest) {
        const gj = store[kind];
        if (gj && gj.features) {
          gj.features.forEach(function (f) {
            const p = f.properties || {};
            if (isDemoFlag(p.demo)) return;
            const bb = geomBbox(f.geometry);
            if (bb && bboxHits(bb, bounds)) dest.push({ kind: kind, props: p, lng: p.lon, lat: p.lat, name: (p.n != null ? Number(p.n).toLocaleString() + " " : "") + (kind === "holes" ? "holes" : "samples") });
          });
        } else {
          findIndex.forEach(function (it) {
            if (it.kind === kind && !itemIsDemo(it) && pointInBox(it.lng, it.lat, bounds)) dest.push(it);
          });
        }
      }
      collectHex("holes", hexStore, holes);
      collectHex("gchem", hexStore, gchems);

      const keys = [];
      const cos = [];
      titles.forEach(function (it) {
        extractTitleKeys(it.state, it.name || (it.props && it.props.name)).forEach(function (k) { keys.push(k); });
        companyLookupKeys(it.holder).forEach(function (c) { cos.push(c); });
      });
      holes.concat(gchems).forEach(function (it) {
        const p = it.props || {};
        companyLookupKeys(p.top_operators || it.operator || "").forEach(function (c) { cos.push(c); });
      });
      const found = lookupReportsByKeys(keys, cos);

      function section(title, arr, cap, render) {
        const wrap = document.createElement("div");
        wrap.className = "pack-section";
        const h = document.createElement("h3");
        const shown = Math.min(arr.length, cap);
        h.textContent = title + " · " + (arr.length > cap ? "Showing " + shown + " of " + arr.length : String(arr.length));
        wrap.appendChild(h);
        if (!arr.length) {
          const p = document.createElement("p");
          p.className = "note";
          p.textContent = "None in this box.";
          wrap.appendChild(p);
        }
        arr.slice(0, cap).forEach(function (it) { wrap.appendChild(render(it)); });
        return wrap;
      }

      packBody.innerHTML = "";
      const openWrap = document.createElement("div");
      openWrap.className = "pack-section";
      const openH = document.createElement("h3");
      openH.textContent = "Open ground";
      openWrap.appendChild(openH);
      const sample = openSample || sampleOpenGround(bounds, boxStates);
      const openP = document.createElement("p");
      openP.className = "note";
      const pct = sample.n ? Math.round((100 * sample.vacant) / sample.n) : 0;
      let openText;
      if (!openSample && !boxStates.length && !lngLatBboxesOverlap(bounds, ACT_BBOX)) {
        openText = "This box is outside the state bounding boxes we use to load title layers (NSW, VIC, QLD, WA, SA, TAS, NT).";
      } else if (sample.vacant === sample.n) {
        openText = "All " + sample.n + " sample points have no live title.";
      } else if (sample.vacant === 0) {
        openText = "All " + sample.n + " sample points are held by a live title.";
      } else {
        openText = pct + "% of sample points have no live title (" +
          sample.vacant + " vacant · " + sample.held + " held of " + sample.n + ").";
      }
      openText += " Point sample on a " + sample.grid + "×" + sample.grid +
        " grid — not a vacant cadastral polygon.";
      if (openSample) {
        openText += " Checked via the live open-ground register.";
      } else if (boxStates.length) {
        openText += " Loaded " + boxStates.map(function (s) { return s.toUpperCase(); }).join(", ") + " live titles.";
      }
      if (lngLatBboxesOverlap(bounds, ACT_BBOX)) {
        openText += " Box overlaps ACT, which has no titles register.";
      }
      openP.textContent = openText;
      openWrap.appendChild(openP);
      const openD = document.createElement("p");
      openD.className = "note";
      openD.textContent = OPEN_DISCLAIMER;
      openWrap.appendChild(openD);
      packBody.appendChild(openWrap);
      const titleCapLabel = aoi && aoi.title_count > titles.length
        ? "Live titles · " + aoi.title_count.toLocaleString() + " in box"
        : "Live titles";
      packBody.appendChild(section(titleCapLabel, titles, PACK_CAP.title, function (it) {
        return packRow(hitLabel(it), hitSub(it), function () {
          map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 9) });
          showTitleIdentify({ lng: it.lng, lat: it.lat }, it.props || { name: it.name, holder: it.holder, state: it.state, tenure: it.tenure });
        });
      }));
      const occCapLabel = aoi && aoi.occurrence_count > occs.length
        ? "Occurrences · " + aoi.occurrence_count.toLocaleString() + " in box"
        : "Occurrences";
      packBody.appendChild(section(occCapLabel, occs, PACK_CAP.occ, function (it) {
        return packRow(hitLabel(it), hitSub(it), function () {
          map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 9) });
          showOccIdentify({ lng: it.lng, lat: it.lat }, it.props || {});
        });
      }));
      if (aoi) {
        const holeNote = document.createElement("div");
        holeNote.className = "pack-section";
        const hh = document.createElement("h3");
        hh.textContent = "Drillholes · " + Number(aoi.hole_count || 0).toLocaleString() + " collars in box";
        holeNote.appendChild(hh);
        const hp = document.createElement("p");
        hp.className = "note";
        hp.textContent = "Register count only — not 3.4 million hole features. Showing up to 25 sample collars.";
        holeNote.appendChild(hp);
        holeCollars.slice(0, 25).forEach(function (it) {
          const p = it.props || {};
          const sub = [
            (it.state || "").toUpperCase(),
            p.hole_type || "",
            p.year || "",
            p.max_depth_m != null ? p.max_depth_m + " m" : "",
            commercialUseBlocked(p) ? "not for commercial use" : ""
          ].filter(Boolean).join(" · ");
          holeNote.appendChild(packRow(it.name || "Collar", sub, function () {
            if (it.lng != null) map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 10) });
          }));
        });
        packBody.appendChild(holeNote);
      }
      packBody.appendChild(section("Hole hexes", holes, PACK_CAP.holes, function (it) {
        return packRow(it.name || "Hole cell", (it.props && it.props.state || it.state || "").toUpperCase() + " · " + (it.props && it.props.top_operators || ""), function () {
          map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 7) });
          showHexIdentify({ lng: it.lng, lat: it.lat }, it.props || {}, "Holes");
        });
      }));
      packBody.appendChild(section("Geochem hexes", gchems, PACK_CAP.gchem, function (it) {
        return packRow(it.name || "Sample cell", (it.props && it.props.state || it.state || "").toUpperCase(), function () {
          map.easeTo({ center: [it.lng, it.lat], zoom: Math.max(map.getZoom(), 7) });
          showHexIdentify({ lng: it.lng, lat: it.lat }, it.props || {}, "Samples");
        });
      }));
      const reports = found.rows;
      if (aoi && aoi.report_count != null) {
        const rc = document.createElement("p");
        rc.className = "note";
        rc.textContent = "Register reports in box: " + Number(aoi.report_count).toLocaleString() +
          (aoi.report_count ? "" : " (none, or not yet joined).");
        packBody.appendChild(rc);
      }
      packBody.appendChild(section("Reports", reports, PACK_CAP.report, function (r) {
        const href = reportHref(r);
        return packRow(reportLabel(r), (r.st || "").toUpperCase() + (href ? " · open source" : ""), function () {
          if (href) window.open(href, "_blank", "noopener");
        }, href);
      }));
      if (reportsPack && reportsPack.portals && reportsPack.portals.sa && reportsPack.portals.sa.empty) {
        const note = document.createElement("p");
        note.className = "note";
        note.textContent = "SA reports were not harvested (SARIG CSW WAF 403).";
        packBody.appendChild(note);
      }
    });
  }

  function screenToLngLat(ev) {
    const rect = map.getCanvas().getBoundingClientRect();
    return map.unproject([ev.clientX - rect.left, ev.clientY - rect.top]);
  }

  function updateDrawRect(ev) {
    if (!boxStart || !drawBoxEl) return;
    const rect = map.getCanvas().getBoundingClientRect();
    const x0 = boxStart.px;
    const y0 = boxStart.py;
    const x1 = ev.clientX - rect.left;
    const y1 = ev.clientY - rect.top;
    const left = Math.min(x0, x1) + rect.left - map.getContainer().getBoundingClientRect().left;
    const top = Math.min(y0, y1) + rect.top - map.getContainer().getBoundingClientRect().top;
    drawBoxEl.hidden = false;
    drawBoxEl.style.left = Math.min(ev.clientX, boxStart.cx) + "px";
    drawBoxEl.style.top = Math.min(ev.clientY, boxStart.cy) + "px";
    drawBoxEl.style.width = Math.abs(ev.clientX - boxStart.cx) + "px";
    drawBoxEl.style.height = Math.abs(ev.clientY - boxStart.cy) + "px";
  }

  function finishBox(ev) {
    if (!boxDrawing || !boxStart) return;
    boxDrawing = false;
    map.dragPan.enable();
    if (drawBoxEl) drawBoxEl.hidden = true;
    const a = boxStart.ll;
    const b = screenToLngLat(ev);
    const west = Math.min(a.lng, b.lng);
    const east = Math.max(a.lng, b.lng);
    const south = Math.min(a.lat, b.lat);
    const north = Math.max(a.lat, b.lat);
    boxDrawMode = false;
    if (boxTool) boxTool.classList.remove("active");
    skipNextClick = true;
    if (Math.abs(east - west) < 0.01 && Math.abs(north - south) < 0.01) return;
    const bounds = { west: west, south: south, east: east, north: north };
    showBoxOnMap(bounds);
    renderPack(bounds);
  }

  function initBoxTool() {
    if (boxTool) {
      boxTool.addEventListener("click", function () {
        boxDrawMode = !boxDrawMode;
        boxTool.classList.toggle("active", boxDrawMode);
      });
    }
    if (packClose) packClose.addEventListener("click", function () {
      if (packEl) packEl.hidden = true;
    });
    map.getCanvas().addEventListener("mousedown", function (ev) {
      if (!(ev.shiftKey || boxDrawMode) || ev.button !== 0) return;
      ev.preventDefault();
      map.dragPan.disable();
      boxDrawing = true;
      const rect = map.getCanvas().getBoundingClientRect();
      boxStart = {
        ll: screenToLngLat(ev),
        cx: ev.clientX,
        cy: ev.clientY,
        px: ev.clientX - rect.left,
        py: ev.clientY - rect.top
      };
    });
    window.addEventListener("mousemove", function (ev) {
      if (!boxDrawing) return;
      updateDrawRect(ev);
    });
    window.addEventListener("mouseup", function (ev) {
      if (!boxDrawing) return;
      finishBox(ev);
    });
  }

  function loadReportsPts() {
    if (reportsPtsLoaded) {
      ["rpt-clusters", "rpt-cluster-count", "rpt-point"].forEach(function (id) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", reportsMaster && reportsMaster.checked ? "visible" : "none");
      });
      return Promise.resolve();
    }
    if (reportsLoadPromise) return reportsLoadPromise;
    reportsLoadPromise = fetch(assetUrl("data/reports_pts.geojson"))
      .then(function (r) {
        if (!r.ok) throw new Error("reports_pts HTTP " + r.status);
        return r.json();
      })
      .then(function (gj) {
        if (!map.getSource("reports")) {
          map.addSource("reports", {
            type: "geojson",
            data: gj,
            cluster: true,
            clusterMaxZoom: 8,
            clusterRadius: 48
          });
          map.addLayer({
            id: "rpt-clusters",
            type: "circle",
            source: "reports",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": REPORTS_COLOR,
              "circle-radius": ["step", ["get", "point_count"], 10, 10, 14, 50, 18],
              "circle-opacity": 0.85,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#000000"
            }
          });
          map.addLayer({
            id: "rpt-cluster-count",
            type: "symbol",
            source: "reports",
            filter: ["has", "point_count"],
            layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 11 },
            paint: { "text-color": "#000000" }
          });
          map.addLayer({
            id: "rpt-point",
            type: "circle",
            source: "reports",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": REPORTS_COLOR,
              "circle-radius": 5,
              "circle-opacity": 0.9,
              "circle-stroke-width": 0.8,
              "circle-stroke-color": "#000000"
            }
          });
          map.on("mouseenter", "rpt-point", function () { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", "rpt-point", function () { map.getCanvas().style.cursor = ""; });
          map.on("click", "rpt-clusters", function (e) {
            const f = (e.features || [])[0];
            if (!f) return;
            map.getSource("reports").getClusterExpansionZoom(f.properties.cluster_id).then(function (z) {
              map.easeTo({ center: f.geometry.coordinates, zoom: z });
            });
          });
        }
        reportsPtsLoaded = true;
        ["rpt-clusters", "rpt-cluster-count", "rpt-point"].forEach(function (id) {
          if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", reportsMaster && reportsMaster.checked ? "visible" : "none");
        });
      })
      .catch(function (err) {
        log("Reports layer: " + err.message);
        if (reportsMaster) reportsMaster.checked = false;
      })
      .then(function () {
        reportsLoadPromise = null;
      });
    return reportsLoadPromise;
  }

  if (reportsMaster) {
    reportsMaster.addEventListener("change", function (e) {
      const row = e.target && e.target.closest ? e.target.closest(".row") : null;
      if (reportsMaster.checked) {
        const more = document.getElementById("more-group");
        if (more) more.open = true;
        if (!reportsPtsLoaded) {
          void withLayerBusy("Loading reports…", row, function () { return loadReportsPts(); });
        } else {
          loadReportsPts();
        }
        ensureReports();
      } else if (reportsPtsLoaded) {
        ["rpt-clusters", "rpt-cluster-count", "rpt-point"].forEach(function (id) {
          if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
        });
      }
      updateLegend();
    });
  }


  function identifyListHtml(title, items, render) {
    let html = '<div class="popup-links"><h4>' + escapeHtml(title) + "</h4>";
    if (!items.length) {
      html += '<p class="popup-more">None nearby.</p></div>';
      return html;
    }
    items.forEach(function (it, i) {
      html +=
        '<button type="button" class="find-hit ident-hit" data-kind="' +
        escapeHtml(it.kind || "") +
        '" data-i="' +
        i +
        '"><strong>' +
        escapeHtml(String(render(it).label)) +
        "</strong><span>" +
        escapeHtml(String(render(it).sub)) +
        "</span></button>";
    });
    html += "</div>";
    return html;
  }

  function showApiIdentify(lngLat) {
    const seq = ++identifySeq;
    popup.setLngLat(lngLat).setHTML(
      popupWrap("Identify", "Checking the live register…", [
        ["Longitude", fmtCoord(lngLat.lng)],
        ["Latitude", fmtCoord(lngLat.lat)]
      ])
    ).addTo(map);
    return fetchApi("/v1/identify", { lng: lngLat.lng, lat: lngLat.lat }, 12000).then(function (data) {
      if (seq !== identifySeq || !popup.isOpen()) return;
      const titles = (data.titles || []).map(function (t) { return { props: normalizeTitleProps(t) }; });
      const occs = (data.occurrences || []).map(function (o) { return occItemFromProps(o, lngLat.lng, lngLat.lat); });
      const holes = data.holes || [];
      const reports = data.reports || [];
      if (titles.length) {
        renderOpenGroundPopup(lngLat, titles, { source: "Live national register" });
      } else {
        renderOpenGroundPopup(lngLat, [], {
          source: "Live national register",
          stateLabel: ""
        });
      }
      const root = popup.getElement();
      if (!root) return;
      const extra = document.createElement("div");
      extra.id = "popup-ident-extra";
      let more = "";
      more += identifyListHtml("Nearest occurrences", occs.slice(0, 8), function (it) {
        const p = it.props || {};
        const km = p.distance_m != null ? (Number(p.distance_m) / 1000).toFixed(1) + " km" : "";
        const lic = commercialUseBlocked(p) ? "not for commercial use" : "";
        return {
          label: it.name || "Occurrence",
          sub: [String(it.state || "").toUpperCase(), it.comm || "", km, lic].filter(Boolean).join(" · ")
        };
      });
      more += identifyListHtml("Nearest holes", holes.slice(0, 8).map(function (h) {
        return { kind: "hole", props: h, name: h.hole_id || h.native_id || "Hole" };
      }), function (it) {
        const p = it.props || {};
        const km = p.distance_m != null ? (Number(p.distance_m) / 1000).toFixed(1) + " km" : "";
        const lic = commercialUseBlocked(p) ? "not for commercial use" : "";
        return {
          label: it.name,
          sub: [String(p.jurisdiction || "").toUpperCase(), p.year || "", p.hole_type || "", km, lic].filter(Boolean).join(" · ")
        };
      });
      if (reports.length) {
        more += '<div class="popup-links"><h4>Reports</h4>';
        reports.slice(0, 6).forEach(function (r) {
          const label = r.title || r.name || r.id || "Report";
          const href = safeHttpUrl(r.url || r.href || "");
          if (href) {
            more += '<a class="popup-link" href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + escapeHtml(String(label)) + "</a>";
          } else {
            more += '<div class="popup-id">' + escapeHtml(String(label)) + "</div>";
          }
        });
        more += "</div>";
      }
      extra.innerHTML = more;
      const content = root.querySelector(".maplibregl-popup-content");
      if (content) content.appendChild(extra);
      extra.querySelectorAll(".ident-hit").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const kind = btn.getAttribute("data-kind");
          const i = Number(btn.getAttribute("data-i"));
          if (kind === "occ" && occs[i]) showOccIdentify(lngLat, occs[i].props || {});
          else if (kind === "hole") return;
          else if (titles[i]) showTitleIdentify(lngLat, titles[i].props || {});
        });
      });
    }).catch(function (err) {
      if (seq !== identifySeq) return;
      log("Identify API failed — using loaded layers. " + ((err && err.message) || ""));
      const tLayers = titleFillIds();
      if (tLayers.length) {
        const titles = map.queryRenderedFeatures(map.project([lngLat.lng, lngLat.lat]), { layers: tLayers });
        if (titles.length) {
          showTitleIdentify(lngLat, titles[0].properties || {});
          return;
        }
      }
      return showOpenGroundFromIndex(lngLat);
    });
  }

  map.on("click", function (e) {
    if (skipNextClick) { skipNextClick = false; return; }
    if (boxDrawing) return;
    if (document.body.classList.contains("rail-open") && window.matchMedia && window.matchMedia("(max-width: 720px)").matches) {
      setRailOpen(false);
      return;
    }
    if (openGroundMode) {
      showOpenGroundIdentify(e.lngLat);
      return;
    }
    if (map.getLayer("rpt-point") && reportsMaster && reportsMaster.checked) {
      const rpts = map.queryRenderedFeatures(e.point, { layers: ["rpt-point"] });
      if (rpts.length) {
        showReportIdentify(e.lngLat, rpts[0].properties || {});
        return;
      }
    }
    if (!apiStatus.live && occMaster && occMaster.checked && map.getLayer("occ-clusters")) {
      const cls = map.queryRenderedFeatures(e.point, { layers: ["occ-clusters"] });
      if (cls.length) {
        const f = cls[0];
        showOccCluster(e.lngLat, f.properties.cluster_id, f.geometry.coordinates);
        return;
      }
    }
    if (occMaster && occMaster.checked && map.getLayer("occ-dots")) {
      const dots = map.queryRenderedFeatures(e.point, { layers: ["occ-dots"] });
      if (dots.length) {
        showOccIdentify(e.lngLat, dots[0].properties || {});
        return;
      }
    }
    if (!apiStatus.live && occMaster && occMaster.checked) {
      const occLayers = [];
      if (map.getLayer("occ-point")) occLayers.push("occ-point");
      if (map.getLayer("occ-sec-point")) occLayers.push("occ-sec-point");
      if (occLayers.length) {
        const occs = map.queryRenderedFeatures(e.point, { layers: occLayers });
        if (occs.length) {
          showOccIdentify(e.lngLat, occs[0].properties || {});
          return;
        }
      }
    }
    if (map.getLayer("holes-hex") && holesMaster.checked) {
      const hx = map.queryRenderedFeatures(e.point, { layers: ["holes-hex"] });
      if (hx.length) {
        showHexIdentify(e.lngLat, hx[0].properties || {}, "Holes");
        return;
      }
    }
    if (map.getLayer("gchem-hex") && gchemMaster.checked) {
      const gx = map.queryRenderedFeatures(e.point, { layers: ["gchem-hex"] });
      if (gx.length) {
        showHexIdentify(e.lngLat, gx[0].properties || {}, "Samples");
        return;
      }
    }
    if (map.getLayer("geo-fill") && kindsMaster.checked) {
      const geos = map.queryRenderedFeatures(e.point, { layers: ["geo-fill"] });
      if (geos.length) {
        popup.setLngLat(e.lngLat).setHTML(geoPopupHtml(geos[0].properties || {})).addTo(map);
        return;
      }
    }
    if (gaToggle.checked) {
      identifyGa(e.lngLat);
      return;
    }
    if (apiStatus.live) {
      showApiIdentify(e.lngLat);
      return;
    }
    const tLayers = titleFillIds();
    if (tLayers.length) {
      const titles = map.queryRenderedFeatures(e.point, { layers: tLayers });
      if (titles.length) {
        showTitleIdentify(e.lngLat, titles[0].properties || {});
        return;
      }
    }
    showOpenGroundIdentify(e.lngLat);
  });

  map.on("load", function () {
    addAustraliaBase();
    buildKindToggles();
    buildMineralToggles();
    if (osmToggle && osmToggle.checked) ensureOsm(true);
    fetch("data/overlay_manifest.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (o) {
        overlayManifest = o || {};
        buildStateMini(occBox, "occ", overlayCounts("occ"));
        buildStateMini(holesBox, "holes", overlayCounts("holes"));
        buildStateMini(gchemBox, "gchem", overlayCounts("gchem"));
        if (occMaster && occMaster.checked) {
          occBox.classList.remove("disabled");
          void withLayerBusy("Loading occurrences…", null, function () { return loadOccurrences(); });
        }
        updateLegend();
      })
      .catch(function () {
        buildStateMini(occBox, "occ", {});
        buildStateMini(holesBox, "holes", {});
        buildStateMini(gchemBox, "gchem", {});
        if (occMaster && occMaster.checked) {
          void withLayerBusy("Loading occurrences…", null, function () { return loadOccurrences(); });
        }
        updateLegend();
      });
    fetch("data/manifest.json")
      .then(function (r) {
        if (!r.ok) throw new Error("manifest.json HTTP " + r.status);
        return r.json();
      })
      .then(function (m) {
        manifest = m;
        (m.layers || []).forEach(function (L) {
          layerMeta[L.state.toLowerCase() + "_" + L.life] = {
            features: L.features,
            bytes: L.bytes
          };
        });
        return apiHealthPromise.then(function (liveApi) {
          if (liveApi) {
            STATES.forEach(function (s) {
              if (!layerMeta[s.id + "_live"]) layerMeta[s.id + "_live"] = { features: 1, bytes: 0 };
            });
          }
          buildToggles();
          function finishReady(msg) {
            log(msg);
            initGroundUi();
            initBoxTool();
            initOpenGround();
            applyGroundFromForm(false);
            if (findQuery && findInput) runFind(findInput.value);
            updateLegend();
            updateDemoBanner();
          }
          if (liveApi) {
            ensureApiTitleLayers();
            map.on("moveend", scheduleLiveTitles);
            const n = (apiStatus.health && apiStatus.health.titles) || 0;
            const z = map.getZoom();
            if (z < LIVE_TITLES_MIN_ZOOM) {
              finishReady("Ready · live register · " + Number(n).toLocaleString() +
                " titles. Zoom in (z≥" + LIVE_TITLES_MIN_ZOOM + ") to fill the viewport.");
              return refreshLiveTitles();
            }
            finishReady("Ready · live register · " + Number(n).toLocaleString() + " titles");
            return refreshLiveTitles();
          }
          const jobs = STATES.map(function (s) {
            const meta = layerMeta[s.id + "_live"];
            if (!meta || !meta.features) return Promise.resolve();
            return addStateLayers(s.id, "live", s.color).then(function () {
              setVisible(s.id, "live", true);
            });
          });
          log("Register offline — loading frozen title packs…");
          return Promise.all(jobs).then(function () {
            const live = STATES.reduce(function (a, s) {
              return a + ((layerMeta[s.id + "_live"] || {}).features || 0);
            }, 0);
            finishReady("Ready · " + live.toLocaleString() + " live titles (static fallback — register offline)");
          });
        });
      })
      .catch(function (err) {
        log(
          "Could not load data: " +
            err.message +
            "\n\nChrome blocks fetch() from file://.\nFrom this folder run:\n  python3 -m http.server 8765\nThen open http://127.0.0.1:8765/ (local only)."
        );
      });
  });
})();
