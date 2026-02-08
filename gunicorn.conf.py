import multiprocessing
import os

bind = "127.0.0.1:8000"
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 // 2 or 2))
threads = int(os.getenv("GUNICORN_THREADS", 4))
timeout = int(os.getenv("GUNICORN_TIMEOUT", 180))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", 30))
accesslog = "-"
errorlog = "-"
