# 오늘의 HQ

2069년, 인간다움이 숫자로 매겨지는 도시. 친구의 생일 모임에 가는 하루를 따라가는 약 5분 분량의 인터랙티브 스토리 프로토타입입니다.

- 플레이: https://joh537874.github.io/today-hq/
- 5개 장, 7번의 선택과 마지막 결정
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

- 대사: 클릭 또는 Space로 표시 완료 / 다음으로 진행
- 일반 선택지: 클릭 또는 숫자 1·2
- 입장 스캔, 마지막 선택, 결말 행동: 버튼 길게 누르기
- 지하철: 승객에게 마우스를 올려 HQ 확인

현재 버전은 데스크톱 가로 화면에 맞춘 1920×1080 비율입니다. 화면은 창 크기에 맞춰 축소됩니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `prototype/src/story.js` | 대사, 선택 점수, 분기와 결말 |
| `prototype/src/App.jsx` | 게임 진행, 대화창, 선택지, 결말 화면 |
| `prototype/src/Scene.jsx` | 배경과 장면별 인터랙션 |
| `prototype/src/ui.jsx` | 타이핑 효과, 길게 누르기, 인물 실루엣 |
| `prototype/src/styles.css` | 색상, 타이포그래피, 배치, 모션 |
| `.github/workflows/pages.yml` | 빌드와 GitHub Pages 배포 |

## 배포

`main`에 push하면 GitHub Actions가 의존성 설치와 빌드를 수행하고 `prototype/dist`를 GitHub Pages에 배포합니다. Actions 화면에서 수동 실행도 가능합니다. 저장소 Settings → Pages의 Source는 GitHub Actions로 설정합니다.

빌드 자산은 상대 경로를 사용하므로 GitHub Pages의 하위 경로에서도 열립니다. 폰트는 외부 CDN에서 불러옵니다.

## 현재 상태와 다음 작업

- 하단 대화창, Medium(500) 이하 굵기, 기본 자간 -3% 적용
- 인물과 배경은 도형 기반이며 소리·실제 영상은 미구현
- 길게 누르기를 더 편한 조작으로 바꾸는 개선은 다음 작업
- 모바일 조작과 모든 결말의 변경된 배치는 추가 점검 필요
- 새로 고침하면 진행 내용이 초기화됨

워크숍의 인터뷰 원본과 별도 리서치 자료는 배포에 포함하지 않습니다.
