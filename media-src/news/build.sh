#!/bin/sh
# 1장 뉴스 영상: 앵커 원본(news-raw.mp4, 22.04초)에 새 뉴스 배경음(m_news.mp3)을 목소리 아래로 섞는다.
# 배경음은 원본 대비 0.3배(약 -10.5dB), 처음 0.8초 페이드인, 20~22초 페이드아웃.
# 결과: prototype/public/scene/news.mp4 (H.264 1280×720, 웹 재생용 faststart)
cd "$(dirname "$0")"
ffmpeg -y -v error -i news-raw.mp4 -i m_news.mp3 -filter_complex \
 "[1:a]atrim=0:22.04,volume=0.3,afade=t=in:d=0.8,afade=t=out:st=20:d=2.04[b];[0:a][b]amix=inputs=2:duration=first:normalize=0[a]" \
 -map 0:v -map "[a]" -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart \
 ../../prototype/public/scene/news.mp4
