# 1장 뉴스 장면 음악 2곡. ElevenLabs Music API. 환경 변수 ELEVENLABS_API_KEY를 읽는다.
import os, json, urllib.request
key = os.environ['ELEVENLABS_API_KEY']
jobs = {
  # 앵커 목소리 아래에 깔리는 뉴스 배경음. 목소리를 가리지 않도록 중저음 위주, 멜로디 없음.
  'm_news': ("Near-future TV news broadcast underscore bed, sleek and cold, low pulsing synth bass, soft ticking data-like percussion, subtle tension, "
             "sparse, leaves room for an anchor's voice, no melody lead, no vocals, no drums kick, 90 bpm", 30000),
  # 줌아웃 뒤 밤 거실. 뉴스의 여운이 남은 채 혼자 앉아 있는 장면부터 클로이와의 통화까지 반복 재생한다.
  'm_living': ("Quiet night in a minimalist future apartment after unsettling news, soft warm-cold ambient pads, slow sparse felt piano notes, "
               "faint city hum texture, introspective and slightly uneasy, gentle, seamless loop, no vocals, no drums", 60000),
}
for n, (p, ms) in jobs.items():
    body = json.dumps({'prompt': p, 'music_length_ms': ms}).encode()
    r = urllib.request.Request('https://api.elevenlabs.io/v1/music', body,
                               {'xi-api-key': key, 'Content-Type': 'application/json', 'User-Agent': 'curl/8.7.1'})
    try:
        open(f'{n}.mp3', 'wb').write(urllib.request.urlopen(r, timeout=300).read()); print('ok', n)
    except urllib.error.HTTPError as e:
        print('err', n, e.code, e.read()[:300])
