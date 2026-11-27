import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']
lines={
 '1':"[shouting] HQ isn't what makes someone human! [frustrated] Who gets to decide what that means... and how? [inhales sharply] [voice breaking] I don't even fully understand myself... [shouting] so how can anyone define what it means to be human?!",
 '2':"[scoffs] Making mistakes makes you human? [mocking] Feeling emotions makes you human? [angry] You can't define humanity that way. [inhales deeply] [passionate] Humanity isn't a fixed concept. [shouting] It's something we have to discover for ourselves!",
}
voices={'sarah':'EXAVITQu4vr4xnSDxMaL','jessica':'cgSgspJ2msm6clMCkdW9','laura':'FGY2WhTYpPnrIDTdsKH5'}
for vn,vid in voices.items():
  for ln,t in lines.items():
    body=json.dumps({'text':t,'model_id':'eleven_v3','voice_settings':{'stability':0.0,'similarity_boost':0.8}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
    try: open(f'jae_{ln}_{vn}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',vn,ln)
    except urllib.error.HTTPError as e: print('err',vn,ln,e.code,e.read()[:200])
