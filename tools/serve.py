"""Dev server: static files with caching off, plus local stand-ins for the two Vercel functions.

/api/jobs calls MyCareersFuture directly (same mapping as api/jobs.js, trimmed).
/api/sync keeps encrypted copies in memory, so nothing leaves this machine during development.
"""
import functools, http.server, json, re, sys, urllib.parse, urllib.request
from datetime import datetime, timezone

SYNC = {}

def strip(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()

def mcf(asked, limit):
    words = re.sub(r"[^\w\s-]", " ", asked.replace("&", " and ")).lower().split()
    tries = [asked] + [" ".join(words[:n]) for n in range(len(words), 1, -1) if words[n - 1] not in ("and", "of", "the", "for")]
    seen, q, total = {}, asked, 0
    for q in dict.fromkeys(tries):
        url = f"https://api.mycareersfuture.gov.sg/v2/jobs?search={urllib.parse.quote(q)}&limit={limit}&page=0"
        page = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"Accept": "application/json"}), timeout=10))
        total = max(total, page.get("total", 0))
        for j in page.get("results", []): seen.setdefault(j["uuid"], j)
        if len(seen) >= min(limit, 6): break
    d = {"results": list(seen.values())[:limit], "total": total}
    jobs = [{
        "id": "mcf-" + j["uuid"], "title": j["title"],
        "employer": (j.get("postedCompany") or {}).get("name") or "Employer not named",
        "location": "Singapore", "mode": ", ".join(e["employmentType"] for e in j.get("employmentTypes") or []),
        "levels": [p["position"] for p in j.get("positionLevels") or []], "minYears": j.get("minimumYearsExperience"),
        "salary": {"min": j["salary"].get("minimum"), "max": j["salary"].get("maximum"), "type": ((j["salary"].get("type") or {}).get("salaryType") or "Monthly")} if j.get("salary") else None,
        "skills": [s["skill"] for s in j.get("skills") or []][:30], "summary": strip(j.get("description"))[:700],
        "posted": (j.get("metadata") or {}).get("newPostingDate"), "expires": (j.get("metadata") or {}).get("expiryDate"),
        "url": (j.get("metadata") or {}).get("jobDetailsUrl"), "source": "MyCareersFuture",
    } for j in d.get("results", [])]
    return {"q": q, "asked": asked, "total": d.get("total", len(jobs)), "fetchedAt": datetime.now(timezone.utc).isoformat(), "jobs": jobs}

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def _api(self, method):
        u = urllib.parse.urlparse(self.path); q = dict(urllib.parse.parse_qsl(u.query))
        if u.path == "/api/jobs":
            try: return self._json(200, mcf(q.get("q", "trust and safety")[:80], min(20, int(q.get("limit", 12)))))
            except Exception as e: return self._json(502, {"error": "Could not reach MyCareersFuture right now.", "detail": str(e)})
        if u.path == "/api/sync":
            sid = q.get("id", "")
            if not re.fullmatch(r"[a-f0-9]{64}", sid): return self._json(400, {"error": "Bad sync id"})
            if method == "PUT":
                SYNC[sid] = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode(); return self._json(200, {"ok": True})
            if method == "DELETE": SYNC.pop(sid, None); return self._json(200, {"ok": True})
            return self._json(200, json.loads(SYNC[sid])) if sid in SYNC else self._json(404, {"error": "No copy for this code"})
        return self._json(404, {"error": "Unknown API"})

    def do_GET(self):
        if self.path.startswith("/api/"): return self._api("GET")
        return super().do_GET()
    def do_PUT(self): return self._api("PUT")
    def do_DELETE(self): return self._api("DELETE")

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4180
http.server.ThreadingHTTPServer(("", port), functools.partial(H, directory=sys.argv[2] if len(sys.argv) > 2 else ".")).serve_forever()
