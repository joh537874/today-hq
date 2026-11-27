# 오늘의 HQ

2069년, 인간다움이 숫자로 매겨지는 도시. 주인공이 친구의 생일 모임에 가는 하루를 따라가는 약 5분 분량의 인터랙티브 스토리 프로토타입입니다.

- 플레이: https://joh537874.github.io/today-hq/
- 5개 장, 8번의 선택과 마지막 결정
- 나레이션은 플레이어를 '당신'으로 부르고, 대사 속 주인공 이름은 '진'으로 고정
- 선택에 따른 네 가지 결말: Insurgent, Adapter, Zealot, Outlier
- React 18 + Vite, 서버와 계정 없이 브라우저에서 실행

## 로컬 실행

Node.js 22 LTS를 사용합니다.

```sh
cd prototype
npm ci
npm run dev
```

기본 주소는 http://localhost:5183 입니다.

```sh
npm run build
npm run preview
```

## 조작

- 자막: 클릭 또는 Space·Enter로 표시 완료 / 다음으로 진행
- 선택지: 클릭 또는 숫자 1·2
- 되돌리기: ← 또는 Backspace
- 소리 끄기·켜기: 우상단 버튼 또는 M

현재 버전은 데스크톱 가로 화면에 맞춘 1920×1080 비율입니다. 화면은 창 크기에 맞춰 축소됩니다.

## 관리자 뷰어

주소 끝에 `#/admin`을 붙이면 왼쪽에 비트 목록이 열립니다. 원하는 비트로 바로 이동하고, 루트(A·B)·엔딩·선택값을 정해 둘 수 있습니다. 코드를 고친 뒤 새로 고침하면 보던 비트로 돌아옵니다. S 키는 결과 화면으로 바로 이동합니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `prototype/src/story.js` | 대사·선택·분기·결말 데이터, 주인공 이름 치환(`applyName`), 자막 페이지 나누기 |
| `prototype/src/App.jsx` | 게임 진행, 자막, 선택지, 영상·나레이션, 결말·My Choices 화면 |
| `prototype/src/Admin.jsx` | 관리자 뷰어 |
| `prototype/src/ui.jsx` | 타이핑 효과 |
| `prototype/src/sound.js` | 배경음·환경음·효과음 재생 |
| `prototype/src/styles.css` | 색상, 타이포그래피, 배치, 모션 |
| `prototype/public/` | 컷 이미지(`cut`), 결말 이미지(`ending`), 영상(`opening`, `scene`), 소리(`sound`), 민석 버전 빌드(`minseok`) |
| `media-src/` | 영상 작업 원본과 빌드 스크립트. 원본은 git 제외, 스크립트만 커밋 (`media-src/README.md`) |
| `.github/workflows/pages.yml` | 빌드와 GitHub Pages 배포 |

## 대본에 주인공 이름 쓰기

`story.js`에서 주인공 이름은 `{name}`으로 적습니다(현재 '진'으로 고정, 이름 입력 화면은 2026-11-28에 없앰). 나레이션의 주어는 '당신'으로 적습니다. 조사가 붙으면 `{name:은}`·`{name:이}`·`{name:을}`·`{name:과}`로 적으면 받침에 맞게 은/는·이/가·을/를·과/와가 붙습니다. 주인공 대사는 `L(ME, …)`로 적습니다. 영상에는 이름을 넣지 않습니다.

## 배포

`main`에 push하면 GitHub Actions가 의존성 설치와 빌드를 수행하고 `prototype/dist`를 GitHub Pages에 배포합니다. Actions 화면에서 수동 실행도 가능합니다. 저장소 Settings → Pages의 Source는 GitHub Actions로 설정합니다.

빌드 자산은 상대 경로를 사용하므로 GitHub Pages의 하위 경로에서도 열립니다. 폰트는 외부 CDN에서 불러옵니다.

## 브랜치

- `main`: 배포용. push하면 자동 배포되므로 직접 커밋하지 않는다
- `dev`: 통합용. 플레이테스트 후 `main`으로 fast-forward
- 작업 브랜치: `dev`에서 만들고 `dev`로 PR. 이름은 `feat/`·`fix/`·`media/`·`docs/` + 내용

