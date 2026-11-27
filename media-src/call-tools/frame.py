# 원본 장면(1280×720)을 통화 카드 비율(614×720)로 잘라 세 영상의 얼굴 크기·위치를 맞춘다.
# 기준: 얼굴 폭 335px, 눈 높이 258px, 얼굴 가운데 307px(카드 가로 가운데).
# 사용: python frame.py <원본 장면 폴더> <출력 폴더> <얼굴 가운데 x> <눈 높이 y> <얼굴 폭> [기준 얼굴 폭] [기준 눈 높이]
#   기준값은 원본에서 머리 꼭대기가 잘릴 때만 바꾼다(2번 영상).
# 얼굴 값은 face.swift로 원본을 재서 평균 낸 것. 잘라낼 범위가 원본 위로 넘치면 맨 윗줄을 늘려 채운다(어차피 배경이라 투명해진다).
import os, sys
import numpy as np
from PIL import Image

T, EYE, CX, OW, OH = 335, 258, 307, 614, 720
src, out, cx, eye, w = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:6])
if len(sys.argv) > 7: T, EYE = float(sys.argv[6]), float(sys.argv[7])
k = w / T
cw, ch = OW * k, OH * k
x0, y0 = cx - CX * k, eye - EYE * k
os.makedirs(out, exist_ok=True)
pad = int(max(0, -np.floor(y0))) + 2
for f in sorted(os.listdir(src)):
    a = np.asarray(Image.open(os.path.join(src, f)).convert('RGB'))
    if pad: a = np.pad(a, ((pad, pad), (0, 0), (0, 0)), mode='edge')
    im = Image.fromarray(a)
    im.resize((OW, OH), Image.LANCZOS, box=(x0, y0 + pad, x0 + cw, y0 + pad + ch)).save(os.path.join(out, f))
print(f'잘라낸 범위 x{x0:.0f} y{y0:.0f} {cw:.0f}×{ch:.0f} (배율 {1/k:.3f})')
