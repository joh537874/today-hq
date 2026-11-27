from PIL import Image, ImageDraw, ImageFont
import sys
F='/Users/johyojin/Library/Fonts/'
ko=ImageFont.truetype(F+'Pretendard-Medium.otf',30)
en=ImageFont.truetype(F+'Pretendard-Regular.otf',19)
pages=[
 (["HQ는 인간다움이 아닙니다!","그걸 누가 정하죠?!"],"HQ is NOT what makes us human! Who gets to decide that?!"),
 (["나조차 나를 모르는데,","누가 인간다움을 규정할 수 있단 말입니까?!"],"I don't even understand myself... so how can anyone define what it means to be human?!"),
]
for i,(kl,e) in enumerate(pages,1):
  im=Image.new('RGBA',(1920,1080),(0,0,0,0)); d=ImageDraw.Draw(im)
  ys=[900,940]
  for y,t in zip(ys,kl):
    w=d.textlength(t,font=ko); d.text(((1920-w)/2,y),t,font=ko,fill=(255,255,255,255))
  w=d.textlength(e,font=en); d.text(((1920-w)/2,995),e,font=en,fill=(200,200,200,190))
  im.save(f'sub{i}.png')
# 하단 그라데이션(자막 가독성)
g=Image.new('RGBA',(1920,1080),(0,0,0,0)); d=ImageDraw.Draw(g)
for y in range(760,1080):
  a=int(150*((y-760)/320)**1.6); d.line([(0,y),(1920,y)],fill=(0,0,0,a))
g.save('grad.png')
