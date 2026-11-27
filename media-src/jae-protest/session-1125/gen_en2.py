import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']
lines={
 '1':"[yelling at the top of her lungs] HQ is NOT what makes someone human!! [furious, shouting] WHO gets to decide what that means?! And HOW?! [gasps for breath] [shouting, voice cracking] I don't even fully understand MYSELF... [screaming] so how can ANYONE define what it means to be human?!",
 '2':"[shouting, scornful] Making mistakes makes you human?! [yelling] Feeling emotions makes you human?! [furious] You CAN'T define humanity that way!! [heavy breathing] [shouting to the crowd] Humanity is NOT a fixed concept!! [screaming with passion] It's something WE have to discover for OURSELVES!!",
}
voices={'sarah':'EXAVITQu4vr4xnSDxMaL','jessica':'cgSgspJ2msm6clMCkdW9','laura':'FGY2WhTYpPnrIDTdsKH5'}
for vn,vid in voices.items():
  for ln,t in lines.items():
    body=json.dumps({'text':t,'model_id':'eleven_v3','voice_settings':{'stability':0.0,'similarity_boost':0.8}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
    try: open(f'take2/jae_{ln}_{vn}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',vn,ln)
    except urllib.error.HTTPError as e: print('err',vn,ln,e.code,e.read()[:200])
