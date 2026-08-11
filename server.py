#!/usr/bin/env python3
"""Static file server with SPA fallback: all routes return index.html."""
import http.server
import os
import sys

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Map root path
        path = self.path.split('?')[0].split('#')[0]
        # If requesting a file that exists, serve it normally
        if path != '/' and os.path.exists(self.translate_path(path)):
            return super().do_GET()
        # Otherwise fallback to index.html (SPA routing)
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        pass  # suppress logs

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    http.server.HTTPServer(('0.0.0.0', port), SPAHandler).serve_forever()
