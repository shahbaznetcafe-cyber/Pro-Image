from collections import Counter
from threading import Lock
from time import perf_counter

_lock = Lock()
_started_at = perf_counter()
_request_count = 0
_status_counts: Counter[str] = Counter()
_path_counts: Counter[str] = Counter()
_total_latency_ms = 0.0


def record_request(path: str, status_code: int, latency_ms: float) -> None:
    global _request_count, _total_latency_ms

    with _lock:
        _request_count += 1
        _total_latency_ms += latency_ms
        _status_counts[str(status_code)] += 1
        _path_counts[path] += 1


def snapshot() -> dict[str, object]:
    with _lock:
        average_latency_ms = (
            round(_total_latency_ms / _request_count, 2) if _request_count else 0
        )

        return {
            "uptime_seconds": round(perf_counter() - _started_at, 2),
            "request_count": _request_count,
            "average_latency_ms": average_latency_ms,
            "status_counts": dict(_status_counts),
            "top_paths": dict(_path_counts.most_common(10)),
        }
