"""사물 측정 API smoke test (버스 샘플 이미지)."""
import io

import requests

sample = requests.get('https://ultralytics.com/images/bus.jpg', timeout=60)
res = requests.post(
    'http://localhost:53720/api/measure-frame',
    files={'file': ('bus.jpg', io.BytesIO(sample.content), 'image/jpeg')},
    data={'threshold': '0.4'},
    timeout=300,
)
print('status:', res.status_code)
print(res.text[:2000])
