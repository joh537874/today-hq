#!/bin/sh
# 줄리안 지하철 영상(prototype/public/scene/julian-subway.mp4) 현재 버전 빌드.
# 자막은 영상에 굽지 않는다(story.js의 cues로 얹는다). 음성의 주인공 이름 자리를 바꾼다.
#   0.50~1.00초 줄리안 "Jin," → "Hey"(ElevenLabs Adam, 2반음 낮춤, -6.9dB)
#  13.40~13.83초 나인 "Jin's" → "an"(나인이 말한 "Julian"의 끝음절 8.95~9.17초)
#  28.44~28.97초 줄리안 "Jin..." → "shit"(ElevenLabs Adam, -5dB)
# 이 폴더(name-edit)에서 실행한다. 원본 영상은 julian_subway_v2.mp4(자막 넣기 전 단계).
set -e
cd "$(dirname "$0")"
NIGHT=bgm_julian.wav  # 2026-11-28 밤 음악 대신 줄리안 장면 전용 음악

# 1. 대사 트랙 추출
ffmpeg -v error -y -i julian_subway_v2.mp4 -vn -ac 1 -ar 48000 dlg.wav

# 2. 바꿔 넣을 소리 준비 (hey_adam.mp3·shit_adam.mp3는 ElevenLabs에서 생성해 둔 파일)
TRIM="silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
ffmpeg -v error -y -i hey_adam.mp3 -ac 1 -ar 48000 -af "$TRIM" hey_trim.wav
ffmpeg -v error -y -i hey_trim.wav -af "asetrate=48000*0.89,aresample=48000,atempo=1.1236" hey_low.wav
ffmpeg -v error -y -i shit_adam.mp3 -ac 1 -ar 48000 -af "$TRIM" shit_trim.wav
ffmpeg -v error -y -i dlg.wav -ss 8.95 -t 0.22 an.wav

# 3. 이름 구간 무음 처리 후 교체 소리 합성
M="clip(max(0.50-t\,t-1.00)/0.02\,0\,1)*clip(max(13.40-t\,t-13.83)/0.02\,0\,1)*clip(max(28.44-t\,t-28.97)/0.02\,0\,1)"
ffmpeg -v error -y -i dlg.wav -i hey_low.wav -i shit_trim.wav -i an.wav -filter_complex "[0:a]volume='$M':eval=frame[base];[1:a]volume=-6.9dB,lowpass=f=7500,afade=t=in:d=0.01,areverse,afade=t=in:d=0.04,areverse,adelay=520|520[hey];[2:a]volume=-5dB,lowpass=f=7500,afade=t=in:d=0.01,areverse,afade=t=in:d=0.04,areverse,adelay=28460|28460[sh];[3:a]volume=2dB,afade=t=in:d=0.02,afade=t=out:st=0.18:d=0.04,adelay=13520|13520[an];[base][hey][sh][an]amix=inputs=4:normalize=0:duration=first" -ar 48000 -ac 1 dlg_patched.wav

# 4. 최종 빌드 (손떨림 카메라, 환경음·효과음, night BGM은 original/final/build.sh와 같다)
ffmpeg -v error -y -i julian_subway_v2.mp4 -i sfx/station.mp3 -i sfx/door.mp3 -i sfx/depart.mp3 -i sfx/ride.mp3 -i sfx/ride.mp3 -i sfx/people.mp3 -i sfx/people.mp3 -stream_loop -1 -i "$NIGHT" -i dlg_patched.wav -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=1.0,scale=2048:1152:flags=lanczos,crop=1920:1080:x='64+30*sin(2*PI*0.23*t)+14*sin(2*PI*0.61*t+1.3)+5*sin(2*PI*1.9*t+0.4)':y='36+20*sin(2*PI*0.29*t+2.1)+9*sin(2*PI*0.83*t+0.7)+3*sin(2*PI*2.3*t+1.9)',hqdn3d=1.2:1.2:3:3,unsharp=5:5:0.55:5:5:0,eq=contrast=1.02:saturation=1.03,format=yuv420p[vout];[9:a]aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=1.0[dlg];[1:a]aresample=48000,volume=0.22,afade=t=in:d=0.8,afade=t=out:st=9.6:d=1.6[a_st];[2:a]aresample=48000,volume=0.30,adelay=9100|9100[a_dr];[3:a]aresample=48000,volume=0.22,afade=t=in:d=0.6,afade=t=out:st=6.5:d=1.5,adelay=10200|10200[a_dp];[4:a]aresample=48000,volume=0.18,afade=t=in:d=3,afade=t=out:st=20.5:d=1.5,adelay=13000|13000[a_r1];[5:a]aresample=48000,volume=0.18,afade=t=in:d=1.5,adelay=33500|33500[a_r2];[8:a]aresample=48000,atrim=0:40.1,volume=0.10,afade=t=in:d=2.5,afade=t=out:st=37.6:d=2.5[a_bg];[6:a]aresample=48000,volume=0.16,afade=t=in:d=2,afade=t=out:st=20.5:d=1.5[a_p1];[7:a]aresample=48000,volume=0.16,afade=t=in:d=1.5,atrim=0:20,adelay=20000|20000[a_p2];[dlg][a_st][a_dr][a_dp][a_r1][a_r2][a_p1][a_p2][a_bg]amix=inputs=9:normalize=0:duration=first,loudnorm=I=-17:TP=-1.5:LRA=11[aout]" -map '[vout]' -map '[aout]' -c:v libx264 -preset slow -crf 17 -tune film -profile:v high -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -ar 48000 julian-subway.mp4
echo "완료: $(pwd)/julian-subway.mp4 → prototype/public/scene/ 로 복사"
