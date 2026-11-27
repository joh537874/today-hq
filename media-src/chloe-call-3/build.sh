#!/bin/sh
# 클로이 세 번째 통화 영상(src.mp4 + 클로이3 음성). "Anyway, it's getting pretty late. I'll talk to you again tomorrow. Good night."
# 공정(도구는 ../call-tools):
# 1) frame.py  얼굴 크기·눈 높이를 세 영상 공통 기준에 맞춰 카드 비율로 자른다(얼굴 값은 face.swift로 잰 평균).
# 2) sync.py   영상은 원래 속도로 두고 음성 구절 사이 쉼만 옮겨 입 움직임에 맞춘다.
#              "Good night"은 영상에 입 움직임이 없어(--free 1) 원래 쉼 길이대로 뒤에 붙인다.
# 3) splice.py "Good night" 자리에 같은 영상의 "tomorrow" 끝 입 움직임을 빌려 끼운다.
# 4) seg.swift + matte.py  배경을 투명하게 뺀다(경계는 벽 색과의 차이로 계산).
# 5) 크롬용 웹엠, 사파리용 애플 형식으로 만든다.
# 파이썬은 ../.venv(numpy·scipy·pillow).
set -e
cd "$(dirname "$0")"
PY=../.venv/bin/python
T=../call-tools
rm -rf raw frames frames2 masks rgba && mkdir -p raw masks
ffmpeg -v error -y -i src.mp4 raw/f%04d.png
$PY $T/frame.py raw frames 646 278 320
swift $T/mouth.swift frames > mouth.txt
$PY $T/sync.py voice.mp3 stt.json mouth.txt voice-synced.wav --free 1
GN=$($PY -c "import json;print(json.load(open('voice-synced.json'))[-1]['to'])")
$PY $T/splice.py frames frames2 mouth.txt "$GN" 0.34
swift $T/seg.swift frames2 masks
$PY $T/matte.py frames2 masks rgba
sh $T/encode.sh rgba voice-synced.wav chloe-call-3
echo "완료: chloe-call-3.webm, chloe-call-3-hevc.mp4 → prototype/public/scene/ 로 복사"
