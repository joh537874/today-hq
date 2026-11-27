#!/bin/sh
# 재이 시위 영상의 소리만 다시 섞는다. 화면은 현재 영상 그대로 쓰고, 목소리 2개 + 재이 장면 전용 음악(bgm_jae.wav).
set -e
cd "$(dirname "$0")"
V=../../prototype/public/scene/jae-protest.mp4; F=session-1125/final; D=22.09
ffmpeg -v error -y -i $V -i $F/voice_raw.wav -i $F/voice2_raw.wav -i bgm_jae.wav -filter_complex "\
[1:a]aresample=48000,volume=0.6[v1];[2:a]aresample=48000,volume=1.0,adelay=12040|12040[v2];\
[v1][v2]amix=inputs=2:duration=longest:normalize=0,highpass=f=220,lowpass=f=5000,treble=g=-4:f=3000,acompressor=threshold=-20dB:ratio=3,volume=0.9[vo];\
[3:a]aresample=48000,atrim=0:$D,volume='if(lt(t,12),0.12,0.12+0.08*min(1,(t-12)/3))':eval=frame,afade=in:d=1.5,afade=out:st=20.6:d=1.49[bgm];\
[vo][bgm]amix=inputs=2:duration=longest:normalize=0,atrim=0:$D,loudnorm=I=-18:TP=-2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart jae-protest-remix.mp4
echo "완료: jae-protest-remix.mp4 → prototype/public/scene/jae-protest.mp4 로 복사"
