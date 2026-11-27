import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']
lines={
 '1':"[shouting, desperate plea to the crowd] HQ is NOT what makes us human! [pleading, voice rising] Who gets to decide that?! [voice trembling, emotional] I don't even understand myself... [crying out, begging] so how can anyone define what it means to be human?!",
 '2':"[pleading, raw emotion] Making mistakes? Feeling emotions? [voice cracking] That's not what humanity is! [heartfelt, urging the crowd] It isn't fixed... [crying out with all her heart] It's something we discover for ourselves!",
}
for take in 'abc':
  for ln,t in lines.items():
    body=json.dumps({'text':t,'model_id':'eleven_v3','voice_settings':{'stability':0.0,'similarity_boost':0.8}}).encode()
    r=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
    try: open(f'take4/jae_{ln}_sarah_{take}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',take,ln)
    except urllib.error.HTTPError as e: print('err',take,ln,e.code,e.read()[:200])
