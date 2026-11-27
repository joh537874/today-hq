import os, json, urllib.request, sys
key=os.environ['ELEVENLABS_API_KEY']
jobs={
 'amb_plaza':("Outdoor city plaza ambience on a cold overcast winter day: steady distant traffic hum, many footsteps on concrete walking at a normal pace, faint indistinct crowd murmur, occasional distant car horn far away. Realistic field recording, no music.",14),
 'car_pass':("A single car passing by on a city street at medium distance, smooth tire hiss on asphalt, realistic, outdoor field recording.",6),
}
for name,(text,dur) in jobs.items():
  body=json.dumps({'text':text,'duration_seconds':dur,'prompt_influence':0.5}).encode()
  r=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',data=body,headers={'xi-api-key':key,'Content-Type':'application/json'})
  try: open(f'{name}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',name)
  except urllib.error.HTTPError as e: print('err',name,e.code,e.read()[:200])
