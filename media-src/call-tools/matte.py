# 사람 가면(seg.swift)으로 대략의 영역을 잡고, 경계는 벽 색과의 차이로 투명도를 다시 계산한다.
# 1) 카메라가 고정이므로 사람이 없는 순간의 화소를 모아 벽 색(배경판)을 만든다.
# 2) 가면 안쪽 깊은 곳(경계에서 22px 이상)은 불투명, 바깥 먼 곳은 투명, 그 사이 경계 띠에서만 '벽 색과 얼마나 다른가'로 투명도를 정한다.
#    머리카락 끝처럼 가면이 놓치는 부분이 살아나고, 벽이 섞여 생기던 회색 테두리가 사라진다.
# 3) 경계 화소의 색은 가장 가까운 불투명 화소의 색으로 바꿔 벽 색이 섞이지 않게 한다.
# 사용: python matte.py <장면 폴더> <가면 폴더> <출력 폴더>
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd

src, msk, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
files = sorted(os.listdir(src))
F = np.stack([np.asarray(Image.open(os.path.join(src, f)).convert('RGB'), np.float32) for f in files])
M = np.stack([np.asarray(Image.open(os.path.join(msk, f)).convert('L'), np.float32) / 255 for f in files])
n, H, W, _ = F.shape

# 1) 배경판: 사람에서 충분히 떨어진 화소만 모아 시간 방향 중앙값
far = np.stack([~nd.binary_dilation(m > 0.2, iterations=6) for m in M])
B = np.full((H, W, 3), np.nan, np.float32)
cnt = far.sum(0)
for c in range(3):
    v = np.where(far, F[..., c], np.nan)
    with np.errstate(all='ignore'): B[..., c] = np.nanmedian(v, axis=0)
# 한 번도 드러나지 않은 곳(몸 뒤)은 주변 벽 색을 번지게 해 채운다
known = cnt >= 2
for c in range(3):
    ch = np.where(known, B[..., c], 0)
    w = known.astype(np.float32)
    num, den = ch.copy(), w.copy()
    for s in (8, 24, 64, 160):
        num = np.where(den > 0.5, num, nd.gaussian_filter(ch, s))
        den = np.where(den > 0.5, den, nd.gaussian_filter(w, s))
    B[..., c] = np.where(known, B[..., c], num / np.maximum(den, 1e-6))

HAIR, CHROMA, FLOOR = 22.0, 24.0, 0.08  # 머리카락 밝기, 이만큼 색이 다르면 불투명, 이 이하는 잡음으로 보고 투명
A = np.zeros((n, H, W), np.float32)
for i in range(n):
    m = M[i]
    core = nd.binary_erosion(m > 0.5, iterations=22, border_value=1)  # 이 안쪽만 무조건 불투명(머리카락 틈으로 보이는 벽은 색으로 판정)
    band = nd.binary_dilation(m > 0.25, iterations=12)
    # 투명도 = 섞인 비율. 머리카락(검정)은 벽보다 어두운 만큼, 피부·옷은 벽과 색이 다른 만큼 사람으로 본다.
    # 원본 머리카락 윤곽의 밝은 번짐(벽보다 밝고 색이 없음)은 어느 쪽에도 걸리지 않아 배경이 된다.
    D = F[i] - B
    lum = D.mean(-1)
    chroma = np.sqrt(((D - lum[..., None]) ** 2).sum(-1))
    dark = np.maximum(-lum, 0) / np.maximum(B.mean(-1) - HAIR, 30)
    ac = nd.gaussian_filter(np.maximum(dark, chroma / CHROMA), 0.6)
    ac = np.clip((ac - FLOOR) / (1 - FLOOR), 0, 1)
    # 벽이 한 번도 드러나지 않아 배경판을 추정으로 채운 곳은 색 판정과 사람 가면이 둘 다 사람이라 할 때만 남긴다
    ac = np.where(known, ac, np.minimum(ac, nd.gaussian_filter(m, 1.0)))
    a = np.where(core, 1.0, np.where(band, ac, 0.0))
    # 경계 띠 바깥쪽 끝으로 갈수록 서서히 줄여 띠 모양 자국이 남지 않게 한다
    edge = nd.gaussian_filter(band.astype(np.float32), 3)
    a = np.minimum(a, np.clip(edge * 2, 0, 1))
    # 띠 안의 작은 섬(벽 얼룩)은 지운다
    lab, k = nd.label(a > 0.05)
    if k > 1:
        sizes = nd.sum(np.ones_like(a), lab, range(1, k + 1))
        keep = np.zeros(k + 1, bool); keep[1:] = sizes >= 400
        a = np.where(keep[lab], a, 0)
    A[i] = a
# 앞뒤 장면과 섞어 경계 떨림을 줄인다
As = A.copy()
As[1:-1] = 0.25 * A[:-2] + 0.5 * A[1:-1] + 0.25 * A[2:]
for i in range(n):
    a = nd.gaussian_filter(As[i], 0.6)
    # 3) 경계 화소는 가장 가까운 불투명 화소(머리카락·피부)의 색을 쓴다. 벽 색이 섞여 생기는 회색·흰 테두리를 막는다.
    solid = a > 0.9
    _, (iy, ix) = nd.distance_transform_edt(~solid, return_indices=True)
    near = nd.gaussian_filter(F[i][iy, ix], (1.2, 1.2, 0))
    rgb = np.where(solid[..., None], F[i], near)
    o = np.dstack([rgb, a * 255]).round().astype(np.uint8)
    Image.fromarray(o, 'RGBA').save(os.path.join(out, files[i]))
print('matte', n)
