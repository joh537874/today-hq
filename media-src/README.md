# media-src · 영상 작업 원본

`prototype/public/scene/`·`opening/`에 들어가는 영상의 원본 클립, 음성, 효과음, 빌드 스크립트를 보관한다.
원본 파일은 용량이 커서(약 470MB) git에서 제외하고, 스크립트(`*.sh`, `*.py`)와 이 문서만 커밋한다.
원본은 구글 드라이브에도 같은 구조로 백업한다.

2026-11-28 세션 임시 폴더(`/private/tmp/claude-501/…/scratchpad`)에서 옮겨 왔다.

## 폴더

| 폴더 | 내용 | 결과물 |
| --- | --- | --- |
| `julian-subway/original/` | 첫 제작(11-26~27). Seedance 클립(`raw`, `v3`), 나인 목소리 변환(`sts`), 효과음(`sfx`), 자막 이미지 버전 빌드(`final/build.sh`) | 자막을 구운 이전 버전 |
| `julian-subway/name-edit/` | 주인공 이름 제거 작업(11-28). `build.sh` 하나로 현재 영상을 다시 만든다 | `public/scene/julian-subway.mp4` 현재 버전 |
| `jae-protest/session-1125/` | 재이 시위 영상 1 제작. 음성 생성(`gen*.py`), 자막(`subs*.py`), 효과음(`sfx.py`) | |
| `jae-protest/session-1126/` | 재이 시위 영상 1·2 합치기, 전환 다듬기 | `public/scene/jae-protest.mp4` |
| `opening/` | 오프닝 작업 파일(`op`), 효과음(`sfx`) | |
| `misc/rah/` | 다른 세션 작업 폴더. 내용 미확인 | |

## 다시 만들기

- 줄리안 영상: `sh media-src/julian-subway/name-edit/build.sh` 실행 후 결과를 `prototype/public/scene/`에 복사한다.
- 음성 생성 스크립트는 환경 변수 `ELEVENLABS_API_KEY`를 읽는다. 키를 파일에 적지 않는다.

## 한계

- 재이 영상의 최종 빌드 명령은 스크립트로 남아 있지 않다. 당시 세션에서 명령을 직접 실행했기 때문이다.
- 오프닝 영상(`opening/prologue.mp4`)의 원본은 `~/Downloads/HQ_1막_키프레임/`에 있으며 이 폴더로 옮기지 않았다.
