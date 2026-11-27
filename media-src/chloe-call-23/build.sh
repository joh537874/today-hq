#!/bin/sh
# 클로이 2·3 통화를 한 번에 잇는 영상(힉스필드 MiniMax H3, hf_20261127_211118).
# 시작 프레임 start.png + 2·3번 음성을 0.6초 쉼으로 이은 voice-23.mp3 를 넣어 생성했다.
# 영상 속 소리는 voice-23.mp3 와 같고 시간 차가 없다. 입 모양은 대체로 맞으나 구절별로 조금씩 어긋나 sync.py로 구절 위치를 다듬는다.
# 공정은 ../chloe-call-3/build.sh 와 같다(도구는 ../call-tools).
set -e
cd "$(dirname "$0")"
PY=../.venv/bin/python
T=../call-tools
rm -rf raw frames masks rgba && mkdir -p raw masks
ffmpeg -v error -y -i src.mp4 raw/f%04d.png
# 원본 2560×1440 기준 얼굴 값. 위가 모자라지 않게 2번 영상과 같은 기준(얼굴 350·눈 245)으로 자른다.
$PY $T/frame.py raw frames 1343 442 604 350 245
swift $T/mouth.swift frames > mouth.txt
$PY $T/sync.py voice-23.mp3 stt.json mouth.txt voice-synced.wav
swift $T/seg.swift frames masks
$PY $T/matte.py frames masks rgba
sh $T/encode.sh rgba voice-synced.wav chloe-call-23
echo "완료: chloe-call-23.webm, chloe-call-23-hevc.mp4 → prototype/public/scene/ 로 복사"
