import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']; V='iP95p4xoKVk53GoZ742B'
L={'j2':"[flat] ...Yeah, I remember. [short scoff] Huh. [dry] But I don't remember your HQ being this high.",
   'j3':"[quiet, frowning] Jin... are you serious? [short disbelieving laugh] Ha. [annoyed, low] A pile of scrap metal pretending to be human, getting above itself... [sighs] and that doesn't bother you?"}
for t in 'abc':
  for k,txt in L.items():
    body=json.dumps({'text':txt,'model_id':'eleven_v3','voice_settings':{'stability':0.5}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{V}',body,{'xi-api-key':key,'Content-Type':'application/json','User-Agent':'curl/8.7.1'})
    open(f'take2/{k}_{t}.mp3','wb').write(urllib.request.urlopen(r).read())
