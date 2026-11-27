#!/bin/sh
# 투명 배경 장면(rgba 폴더)과 음성을 두 형식으로 묶는다. 크롬·엣지용 웹엠(VP9), 사파리용 애플 형식(HEVC).
# 영상이 음성보다 길면 영상 길이를 따른다(마지막에 입을 다문 장면으로 끝나게).
# 사용: sh encode.sh <rgba 폴더> <음성 파일> <출력 이름>
set -e
ffmpeg -v error -y -framerate 24 -i "$1/f%04d.png" -i "$2" -map 0:v -map 1:a -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 28 -row-mt 1 -c:a libopus -b:a 128k -af apad -shortest "$3.webm"
ffmpeg -v error -y -framerate 24 -i "$1/f%04d.png" -i "$2" -map 0:v -map 1:a -c:v hevc_videotoolbox -pix_fmt bgra -alpha_quality 0.85 -q:v 62 -tag:v hvc1 -c:a aac -b:a 160k -af apad -shortest -movflags +faststart "$3-hevc.mp4"
