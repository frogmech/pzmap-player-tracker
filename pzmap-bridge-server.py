import time
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

DATA_FILE = os.path.expanduser("~/Zomboid/Lua/PZ_Map/data.txt")

cached_json = '{"player": null}'

class PZTrackerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")

        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        self.wfile.write(cached_json.encode('utf-8'))

    def log_message(self, format, *args):
        pass

def monitor_file():
    global cached_json
    last_mtime = 0

    print(f"Watching {DATA_FILE} for updates...")

    while True:
        if os.path.exists(DATA_FILE):
            mtime = os.path.getmtime(DATA_FILE)

            if mtime > last_mtime:
                last_mtime = mtime

                try:
                    with open(DATA_FILE, 'r') as f:
                        content = f.read()

                    if "window.PZ_DATA =" in content:
                        json_str = content.split("window.PZ_DATA =")[1].strip().rstrip(";")

                        try:
                            json.loads(json_str)
                            cached_json = json_str

                        except json.JSONDecodeError:
                            pass

                except Exception:
                    pass

        time.sleep(0.2)

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 9526), PZTrackerHandler)

    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    print("HTTP polling server running on http://127.0.0.1:9526")

    try:
        monitor_file()
    except KeyboardInterrupt:
        print("\nShutting down PZ Tracker...")
