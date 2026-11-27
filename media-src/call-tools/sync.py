# 영상은 원래 속도로 두고, 음성의 구절 사이 쉼만 조정해 입 움직임에 맞춘다.
# 1) 받아쓰기(stt.json)의 단어 시간으로 음성을 구절로 나눈다(단어 사이가 GAP초 이상 비면 끊음).
# 2) 각 구절의 소리 크기 곡선과 영상의 입 벌림 곡선(mouth.swift)이 가장 잘 겹치고,
#    p·b·m 소리(입술이 닫힘)가 영상에서 입이 닫히는 순간에 오는 위치를 찾는다.
#    구절 순서는 그대로, 구절 사이는 최소 0.12초, 원래 쉼 길이에서 너무 벗어나지 않게(벌점) 고른다.
# 3) 구절을 고른 위치에 놓아 새 음성 파일을 만든다(구절 안쪽은 손대지 않음).
# 사용: python sync.py <voice.mp3> <stt.json> <mouth.txt> <출력.wav> [--free N]
#   --free N: 마지막 N개 구절은 입 움직임과 맞추지 않고 원래 쉼 길이대로 뒤에 붙인다(영상에 해당 입 움직임이 없을 때).
import json, subprocess, sys
import numpy as np

FPS, SR, GAP, MINGAP, LAMBDA, WLAB = 24, 48000, 0.2, 0.12, 6.0, 2.0
voice, stt, mouthf, out = sys.argv[1:5]
free = int(sys.argv[sys.argv.index('--free') + 1]) if '--free' in sys.argv else 0

pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', voice, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32)
words = [w for w in json.load(open(stt))['words'] if w['type'] == 'word']
units = []
for w in words:
    if units and w['start'] - units[-1]['end'] < GAP:
        units[-1]['end'] = w['end']; units[-1]['text'] += ' ' + w['text']; units[-1]['words'].append(w)
    else:
        units.append({'start': w['start'], 'end': w['end'], 'text': w['text'], 'words': [w]})
# 구절 앞뒤로 숨소리·여음을 조금 붙이되 이웃 구절의 쉼 가운데를 넘지 않는다
for i, u in enumerate(units):
    lo = (units[i - 1]['end'] + u['start']) / 2 if i else 0
    hi = (u['end'] + units[i + 1]['start']) / 2 if i + 1 < len(units) else len(x) / SR
    u['a'], u['b'] = max(lo, u['start'] - 0.06), min(hi, u['end'] + 0.1)

m = np.array([float(l) for l in open(mouthf)])
m = np.convolve(m, [0.25, 0.5, 0.25], 'same')
mz = (m - m.mean()) / (m.std() + 1e-6)
N = len(m)

def env(u):  # 구절의 프레임별 소리 크기(0~1)
    seg = x[int(u['start'] * SR):int(u['end'] * SR)]
    L = max(1, int(round((u['end'] - u['start']) * FPS)))
    r = np.array([np.sqrt(np.mean(c ** 2) + 1e-12) for c in np.array_split(seg, L)])
    return np.sqrt(r / r.max())

def labial(u):  # p·b·m 소리에서 입술이 닫히는 예상 순간(구절 안 프레임 위치). 글자 위치로 단어 안 시점을 어림한다.
    L = max(1, int(round((u['end'] - u['start']) * FPS)))
    c = np.zeros(L)
    for w in u['words']:
        t = w['text'].lower().strip('.,?!')
        for k, ch in enumerate(t):
            if ch in 'pbm' and not (k and t[k - 1] == ch):
                at = (w['start'] + (w['end'] - w['start']) * k / max(1, len(t)) - u['start']) * FPS
                c += np.exp(-0.5 * ((np.arange(L) - at) / 1.0) ** 2)
    return c

match = units[:len(units) - free]
E = [env(u) for u in match]
L = [len(e) for e in E]
ogap = [round((match[i]['start'] - match[i - 1]['end']) * FPS) for i in range(1, len(match))]
G = int(np.ceil(MINGAP * FPS))
tail = sum(int(round((u['end'] - u['start']) * FPS)) for u in units[len(match):]) + sum(
    round((units[i]['start'] - units[i - 1]['end']) * FPS) for i in range(len(match), len(units)))
last_end = N - 1 - (0 if free else 1)
C = [labial(u) for u in match]
closed = np.clip(-mz, -1, 3)  # 입이 닫혀 있을수록 큼
def score(i, s):
    e = E[i]
    if s + len(e) > N: return -1e9
    return float(np.dot(e, mz[s:s + len(e)])) + WLAB * float(np.dot(C[i], closed[s:s + len(e)]))
S = [np.array([score(i, s) for s in range(N)]) for i in range(len(E))]
# 첫 구절은 영상에서 입이 처음 열리는 시점(한 장면 앞까지 허용) 이후에 둔다
first_open = int(np.argmax(m > 0.04))
S[0][:max(0, first_open - 1)] = -1e9
dp = [S[0].copy()]; bk = [None]
for i in range(1, len(match)):
    cur = np.full(N, -1e9); arg = np.zeros(N, int)
    for s in range(N):
        best, bi = -1e9, 0
        for p in range(0, s - L[i - 1] - G + 1):
            gap = s - p - L[i - 1]
            v = dp[-1][p] - LAMBDA * ((gap - ogap[i - 1]) / FPS) ** 2
            if v > best: best, bi = v, p
        cur[s] = S[i][s] + best; arg[s] = bi
    dp.append(cur); bk.append(arg)
ends = np.array([s + L[-1] for s in range(N)])
final = np.where(ends + (tail if free else 0) <= last_end, dp[-1], -1e9)
s = int(np.argmax(final)); pos = [s]
for i in range(len(match) - 1, 0, -1):
    s = int(bk[i][s]); pos.insert(0, s)

# 원래 배치의 점수와 비교
orig = sum(score(i, int(round(u['start'] * FPS))) for i, u in enumerate(match))
print(f'겹침 점수 원래 {max(orig, -1):.1f} → 조정 {sum(S[i][p] for i, p in enumerate(pos)):.1f}')

# 새 시작 시각
t = [p / FPS for p in pos]
for i in range(len(match), len(units)):
    t.append(t[-1] + (units[i - 1]['end'] - units[i - 1]['start']) + (units[i]['start'] - units[i - 1]['end']))
total = max(N / FPS, t[-1] + (units[-1]['b'] - units[-1]['start']) + 0.1)
y = np.zeros(int(total * SR) + SR, np.float32)
res = []
for u, ts in zip(units, t):
    a, b = int(u['a'] * SR), int(u['b'] * SR)
    seg = x[a:b].copy()
    f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    o = int((ts - (u['start'] - u['a'])) * SR)
    if o < 0: seg, o = seg[-o:], 0  # 맨 앞 구절이 0초에 붙으면 앞 여음을 덜어 낸다
    y[o:o + len(seg)] += seg
    res.append({'text': u['text'], 'from': round(u['start'], 2), 'to': round(ts, 3), 'end': round(ts + u['end'] - u['start'], 3)})
y = y[:int(total * SR)]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', out], input=y.tobytes(), check=True)
json.dump(res, open(out.rsplit('.', 1)[0] + '.json', 'w'), ensure_ascii=False, indent=1)
for r in res: print(f"{r['to']:.2f}~{r['end']:.2f} (원래 {r['from']:.2f})  {r['text']}")
