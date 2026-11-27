#!/bin/sh
# 클로이 통화 영상(prototype/public/scene/chloe-call.mp4) 만들기.
# 1) 원본(src.mp4, 힉스필드 hf_20261127_193645)을 카드 비율(614×720)로 잘라 장면별로 나눈다.
# 2) macOS 기본 비전 기능으로 사람 가면을 뽑는다(seg.swift).
# 3) 배경을 투명하게 뺀 영상을 두 형식으로 만든다.
set -e
cd "$(dirname "$0")"
mkdir -p frames masks comp
ffmpeg -v error -y -i src.mp4 -vf "crop=834:977:0:0,scale=614:720:flags=lanczos" frames/f%04d.png
swift ../chloe-call/seg.swift frames masks
# 3) 클로이만 남기고 배경을 투명하게 뺀 장면을 만든다(가면은 앞뒤 장면과 평균 내어 떨림을 줄임).
python3 - <<'PY'
import os
from PIL import Image, ImageFilter
os.makedirs('rgba', exist_ok=True)
files=sorted(os.listdir('frames')); masks=[Image.open('masks/'+f).convert('L') for f in files]
for i,f in enumerate(files):
    m=Image.blend(Image.blend(masks[max(0,i-1)],masks[min(len(masks)-1,i+1)],0.5),masks[i],0.5).filter(ImageFilter.GaussianBlur(1.2))
    im=Image.open('frames/'+f).convert('RGB'); im.putalpha(m); im.save('rgba/'+f)
PY
# 4) 투명 배경 영상 두 형식: 크롬·엣지용 웹엠, 사파리용 애플 형식. 유리 효과는 화면(CSS)에서 건다.
ffmpeg -v error -y -framerate 24 -i rgba/f%04d.png -i src.mp4 -map 0:v -map 1:a -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -row-mt 1 -c:a libopus -b:a 128k -shortest chloe-call-2.webm
ffmpeg -v error -y -framerate 24 -i rgba/f%04d.png -i src.mp4 -map 0:v -map 1:a -c:v hevc_videotoolbox -pix_fmt bgra -alpha_quality 0.8 -q:v 60 -tag:v hvc1 -c:a aac -b:a 160k -movflags +faststart -shortest chloe-call-2-hevc.mp4
echo "완료: chloe-call-2.webm, chloe-call-2-hevc.mp4 → prototype/public/scene/ 로 복사"
