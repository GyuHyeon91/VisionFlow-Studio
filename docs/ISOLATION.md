# 프로젝트 격리 정책 (Isolation)

이 문서는 VisionFlow Studio가 **다른 프로젝트와 연동되거나 주소가 겹치지 않도록** 설계된 방식을 설명합니다.

## 1. 물리적 격리
- 프로젝트 루트: `C:\Users\mbc\Desktop\학생방\박규현\visionflow-studio`
- 모든 소스/설정/의존성(`node_modules`)이 이 폴더 내부에만 존재합니다.
- npm workspaces는 이 프로젝트 하위의 `apps/*`, `services/express`만 명시적으로 포함합니다.
- 외부 패키지나 다른 프로젝트의 설정 파일을 참조하지 않습니다. 유일한 설정 참조는 `configs/app.config.json`입니다.

## 2. 포트 격리 (주소 중복 방지)

예약 포트는 `configs/app.config.json`의 `ports`에 중앙 정의되어 있습니다.

| 서비스 | 포트 |
|---|---|
| web (React) | 53710 |
| next | 53711 |
| vue | 53712 |
| fastapi | 53720 |
| express | 53721 |

- 모든 개발 서버에 `strictPort: true` (또는 `next dev -p 53711`)를 적용하여, 포트가 이미 사용 중이면 자동으로 다른 포트로 넘어가지 않고 **오류를 발생**시킵니다.
- 일반적으로 다른 프로젝트가 사용하는 3000 / 5173 / 5174 / 8000 포트를 사용하지 않습니다.
- 검사 명령:

```bash
npm run ports:check
```

이 스크립트는 설정 내부 중복 포트와 시스템상 사용 중인 포트를 검사하고, 충돌 시 종료 코드 1을 반환합니다.

## 3. 네트워크 격리
- FastAPI CORS는 `http://localhost:53710`, `53711`, `53712` **자체 프론트엔드 주소만** 허용합니다. (와일드카드 미사용)
- Express는 동일 설정 파일의 `ports.express`를 사용합니다.
- 프론트엔드의 백엔드 호출 주소는 `options.backend` 선택에 따라 `ports.fastapi` / `ports.express`로 분기됩니다.

## 4. 설정 격리
- `configs/app.config.json`의 `isolation.standalone = true`가 독립 모드 플래그입니다.
- `reservedPortOwner = "visionflow-studio"`로 포트 소유자를 명시합니다.
- 다른 프로젝트의 환경 변수(`PORT` 등)를 상속받지 않으며, 모든 기본값이 이 설정에 포함되어 있습니다.

## 5. 포트 변경 방법
충돌이 발생하면 `configs/app.config.json`의 `ports` 값만 변경하세요.
프론트엔드 Vite/Next/Vue 설정과 백엔드 실행 스크립트는 이 값을 기준으로 동작합니다.
(`web-react/vite.config.ts`, `web-vue/vite.config.ts`, `apps/web-next/package.json`, 루트 `package.json` 스크립트)
