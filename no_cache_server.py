from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    handler = partial(NoCacheHandler, directory='/home/masgi_bot/Apps/survivor')
    server = ThreadingHTTPServer(('0.0.0.0', 3002), handler)
    print('Serving no-cache on http://0.0.0.0:3002')
    server.serve_forever()
