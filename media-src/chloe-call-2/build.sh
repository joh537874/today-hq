#!/bin/sh
# 클로이 두 번째 통화 영상(src.mp4 + 클로이2 음성). "By the way, I just saw the news. HQ is causing quite a stir. How's the AI at your place? Its name was Nine, right?"
# 공정은 ../chloe-call-3/build.sh 와 같다(도구는 ../call-tools).
# 예전에는 영상 전체를 0.46초 늦춰 맞췄으나 구절마다 어긋나 있어, 영상은 그대로 두고 음성 구절 사이 쉼을 옮겨 맞춘다.
# 영상에는 음성에 없는 말 한 덩어리(원본 3.12~3.71초)가 더 있어, 앞뒤 입이 닫힌 지점(3.04~3.83초)을 잘라낸다(cut.py).
set -e
cd "$(dirname "$0")"
PY=../.venv/bin/python
T=../call-tools
rm -rf raw frames framesc masks rgba && mkdir -p raw masks
ffmpeg -v error -y -i src.mp4 raw/f%04d.png
# 원본은 머리 꼭대기가 화면 위 끝에 닿아 있어, 공통 기준(얼굴 335·눈 258)으로 자르면 위가 모자란다.
# 얼굴을 조금 크게(350), 눈을 조금 높게(245) 잡아 원본 안에서 자른다.
$PY $T/frame.py raw frames 627 212 302 350 245
$PY $T/cut.py frames framesc 3.04-3.83
swift $T/mouth.swift framesc > mouth.txt
$PY $T/sync.py voice.mp3 stt.json mouth.txt voice-synced.wav
swift $T/seg.swift framesc masks
$PY $T/matte.py framesc masks rgba
sh $T/encode.sh rgba voice-synced.wav chloe-call-2
echo "완료: chloe-call-2.webm, chloe-call-2-hevc.mp4 → prototype/public/scene/ 로 복사"
