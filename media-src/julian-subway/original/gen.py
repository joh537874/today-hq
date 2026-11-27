import os, json, urllib.request, sys
key=os.environ['ELEVENLABS_API_KEY']
J={'liam':'TX3LPaxmHKxFdv7VOQHJ','harry':'SOYHLrjzK2X1ezoPC6cr','callum':'N2lVS1w4EtoT3dr4eOWO'}
N={'alice':'Xb7hH8MSUJpSbSDYk0k2','river':'SAz9YHcvj6GT2YYXdXww','matilda':'XrExE9yKIg1WjnnlVkGX'}
JL={'j1':"[surprised, warm at first] Jin! Long time no see. [hesitates, eyes narrowing] But who's that beside you...?",
    'j2':"[cold, slow] ...I remember. [suspicious, a little contempt] But I don't recall your HQ being this high.",
    'j3':"[low, disbelieving] Jin, are you serious? [contemptuous, rising irritation] You're not even uncomfortable with this pile of scrap metal pretending to be human... [scoffs] and getting above its station?"}
NL={'n1':"[calm, polite, evenly paced] Hello, Julian. It's been a while. You may not remember me, but I'm Nyin, Jin's AI assistant.",
    'n2':"[calm, polite, faintly proud smile] As you know, I receive updates every day. It's only natural that I'm becoming more human-like."}
def tts(vid,text,out):
    body=json.dumps({'text':text,'model_id':'eleven_v3','voice_settings':{'stability':0.5}}).encode()
    r=urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{vid}',body,{'xi-api-key':key,'Content-Type':'application/json','User-Agent':'curl/8.7.1'})
    open(out,'wb').write(urllib.request.urlopen(r).read()); print(out)
for n,v in J.items():
    for k,t in JL.items(): tts(v,t,f'vo/{k}_{n}.mp3')
for n,v in N.items():
    for k,t in NL.items(): tts(v,t,f'vo/{k}_{n}.mp3')
