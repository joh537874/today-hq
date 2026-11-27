import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']
J={'will':'bIHbv24MWmeRgasZH58o','apollo':'xsfFw9plbX0VhNMhHgl1','chris':'iP95p4xoKVk53GoZ742B'}
JL={'j1':"Jin! Long time no see. [pause] But who's that next to you...?",
    'j2':"[flat] ...Yeah, I remember. [dry] But I don't remember your HQ being this high.",
    'j3':"[quiet, frowning] Jin, are you serious? [annoyed] A pile of scrap metal pretending to be human, getting above itself... and that doesn't bother you?"}
def tts(vid,text,out):
    body=json.dumps({'text':text,'model_id':'eleven_v3','voice_settings':{'stability':0.5}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}',body,{'xi-api-key':key,'Content-Type':'application/json','User-Agent':'curl/8.7.1'})
    open(out,'wb').write(urllib.request.urlopen(r).read())
for n,v in J.items():
    for k,t in JL.items(): tts(v,t,f'vo/{k}_{n}.mp3')
