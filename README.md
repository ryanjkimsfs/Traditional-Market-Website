# MarketMesh — 전통시장 실시간 장보기 / live traditional-market shopping

A complete, working prototype of the site sketched in *Traditional Market + KSEF*: shoppers
pick a market, look at the actual counter (live stall camera or a photo with its capture time
stamped underneath), add the items an object detector found on the table, call the stall, and
get an AI suggestion for what to buy next.

No build step, no framework, no CDN. Plain HTML/CSS/JS plus one small Python file that serves
the site and proxies the xAI (Grok) recommendation calls.

---

## Run it

```bash
cd "real website"
python3 server.py            # → http://localhost:8000
PORT=9000 python3 server.py  # any other port
```

Opening `index.html` directly from Finder also works — you just lose the live-video byte-range
seeking and the xAI recommendations (the offline recommender takes over automatically).

### Turning on the xAI (Grok) recommendations

```bash
cp .env.example .env         # then put your key in it
# or:
XAI_API_KEY=xai-... python3 server.py
```

The badge on the "AI 장보기 추천" panel tells you which engine answered:

| Badge | Meaning |
| --- | --- |
| ✨ **xAI Grok 실시간 추천** | The key is set and Grok answered; reasons are written per shopper |
| ⚙︎ **오프라인 추천 엔진** | No key, no server, or the call failed — the built-in engine answered |

`server.py` never trusts the model blindly: every returned `uid` is checked against the catalogue
that was sent, unknown ids are dropped, and if fewer than two picks survive the browser falls back
to the offline engine. Prices, names and stalls always come from the local catalogue, never from
the model.

---

## What is where

```
real website/
├── index.html       홈 — hero live view, region finder, live stalls, fresh photos, AI picks
├── market.html      시장 — stall grid + counter preview panel with its own zoom controls
├── store.html       점포 — full stall view: big zoomable camera, AI item list, contact
├── map.html         지도 — coordinate map of every market + per-market stall layout
├── search.html      검색 — products / stalls / markets in one result page
├── cart.html        장바구니 — basket grouped by stall, Onnuri discount, order preview
├── server.py        static server (with HTTP Range) + /api/health + /api/recommend
├── .env.example     XAI_API_KEY / XAI_MODEL template
└── assets/
    ├── css/main.css   the entire design system
    ├── vendor/leaflet/ Leaflet 1.9.4, vendored — no CDN at runtime
    ├── js/data.js     catalogue: regions → markets → stalls → products (+ detection boxes)
    ├── js/core.js     language, formatting, storage, cart, search, geo, header/footer/drawer
    ├── js/viewer.js   the stall viewer: zoom / pan / PTZ presets / detection overlay
    ├── js/recommend.js xAI client + offline recommender + the picks UI
    ├── js/{home,market,store,map,search,cart}.js   one file per page
    ├── img/stalls/    counter photos (+ /thumb for cards)
    ├── img/products/  product cut-outs
    └── video/         stall camera footage
```

---

## How the spec maps to the build

**Page 1 — general info + search**
- Market search *and* product search in one box (`core.js` → `MM.search`), with a live dropdown
  of products / stalls / markets and recent + suggested queries.
- Korean **초성 search**: typing `ㅅㄱ` finds 사과, 신고 배, 시금치, 수미 감자.
- Country → 시·도 → 시·군·구 → 시장 cascade, exactly the four-step filter in the reference.

**Page 2 — store information + detected produce + price**
- Stall cards carry a live/photo/none badge, trade chip, rating, and the capture stamp.
- **사진 업데이트 시각은 항상 사진 바로 아래에 표시됩니다** — colour-coded by age
  (green ≤ 1 h, amber ≤ 24 h, red older, grey when no photo is registered). It is stored as an
  *age*, not a fixed date, so the demo is never stale.
- Stalls with no camera and no photo are shown honestly as `미등록`, with a call button instead.

**Page 3 — stall-by-stall view**
- Big viewer with **zoom in / zoom out / reset** buttons (must-have), plus drag-pan, wheel zoom,
  pinch zoom, double-click zoom, fullscreen, snapshot, and PTZ presets (WIDE / L / C / R).
- The AI detection overlay draws a box per recognised item; hovering a box highlights its row in
  the product list and hovering a row highlights the box. Clicking a box jumps to the item.
- Prices from a paper tag are flagged **AI 추정가** with a "confirm with the stall" note, since the
  spec calls price detection optional and error-prone.
- Contact block: 전화 걸기 (`tel:`), 문자 (`sms:`), 길찾기 (Kakao Map), share, save.

**Page 4 — interactive map**
- 지역 지도: a real slippy map (Leaflet, vendored in `assets/vendor/leaflet/`) with four base
  layers — OSM 일반 / CARTO 밝게 / CARTO 어둡게 / Esri 위성 — and every market pinned at its
  **verified WGS84 coordinate** (see below). Drag, scroll, buttons, scale bar, popups.
- **가까운 곳부터**: "내 위치로 정렬" uses geolocation, draws 1/3/5 km rings around you and
  re-sorts the market list by real distance. Denial is handled with a message, not a dead end.
- Every market carries its coordinate, its coordinate's source, a copy button, and deep links to
  **네이버 지도 / 카카오맵 길찾기 / Google Maps** built from the exact lat-lng — so "길찾기" lands
  on the market, not on a name search that could hit a same-named market in another city.
- Search box filters both the pins and the list; a query with no match says so instead of
  showing an empty map.
- If Leaflet or the tile servers cannot be reached, the page falls back to a self-contained
  canvas coordinate map (graticule, scale bar, same pins) rather than a grey box.
- 시장 배치도: an SVG stall layout per market — colour by trade, camera icon for live stalls, a
  freshness dot per stall, click to preview. This one is schematic, not surveyed: stalls have no
  published coordinates, so the layout is illustrative while the market pin is precise.

### Where the coordinates come from

Every market's address and lat/lng was verified against independent sources — OpenStreetMap
ways/nodes, Wikidata `P625`, 한국관광공사 TourAPI, 도로명주소 DB, 구청 open data, and each market's own
listing — with a second source used to cross-check, and each record's provenance stored in
`coordSource` and shown in the UI.

Seven of the eight also carry their **real outline**, traced in OpenStreetMap and frozen into
`MM.data.footprints` (`assets/js/data.js`). This matters: a market like 남대문 runs ~380 m across,
so a single pin is a representative point, not a location. From zoom 14 the map draws the actual
market area, and selecting a market frames its whole footprint instead of guessing a zoom.
부평깡시장 is an open alley rather than an enclosure and has no polygon in OSM, so it stays
pin-only rather than getting a made-up boundary.

Two corrections worth knowing about:

- **인천 서구 → 서해구.** On 2026-07-01 Incheon's 서구 was renamed 서해구 and 검단구 was split off,
  so 가좌시장's district label changed (the market did not move).
- Several of the first-draft coordinates were off by 0.5–1.6 km; they now sit on the markets
  themselves. Where a founding year could not be verified it is `null` and the UI omits it rather
  than printing a guess.

Market-level phone numbers, addresses, hours, 휴무일 and 점포 수 are the publicly published values
(상인회 / 구청 / 소상공인시장진흥공단 listings). **Stall-level phone numbers, owners, ratings,
reviews, and the parking notes are invented sample data** — swap them before this goes anywhere
public. Camera counts are part of the product's premise, not a survey.

Map tiles are fetched at runtime from OpenStreetMap, CARTO and Esri, each attributed in the map's
own attribution bar; Leaflet itself is vendored, so the only network dependency is the tiles. If
you have a VWorld or Naver key and want Korean-cartography tiles instead, add a layer to `BASES`
in `assets/js/map.js` — the rest of the page does not care which base layer is active.

**Extra**
- xAI picks on every page, tuned to context (home / market / stall / search / basket).
- Cart grouped by stall with the 5% Onnuri voucher discount and delivery-vs-pickup.
- Korean/English toggle across the whole site, dark mode, keyboard `/` to focus search.

---

## The recommendation engine

`assets/js/recommend.js` builds an anonymous profile — basket, recently viewed stalls and items,
recent searches, hour/月/weekday — and a trimmed catalogue, then POSTs to `/api/recommend`.
`server.py` wraps it in a prompt that spells out the domain rules (삼겹살+상추, 사과+배 for 차례상,
season, freshness, same market) and requires strict JSON back.

The offline engine in the same file is not a stub: it scores every candidate with a co-purchase
graph (`MM.data.affinity`), the current month's seasonal tags, stall freshness, live-camera
availability, rating and market proximity, caps picks at two per stall, and writes its reason from
the matched pairing. That is what answers when there is no key.

---

## Adding to the catalogue

Everything lives in `assets/js/data.js`:

```js
{ id: 'gajwa-new', marketId: 'gajwa', ko: '새 점포', en: 'New Stall',
  stall: 'E-01', cat: 'veg', phone: '032-000-0000',
  photo: 'vegetable-stall',     // assets/img/stalls/<name>.jpg (+ thumb/<name>.jpg)
  photoAgeMin: 30,              // minutes before "now" — keeps the stamp truthful
  camera: { id:'CAM-…', src:'cam-ganghwa.mp4', ptz:true, res:'4K', fps:24 },  // or null
  products: [ p({ id:'…', ko:'…', en:'…', price: 3000, cat:'veg',
                  conf: 0.95, box:[0.35,0.50,0.24,0.24] }) ] }
```

`box` is `[x, y, w, h]` in 0–1 coordinates over that stall photo — that is what the detection
overlay draws. `conf: 0` means "not detected" and draws no box.

---

## Notes

- Photos and camera footage are the project's own shots from 가좌시장 / 강화풍물시장 and the
  product cut-outs from the earlier prototypes, re-encoded for the web.
- Stall names, owners, phone numbers, ratings and reviews are plausible sample data for the
  prototype — they are not real businesses, and the order button only prints a demo receipt.
- Tested in Chrome and Safari; needs a modern browser (CSS `color-mix`, `aspect-ratio`, `fetch`).
