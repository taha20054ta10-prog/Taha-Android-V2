#!/usr/bin/env python3
"""Generate individual illustrated PNG book covers for all published catalog items."""
import json, re, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'library.js').read_text(encoding='utf-8')
items=json.loads(re.search(r'const files=(\[.*?\])\s*\n\s*let type=',js,re.S).group(1))
OUT=ROOT/'covers'/'catalog'
OUT.mkdir(parents=True,exist_ok=True)
W,H=600,840
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def ft(n,b=True):return ImageFont.truetype(bold if b else font,n)
def txt(d,xy,s,size=30,fill='white',b=True):
    d.text(xy,str(s),font=ft(size,b),fill=fill,anchor='mm',direction='rtl' if re.search('[\u0600-\u06ff]',str(s)) else 'ltr',stroke_width=1 if size>28 else 0,stroke_fill='#10285d')
def subject(t):
    for k in ['الرياضيات','رياضيات','الفيزياء','الكيمياء','الأحياء','العلوم','القراءة','اللغة العربية','الإنكليزي','الانكليزي','الانجليزي','الاسلامية','الإسلامية','التاريخ','الجغرافية','الاجتماعيات','الحاسوب','الفرنسي','الكردي','القرآن']:
        if k in t:return k
    return re.sub(r'^(كتاب|ملزمة)\s*','',t).split(' للصف')[0][:23]
def illustration(d,t):
    rng=random.Random(sum(ord(c) for c in t))
    # Detailed illustrated center medallion and distinct subject iconography.
    d.ellipse((110,347,490,705),fill='#085caa',outline='#bcefff',width=7)
    d.ellipse((127,365,473,687),outline='#f5ce71',width=4)
    if 'رياضيات' in t:
        d.polygon([(178,624),(309,407),(424,624)],outline='#ffda79',width=12)
        d.ellipse((277,433,452,609),outline='#c5f9ff',width=10)
        txt(d,(368,520),'π',100,'#fff2a5')
        for x in range(190,430,30):d.line((x,628,x,640),fill='#ffe5a4',width=5)
    elif 'كيمياء' in t or 'علوم' in t:
        for x,y,c in [(175,465,'#b9f7ff'),(330,438,'#f2a6e6'),(255,535,'#ffe3a3')]:
            d.polygon([(x-22,y-65),(x+22,y-65),(x+22,y+2),(x+64,y+90),(x-64,y+90),(x-22,y+2)],fill='#176da9',outline='#f7e6aa',width=7)
            d.ellipse((x-44,y+45,x+44,y+72),fill=c)
    elif 'فيزياء' in t:
        for ang in [0,60,120]:
            layer=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(layer)
            ld.ellipse((175,448,425,594),outline='#d6f9ff',width=10)
            layer=layer.rotate(ang,center=(300,520))
            global_img.alpha_composite(layer)
        d.ellipse((266,486,334,554),fill='#ffd977')
    elif 'أحياء' in t:
        for y in range(410,625,24):
            x=300+85*math.sin(y/47)
            x2=300-85*math.sin(y/47)
            d.line((x,y,x2,y),fill='#c5f8ef',width=8)
            d.ellipse((x-12,y-12,x+12,y+12),fill='#f8d578')
            d.ellipse((x2-12,y-12,x2+12,y+12),fill='#a7f9ff')
    elif any(k in t for k in ['إنكليزي','انكليزي','انجليزي','فرنسي','كردي']):
        d.rounded_rectangle((171,424,429,613),radius=22,fill='#0b2c69',outline='#ffe39b',width=9)
        txt(d,(300,494),'Aa',95,'#fff6c8')
        txt(d,(300,570),'English' if 'نكليزي' in t else 'Languages',32,'#b8f5ff')
    elif any(k in t for k in ['تاريخ','جغراف','اجتماع']):
        d.ellipse((176,407,424,655),fill='#128ac3',outline='#ffde96',width=11)
        d.arc((197,426,403,636),80,290,fill='#c5ffc9',width=21)
        d.line((180,530,420,530),fill='#c9f7ff',width=5)
        d.line((300,410,300,651),fill='#c9f7ff',width=5)
    else:
        d.polygon([(155,440),(265,412),(300,442),(335,412),(445,440),(445,625),(337,595),(300,629),(263,595),(155,625)],fill='#f4e6c5')
        d.line((300,445,300,625),fill='#2774ad',width=8)
        for y in [475,507,539,571]:
            d.line((175,y,265,y-12),fill='#5796b9',width=5)
            d.line((335,y-12,425,y),fill='#5796b9',width=5)
        txt(d,(300,531),'ض' if any(k in t for k in ['قراءة','عربي']) else '✦',67,'#13538e')
    for i in range(35):
        x=rng.randint(75,530);y=rng.randint(340,690)
        if not (145<x<455 and 395<y<660):
            d.ellipse((x,y,x+3,y+3),fill='#b4f8ff')
grades=['','الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي','الأول المتوسط','الثاني المتوسط','الثالث المتوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي','الرابع الأدبي','الخامس الأدبي','السادس الأدبي']
for i,f in enumerate(items):
    global_img=Image.new('RGBA',(W,H))
    px=global_img.load()
    for y in range(H):
        for x in range(W):
            v=x/W*0.24+y/H*0.45
            px[x,y]=(int(19+68*(1-v)),int(130+91*(1-v)),int(230-113*v),255)
    d=ImageDraw.Draw(global_img)
    for offset in range(0,160,24):
        d.arc((-210+offset,-140,760+offset,610),10,110,fill=(153,240,255,110),width=6)
    d.rounded_rectangle((20,20,580,820),radius=22,outline='#ffe4a0',width=11)
    # Iraqi flag motif, no claim of official ministry affiliation
    d.rectangle((36,36,168,62),fill='#d92535')
    d.rectangle((36,62,168,88),fill='white')
    d.rectangle((36,88,168,114),fill='#101820')
    txt(d,(102,75),'الله أكبر',17,'#218c4b')
    txt(d,(370,69),'طه أندرويد',30)
    txt(d,(370,108),'Taha Android',23)
    d.rounded_rectangle((42,153,558,289),radius=30,fill='#081b4c',outline='#ffce70',width=8)
    name=subject(f['title'])
    txt(d,(300,208),name[:26],39 if len(name)<16 else 29)
    txt(d,(300,264),{'book':'كتاب دراسي','notes':'ملزمة دراسية','exams':'أسئلة وزارية'}.get(f['type'],'مادة دراسية'),24,'#ffdf8e')
    g=int(f['grade']);txt(d,(300,331),grades[g] if g<len(grades) else 'المرحلة الدراسية',29)
    illustration(d,name)
    d.rounded_rectangle((39,721,561,807),radius=35,fill='#091d51',outline='#f7c76b',width=8)
    txt(d,(300,753),'المصمم والمبرمج',20)
    txt(d,(300,785),'طه علي الازيرجاوي',27)
    global_img.convert('RGB').save(OUT/f'{i:03d}.jpg',quality=84,optimize=True)
print(f'Created {len(items)} individual cover images in {OUT}')
