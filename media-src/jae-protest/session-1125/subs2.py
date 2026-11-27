from PIL import Image, ImageDraw, ImageFont
F='/Users/johyojin/Library/Fonts/'
ko=ImageFont.truetype(F+'Pretendard-Medium.otf',30)
en=ImageFont.truetype(F+'Pretendard-Regular.otf',19)
pages=[
 (["실수를 하면? 감정을 느끼면?","그게 인간다움이 아닙니다!"],"Making mistakes? Feeling emotions? That's not what humanity is!"),
 (["인간다움은 정해져 있지 않습니다.","우리가 스스로 찾아가는 것입니다!"],"It isn't fixed... It's something we discover for ourselves!"),
]
for i,(kl,e) in enumerate(pages,3):
  im=Image.new('RGBA',(1920,1080),(0,0,0,0)); d=ImageDraw.Draw(im)
  for y,t in zip([900,940],kl):
    w=d.textlength(t,font=ko); d.text(((1920-w)/2,y),t,font=ko,fill=(255,255,255,255))
  w=d.textlength(e,font=en); d.text(((1920-w)/2,995),e,font=en,fill=(200,200,200,190))
  im.save(f'final/sub{i}.png')
