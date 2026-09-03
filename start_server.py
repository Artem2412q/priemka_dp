from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, webbrowser, threading
ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)
url='http://127.0.0.1:8765/'
threading.Timer(0.8, lambda: webbrowser.open(url)).start()
print(f'Дистанционная приёмка V3: {url}')
ThreadingHTTPServer(('127.0.0.1',8765), SimpleHTTPRequestHandler).serve_forever()
