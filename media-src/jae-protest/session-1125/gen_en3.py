import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']
lines={
 '1':"[shouting, desperate plea to the crowd] Please, listen to me! HQ is NOT what makes someone human! [pleading, voice rising] Who gets to decide what that means...? And how?! [shaky breath] [voice trembling, emotional] I don't even fully understand myself... [crying out, begging] so how can anyone define what it means to be human?!",
 '2':"[pleading, raw emotion] Making mistakes makes you human? [desperate] Feeling emotions makes you human? [voice cracking] You can't... you can't define humanity that way! [deep shaky breath] [heartfelt, urging the crowd] Humanity isn't a fixed concept. [crying out with all her heart] It's something we have to discover... for ourselves!",
}
voices={'sarah':'EXAVITQu4vr4xnSDxMaL','jessica':'cgSgspJ2msm6clMCkdW9','laura':'FGY2WhTYpPnrIDTdsKH5'}
for vn,vid in voices.items():
  for ln,t in lines.items():
    body=json.dumps({'text':t,'model_id':'eleven_v3','voice_settings':{'stability':0.0,'similarity_boost':0.8}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
    try: open(f'take3/jae_{ln}_{vn}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',vn,ln)
    except urllib.error.HTTPError as e: print('err',vn,ln,e.code,e.read()[:200])
