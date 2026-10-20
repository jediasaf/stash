"""Dev server with caching off, so edited ES modules are always re-fetched."""
import http.server, sys, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
port = int(sys.argv[1]) if len(sys.argv) > 1 else 4180
http.server.ThreadingHTTPServer(("", port), functools.partial(H, directory=sys.argv[2] if len(sys.argv) > 2 else ".")).serve_forever()
