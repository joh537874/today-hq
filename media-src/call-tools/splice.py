# 영상에 없는 짧은 말(예: "Good night")의 입 움직임을 같은 영상의 다른 말하는 구간에서 빌려 끼워 넣는다.
# 끼울 자리(at초)의 장면과 머리 위치·표정이 가장 비슷하고, 입이 열렸다 닫히는 구간을 고른다.
# 이음새는 앞뒤 3장면씩 겹쳐 섞어 튀지 않게 한다. 끼운 만큼 뒤 장면은 그대로 밀린다.
# 사용: python splice.py <장면 폴더> <출력 폴더> <mouth.txt> <at초> <길이초>
import os, shutil, sys
import numpy as np
from PIL import Image

FPS, XF = 24, 3
src, out, mouthf = sys.argv[1:4]
at, dur = float(sys.argv[4]), float(sys.argv[5])
files = sorted(os.listdir(src))
m = np.array([float(l) for l in open(mouthf)])
small = lambda f: np.asarray(Image.open(os.path.join(src, f)).convert('L').resize((61, 72)), np.float32)
thumbs = [small(f) for f in files]
G = int(round(at * FPS)) - 1               # 입이 소리보다 한 장면 먼저 열린다
L = int(round(dur * FPS)) + 2              # 앞뒤로 입이 닫힌 장면 하나씩
closed = np.percentile(m, 15)
best = None
for s in range(0, len(files) - L):
    if s + L > G - 6 and s < G + 6: continue   # 끼울 자리 근처는 제외
    seg = m[s:s + L]
    if seg.max() < 0.045: continue              # 말하는 구간만
    shape = abs(seg[0] - closed) + abs(seg[-1] - closed)  # 닫힘→열림→닫힘
    look = np.abs(thumbs[s] - thumbs[G]).mean() + np.abs(thumbs[s + L - 1] - thumbs[G]).mean()
    cost = look + 120 * shape
    if best is None or cost < best[0]: best = (cost, s)
_, s = best
print(f'빌려온 구간 {s / FPS:.2f}~{(s + L) / FPS:.2f}초 → {G / FPS:.2f}초에 끼움')
os.makedirs(out, exist_ok=True)
seq = [os.path.join(src, f) for f in files[:G]] + [os.path.join(src, files[k]) for k in range(s, s + L)] + [os.path.join(src, f) for f in files[G:]]
# 이음새 섞기: 끼운 구간의 처음·끝 XF장면을 원래 장면과 섞는다
blend = {}
for j in range(XF):
    w = (j + 1) / (XF + 1)
    blend[G + j] = (os.path.join(src, files[G + j - XF] if G + j - XF >= 0 else files[0]), 1 - w)   # 들어갈 때: 앞 장면 → 빌린 장면
    blend[G + L - 1 - j] = (os.path.join(src, files[min(len(files) - 1, G + XF - 1 - j)]), 1 - w)  # 나올 때: 빌린 장면 → 뒤 장면
for i, p in enumerate(seq):
    dst = os.path.join(out, 'f%04d.png' % (i + 1))
    if i in blend:
        q, wq = blend[i]
        Image.blend(Image.open(p).convert('RGB'), Image.open(q).convert('RGB'), wq).save(dst)
    else:
        shutil.copy(p, dst)
print('장면', len(seq))
