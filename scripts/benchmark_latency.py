"""실시간 감지 API 응답 시간 벤치마크 (깊이 OFF/ON 비교)."""
import io
import time

import requests

SAMPLE = requests.get('https://ultralytics.com/images/bus.jpg', timeout=60).content
URL = 'http://127.0.0.1:53720/api/measure-frame'  # localhost는 IPv6 해석 지연 회피


def run(depth: bool, n: int = 5):
    times = []
    for _ in range(n):
        t0 = time.perf_counter()
        res = requests.post(
            URL,
            files={'file': ('bus.jpg', io.BytesIO(SAMPLE), 'image/jpeg')},
            data={'threshold': '0.75', 'depth': str(depth).lower()},
            timeout=300,
        )
        times.append((time.perf_counter() - t0) * 1000)
        if res.status_code != 200:
            return res.status_code, res.text[:200]
    return None, times


for depth in (False, True):
    status, result = run(depth)
    if status:
        print(f'depth={depth}: ERROR {status} {result}')
    else:
        result_sorted = sorted(result)
        print(f'depth={depth}: avg={sum(result)/len(result):.0f}ms  min={result_sorted[0]:.0f}ms  median={result_sorted[len(result)//2]:.0f}ms  max={result_sorted[-1]:.0f}ms')
