from PIL import Image, ImageDraw, ImageFont
import json
F='/Users/johyojin/Library/Fonts/'
ko=ImageFont.truetype(F+'Pretendard-Medium.otf',30)
en=ImageFont.truetype(F+'Pretendard-Regular.otf',19)
P=[
 (0.5,3.9,["진! 오랜만이야."],"Jin! Long time no see."),
 (4.0,6.4,["근데 옆에 있는…."],"But who's that next to you...?"),
 (8.25,11.05,["안녕하세요, 줄리안. 오랜만이군요."],"Hello, Julian. It's been a while."),
 (11.1,15.0,["기억하실지 모르겠지만,","저는 진의 AI 비서 나인입니다."],"You may not remember me, but I'm Nyin, Jin's AI assistant."),
 (15.9,18.35,["…기억하지."],"...Yeah, I remember."),
 (18.4,21.0,["근데 HQ가 이렇게 높진 않았던 걸로 기억해서."],"But I don't remember your HQ being this high."),
 (21.4,23.85,["아시다시피, 저는 매일 업데이트를 하거든요."],"As you know, I receive updates every day."),
 (23.9,27.0,["점점 더 인간다워지는 것이 놀라운 일은 아니죠."],"It's only natural that I'm becoming more human-like."),
 (28.4,32.7,["진, 진심이야?"],"Jin, are you serious?"),
 (32.8,37.85,["인간을 모방한 고철 덩어리가","주제도 모르고 기어오르는데"],"A pile of scrap metal pretending to be human, getting above itself..."),
 (37.9,40.1,["넌 불쾌하지도 않아?"],"...and that doesn't bother you?"),
]
meta=[]
for i,(a,b,kl,e) in enumerate(P):
  im=Image.new('RGBA',(1920,1080),(0,0,0,0)); d=ImageDraw.Draw(im)
  ys=[900,940] if len(kl)==2 else [940]
  for y,t in zip(ys,kl):
    w=d.textlength(t,font=ko); d.text(((1920-w)/2,y),t,font=ko,fill=(255,255,255,255))
  w=d.textlength(e,font=en); d.text(((1920-w)/2,995),e,font=en,fill=(200,200,200,190))
  im.save(f'final/sub{i:02d}.png'); meta.append((a,b))
json.dump(meta,open('final/subs.json','w'))
print(len(meta))
