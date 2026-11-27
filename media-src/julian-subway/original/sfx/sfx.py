import os, json, urllib.request
key=os.environ['ELEVENLABS_API_KEY']
jobs={
 'ride':("Interior of a modern, quiet subway car moving at a steady speed at night: low smooth rumble, soft rhythmic wheel clicks on rails, gentle ventilation hum. No announcements, no voices, no music. Realistic field recording.",22),
 'station':("Interior of a subway car stopped at a station with the doors open: quiet hum of the train, faint echoing platform ambience, very distant footsteps. No voices, no announcements, no music.",10),
 'door':("Subway train doors closing: a short two-tone electronic chime, then a soft pneumatic hiss and the doors sliding shut with a muffled thud. Heard from inside the car.",4),
 'depart':("Subway train starting to move from the station, heard from inside the car: electric motor whine rising smoothly, rumble building up, wheels beginning to click. No voices, no music.",8),
}
for n,(t,d) in jobs.items():
  body=json.dumps({'text':t,'duration_seconds':d,'prompt_influence':0.5}).encode()
  r=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation',body,{'xi-api-key':key,'Content-Type':'application/json','User-Agent':'curl/8.7.1'})
  try: open(f'{n}.mp3','wb').write(urllib.request.urlopen(r).read()); print('ok',n)
  except urllib.error.HTTPError as e: print('err',n,e.code,e.read()[:200])
