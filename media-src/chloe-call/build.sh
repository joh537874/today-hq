#!/bin/sh
# 클로이 통화 영상(prototype/public/scene/chloe-call.mp4) 만들기.
# 1) 원본(src.mp4, 힉스필드 hf_20261127_184512)을 카드 비율(614×720)로 잘라 장면별로 나눈다.
# 2) macOS 기본 비전 기능으로 사람 가면을 뽑는다(seg.swift).
# 3) 거실 컷(p-call-bg)의 카드 뒤 영역을 흐리게 하고 흰빛을 얹은 유리 배경 위에 클로이를 합성한다.
set -e
cd "$(dirname "$0")"
mkdir -p frames masks comp
ffmpeg -v error -y -i src.mp4 -vf "crop=614:720:333:0" frames/f%04d.png
swift seg.swift frames masks
python3 - <<'PY'
import os
from PIL import Image, ImageFilter, ImageEnhance
W,H=614,720
bg=Image.open('../../prototype/public/cut/p-call-bg.jpg').convert('RGB').crop((674,206,1249,880)).resize((W,H),Image.LANCZOS)
bg=bg.filter(ImageFilter.GaussianBlur(22))
bg=ImageEnhance.Brightness(Image.blend(bg,Image.new('RGB',(W,H),(235,242,246)),0.28)).enhance(1.05)
files=sorted(os.listdir('frames')); masks=[Image.open('masks/'+f).convert('L') for f in files]
for i,f in enumerate(files):
    m=Image.blend(Image.blend(masks[max(0,i-1)],masks[min(len(masks)-1,i+1)],0.5),masks[i],0.5).filter(ImageFilter.GaussianBlur(1.2))
    Image.composite(Image.open('frames/'+f).convert('RGB'),bg,m).save('comp/'+f)
PY
ffmpeg -v error -y -framerate 24 -i comp/f%04d.png -i src.mp4 -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart -shortest chloe-call.mp4
echo "완료: chloe-call.mp4 → prototype/public/scene/ 로 복사"
