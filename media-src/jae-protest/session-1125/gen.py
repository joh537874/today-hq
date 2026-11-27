import os, json, urllib.request, sys
key=os.environ['ELEVENLABS_API_KEY']
lines={
 '1':"[shouting] HQ는 진짜 인간다움이 아닙니다! [frustrated] 그걸 누가… 어떻게 규정하는 거죠? [inhales sharply] [voice breaking] 내 스스로조차 제대로 알지 못하는데… [shouting] 어떻게 인간다움을 규정한단 말입니까?!",
 '2':"[scoffs] 실수를 하면 인간이라고? [mocking] 감정을 많이 느끼면 인간이라고? [angry] 그런 건 인간다움이라고 할 수 없어요. [inhales deeply] [passionate] 인간다움은 고정된 개념이 아닙니다. [shouting] 인간다움은, 우리 스스로 찾아 나가는 거죠!",
}
voices={'jeong':'GxBcmd2WiyTWbBgrFx9z','hanaim':'8jHHF8rMqMlg8if2mOUe','charlie':'IKne3meq5aSn9XLyUdCD'}
for vn,vid in voices.items():
  for ln,t in lines.items():
    body=json.dumps({'text':t,'model_id':'eleven_v3','voice_settings':{'stability':0.0,'similarity_boost':0.8}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
    try:
      open(f'jae_{ln}_{vn}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',vn,ln)
    except urllib.error.HTTPError as e: print('err',vn,ln,e.code,e.read()[:200])
