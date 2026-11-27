#!/bin/sh
# 클로이 두 번째 통화 영상(videocall2_synced + 클로이2 음성).
# 원본은 입 모양이 소리보다 0.46초 앞서 있어(mouth.swift로 장면별 입 벌림을 재서 말 쉼 구간과 비교) 화면 앞에 첫 장면을 0.46초 붙여 늦춘다.
set -e
cd "$(dirname "$0")"
mkdir -p frames masks rgba
ffmpeg -v error -y -i src.mp4 -vf "tpad=start_mode=clone:start_duration=0.46,crop=614:720:333:0" frames/f%04d.png
swift ../chloe-call/seg.swift frames masks
python3 - <<'PY'
import os
from PIL import Image, ImageFilter
files=sorted(os.listdir('frames')); masks=[Image.open('masks/'+f).convert('L') for f in files]
for i,f in enumerate(files):
    m=Image.blend(Image.blend(masks[max(0,i-1)],masks[min(len(masks)-1,i+1)],0.5),masks[i],0.5).filter(ImageFilter.GaussianBlur(1.2))
    im=Image.open('frames/'+f).convert('RGB'); im.putalpha(m); im.save('rgba/'+f)
PY
ffmpeg -v error -y -framerate 24 -i rgba/f%04d.png -i voice.mp3 -map 0:v -map 1:a -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -row-mt 1 -c:a libopus -b:a 128k chloe-call-2.webm
ffmpeg -v error -y -framerate 24 -i rgba/f%04d.png -i voice.mp3 -map 0:v -map 1:a -c:v hevc_videotoolbox -pix_fmt bgra -alpha_quality 0.8 -q:v 60 -tag:v hvc1 -c:a aac -b:a 160k -movflags +faststart chloe-call-2-hevc.mp4
echo "완료: chloe-call-2.webm, chloe-call-2-hevc.mp4 → prototype/public/scene/ 로 복사"
