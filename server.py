#!/usr/bin/env python3
"""
MarketMesh dev server.

Serves the static site and adds the two endpoints the front-end talks to:

    GET  /api/health     -> {"ok": true, "xai": bool, "model": "..."}
    POST /api/recommend  -> {"picks": [...], "bundle": {...}, "model": "..."}

/api/recommend forwards an anonymous shopping profile plus the catalogue to
xAI's chat-completions API and returns strict JSON. If XAI_API_KEY is missing or
the call fails, it answers 503 and the browser falls back to the offline
recommender in assets/js/recommend.js — the feature degrades, it never breaks.

Run:
    python3 server.py                # http://localhost:8000
    PORT=9000 python3 server.py
    XAI_API_KEY=xai-... python3 server.py

The key may also live in a .env file next to this script:
    XAI_API_KEY=xai-...
    XAI_MODEL=grok-4
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
XAI_URL = "https://api.x.ai/v1/chat/completions"
DEFAULT_MODEL = "grok-4"
REQUEST_TIMEOUT = 25


# --------------------------------------------------------------------- config
def load_env() -> None:
    """Read a .env file next to this script without clobbering real env vars."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def api_key() -> str:
    return os.environ.get("XAI_API_KEY", "").strip()


def model_name() -> str:
    return os.environ.get("XAI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL


# ---------------------------------------------------------------------- prompt
SYSTEM_PROMPT = """\
You are the shopping assistant for MarketMesh, a site that streams live camera
views of stalls in Korean traditional markets (전통시장) so shoppers can see the
counter before they buy.

Your job: from the CATALOG you are given, choose the items this shopper should
add next, and explain each choice in one short, concrete sentence.

Hard rules:
- Only ever return `uid` values that appear verbatim in the CATALOG. Never invent
  products, prices, stalls or ids.
- Never recommend something already in the shopper's cart.
- Return between 3 and `limit` picks, each from as varied a set of stalls as the
  catalogue allows (at most 2 picks per stall).
- Reasons must be grounded in something real: Korean cooking pairings (삼겹살+상추,
  감자+양파, 사과+배 for 차례상), the season and month, a stall whose counter photo
  was just refreshed (`photoAgeMin` small), a stall with a live camera (`live`),
  or the same market the shopper is already browsing.
- Write reason_ko in natural Korean (존댓말, one sentence, no marketing fluff) and
  reason_en as its plain-English equivalent.
- `bundle` groups 2-4 of your picks that genuinely make one dish, one gift box or
  one meal, with a short title in both languages.

Answer with JSON only, in exactly this shape:
{
  "picks": [
    {"uid": "<catalog uid>", "reason_ko": "...", "reason_en": "...",
     "pair_uid": "<catalog uid or null>", "score": 0.0}
  ],
  "bundle": {"title_ko": "...", "title_en": "...", "uids": ["<uid>", "<uid>"]}
}
"""


def build_user_message(payload: dict) -> str:
    profile = payload.get("profile", {}) or {}
    cart = profile.get("cart", []) or []
    context = payload.get("context", "home")
    limit = int(payload.get("limit", 6) or 6)

    lines = [
        f"CONTEXT: {context}",
        f"LIMIT: {limit}",
        f"UI LANGUAGE: {payload.get('lang', 'ko')}",
        f"LOCAL TIME: month={profile.get('month')} hour={profile.get('hour')} weekday={profile.get('weekday')}",
    ]
    if payload.get("market"):
        lines.append(f"BROWSING MARKET: {payload['market'].get('name')} ({payload['market'].get('id')})")
    if payload.get("store"):
        lines.append(f"BROWSING STALL: {payload['store'].get('name')} ({payload['store'].get('id')})")

    if cart:
        lines.append("CART:")
        for item in cart:
            lines.append(
                f"  - {item.get('name')} x{item.get('qty')} "
                f"(uid={item.get('id')}, cat={item.get('cat')}, tags={item.get('tags')})"
            )
    else:
        lines.append("CART: (empty — lean on season, freshness and the market being browsed)")

    if profile.get("searches"):
        lines.append("RECENT SEARCHES: " + ", ".join(map(str, profile["searches"])))
    if profile.get("viewedStores"):
        lines.append("RECENTLY VIEWED STALLS: " + ", ".join(map(str, profile["viewedStores"])))

    lines.append("CATALOG (json):")
    lines.append(json.dumps(payload.get("catalog", []), ensure_ascii=False))
    return "\n".join(lines)


def extract_json(text: str) -> dict:
    """Models sometimes wrap JSON in prose or fences; dig the object out."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start, depth = None, 0
    for i, ch in enumerate(text):
        if ch == "{":
            if start is None:
                start = i
            depth += 1
        elif ch == "}" and start is not None:
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i + 1])
                except json.JSONDecodeError:
                    start = None
    raise ValueError("no JSON object in model response")


def call_xai(payload: dict) -> dict:
    key = api_key()
    if not key:
        raise RuntimeError("XAI_API_KEY is not set")

    body = {
        "model": model_name(),
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_message(payload)},
        ],
        "temperature": 0.6,
        "response_format": {"type": "json_object"},
    }

    def post(data: dict) -> dict:
        request = urllib.request.Request(
            XAI_URL,
            data=json.dumps(data).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))

    try:
        completion = post(body)
    except urllib.error.HTTPError as err:
        # Older/other models may reject response_format — retry once without it.
        if err.code == 400:
            body.pop("response_format", None)
            completion = post(body)
        else:
            detail = err.read().decode("utf-8", "replace")[:400]
            raise RuntimeError(f"xAI HTTP {err.code}: {detail}") from err

    content = completion["choices"][0]["message"]["content"]
    result = extract_json(content)

    # Trust nothing: only uids that exist in the catalogue we sent survive.
    known = {item["uid"] for item in payload.get("catalog", []) if item.get("uid")}
    picks = []
    for row in result.get("picks", []):
        if isinstance(row, dict) and row.get("uid") in known:
            picks.append({
                "uid": row["uid"],
                "reason_ko": str(row.get("reason_ko", ""))[:220],
                "reason_en": str(row.get("reason_en", ""))[:220],
                "pair_uid": row.get("pair_uid") if row.get("pair_uid") in known else None,
                "score": row.get("score"),
            })

    bundle = result.get("bundle") or {}
    bundle_uids = [u for u in (bundle.get("uids") or []) if u in known]

    return {
        "model": completion.get("model", model_name()),
        "picks": picks[: int(payload.get("limit", 6) or 6)],
        "bundle": {
            "title_ko": str(bundle.get("title_ko", ""))[:120],
            "title_en": str(bundle.get("title_en", ""))[:120],
            "uids": bundle_uids,
        } if bundle_uids else None,
        "usage": completion.get("usage"),
    }


# --------------------------------------------------------------------- handler
class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    # ------------------------------------------------------------- utilities
    def send_json(self, status: int, payload: dict) -> None:
        blob = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(blob)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(blob)

    def end_headers(self):
        # Assets change constantly while iterating on the demo.
        if self.path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=300")
        super().end_headers()

    # ------------------------------------------------------------- endpoints
    def do_OPTIONS(self):  # noqa: N802 - stdlib naming
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):  # noqa: N802
        if self.path.split("?")[0] == "/api/health":
            self.send_json(HTTPStatus.OK, {
                "ok": True,
                "xai": bool(api_key()),
                "model": model_name() if api_key() else None,
            })
            return
        if self.path == "/":
            self.path = "/index.html"
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            pass  # the browser walked away mid-video, which is normal

    def do_POST(self):  # noqa: N802
        if self.path.split("?")[0] != "/api/recommend":
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "unknown endpoint"})
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except (ValueError, json.JSONDecodeError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid JSON body"})
            return

        if not api_key():
            self.send_json(HTTPStatus.SERVICE_UNAVAILABLE,
                           {"error": "XAI_API_KEY not configured", "source": "unavailable"})
            return

        try:
            result = call_xai(payload)
        except Exception as err:  # noqa: BLE001 - the browser just needs to fall back
            sys.stderr.write(f"[xai] {err}\n")
            self.send_json(HTTPStatus.BAD_GATEWAY, {"error": str(err), "source": "unavailable"})
            return

        if not result["picks"]:
            self.send_json(HTTPStatus.BAD_GATEWAY, {"error": "model returned no usable picks"})
            return

        self.send_json(HTTPStatus.OK, result)

    # ------------------------------------------------------------ byte ranges
    def send_head(self):
        """Adds Range support so Safari can play and seek the stall videos."""
        range_header = self.headers.get("Range")
        if not range_header:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            handle = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None

        size = os.fstat(handle.fileno()).st_size
        match = re.match(r"bytes=(\d*)-(\d*)", range_header.strip())
        if not match:
            handle.close()
            return super().send_head()

        start_raw, end_raw = match.groups()
        if start_raw == "":                       # suffix range: last N bytes
            length = int(end_raw or 0)
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(start_raw)
            end = int(end_raw) if end_raw else size - 1
        end = min(end, size - 1)

        if start > end or start >= size:
            handle.close()
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        handle.seek(start)
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()

        # SimpleHTTPRequestHandler copies the whole file object, so hand it a
        # reader that stops at the end of the requested range.
        return RangeReader(handle, end - start + 1)

    def log_message(self, fmt, *args):
        if "/api/" in self.path or self.path.endswith((".html", ".mp4")):
            sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))


class RangeReader:
    """File-like wrapper that yields at most `remaining` bytes."""

    def __init__(self, handle, remaining):
        self.handle = handle
        self.remaining = remaining

    def read(self, amount=-1):
        if self.remaining <= 0:
            return b""
        if amount is None or amount < 0:
            amount = self.remaining
        chunk = self.handle.read(min(amount, self.remaining))
        self.remaining -= len(chunk)
        return chunk

    def close(self):
        self.handle.close()


def main() -> None:
    load_env()
    port = int(os.environ.get("PORT", 8000))
    server = ThreadingHTTPServer(("", port), Handler)
    key_state = "connected" if api_key() else "not set (offline recommender will be used)"
    print(f"MarketMesh  →  http://localhost:{port}")
    print(f"  root      : {ROOT}")
    print(f"  xAI key   : {key_state}")
    if api_key():
        print(f"  xAI model : {model_name()}")
    print("  stop      : Ctrl-C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")
        server.server_close()


if __name__ == "__main__":
    main()
