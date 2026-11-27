#!/bin/sh
# 클로이 첫 통화 영상(src.mp4, 힉스필드 hf_20261127_184512. 음성은 영상에 들어 있는 것을 그대로 쓴다).
# 공정은 ../chloe-call-3/build.sh 와 같다(도구는 ../call-tools). 이 영상은 처음부터 입 모양과 소리가 맞아 싱크 조정은 하지 않는다.
set -e
cd "$(dirname "$0")"
PY=../.venv/bin/python
T=../call-tools
rm -rf raw frames masks rgba comp && mkdir -p raw masks
ffmpeg -v error -y -i src.mp4 raw/f%04d.png
ffmpeg -v error -y -i src.mp4 -vn -c:a pcm_s16le voice.wav
$PY $T/frame.py raw frames 637.5 226 293
swift $T/seg.swift frames masks
$PY $T/matte.py frames masks rgba
sh $T/encode.sh rgba voice.wav chloe-call
echo "완료: chloe-call.webm, chloe-call-hevc.mp4 → prototype/public/scene/ 로 복사"
