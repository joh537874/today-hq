# 싱크 점검: 말소리가 나는 장면 중 입이 닫힌 비율, 입이 크게 열린 장면 중 소리가 없는 비율.
# 사용: python check.py <mouth.txt> <음성 파일> [음성 지연초]
import subprocess, sys
import numpy as np
m = np.array([float(l) for l in open(sys.argv[1])])
d = float(sys.argv[3]) if len(sys.argv) > 3 else 0
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[2], '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(pcm, np.float32)
x = np.concatenate([np.zeros(int(d * 24000), np.float32), x])
r = np.array([np.sqrt(np.mean(x[i * 1000:(i + 1) * 1000] ** 2) + 1e-12) if i * 1000 < len(x) else 0 for i in range(len(m))])
talk = r > r.max() * 0.08
closed, opened = m < 0.022, m > np.percentile(m[m > 0.022], 50)
print(f'말하는데 입 닫힘 {100 * (talk & closed).sum() / talk.sum():.0f}%  입 열렸는데 소리 없음 {100 * (opened & ~talk).sum() / opened.sum():.0f}%')
