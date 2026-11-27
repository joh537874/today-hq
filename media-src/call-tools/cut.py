# 영상에서 음성에 없는 말 구간을 잘라낸다. 자르는 지점은 입이 닫힌 장면으로 잡고, 이음새는 3장면 섞는다.
# 사용: python cut.py <장면 폴더> <출력 폴더> <시작초-끝초> [<시작초-끝초> ...]
import os, shutil, sys
from PIL import Image

FPS, XF = 24, 3
src, out = sys.argv[1:3]
cuts = [tuple(round(float(v) * FPS) for v in c.split('-')) for c in sys.argv[3:]]
files = sorted(os.listdir(src))
keep, joins = [], []
for i, f in enumerate(files):
    if any(a <= i < b for a, b in cuts): continue
    if keep and int(keep[-1][1:5]) - 1 != i - 1: joins.append(len(keep))
    keep.append(f)
os.makedirs(out, exist_ok=True)
for j, f in enumerate(keep):
    dst = os.path.join(out, 'f%04d.png' % (j + 1))
    im = Image.open(os.path.join(src, f)).convert('RGB')
    for J in joins:  # 이음새 직후 XF장면은 잘린 앞쪽 마지막 장면과 섞어 서서히 넘어간다
        if J <= j < J + XF:
            prev = Image.open(os.path.join(src, keep[J - 1])).convert('RGB')
            im = Image.blend(prev, im, (j - J + 1) / (XF + 1))
    im.save(dst)
print(f'장면 {len(files)} → {len(keep)}, 이음새 {[round(J / FPS, 2) for J in joins]}초')
