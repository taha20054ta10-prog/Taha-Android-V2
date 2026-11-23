/* Third primary – verified third-party videos. Credit the original creators, load only after click. */
(function(){
"use strict";
const chapterVideos={
  1:{id:"gvs72uNVOT0",title:"النبات يصنع غذاءه",channel:"قناة مناهجنا التعليمية",lesson:1},
  2:{id:"sh4Tu_VWfIc",title:"طرائق التغذية عند الحيوانات",channel:"التعليمية زيد الرسام",lesson:3},
  3:{id:"H7lN0K9WQP8",title:"موارد البيئة الطبيعية",channel:"نوافذ التعلم المنزلي",lesson:5},
  4:{id:"cBKlwnQ0vmw",title:"ترشيد الاستهلاك وإعادة الاستخدام",channel:"الأستاذ عبدالرضا يوسف",lesson:7},
  5:{id:"GtmeowBjvAg",title:"القياس والطول",channel:"مقهى العلم",lesson:9},
  6:{id:"vmTm_AAZsrU",title:"مخلوط صلب مع صلب",channel:"الأستاذ عبدالرضا يوسف",lesson:11},
  7:{id:"FJNLwwI8Sg8",title:"انعكاس الضوء",channel:"قناة مناهجنا التعليمية",lesson:14},
  8:{id:"5Lp-GuKiXGU",title:"انتقال الحرارة بالتوصيل",channel:"دوحة التعلم",lesson:16},
  9:{id:"5-_RjbZBRzk",title:"الصخور",channel:"الأستاذ عبدالرضا يوسف",lesson:18},
  10:{id:"-z0_ejfxnBg",title:"استخدامات المعادن",channel:"المدرسة العراقية الألمانية – البصرة",lesson:21}
};
const readingVideos={
  1:{id:"wma2ozRrkHE",title:"الذهاب إلى المدرسة",channel:"مدرسة بلادي الابتدائية الأهلية المختلطة"},
  3:{id:"jhZiRIwiI7A",title:"عامل النظافة",channel:"العراق Kids التربوية"}
};
const englishVideo={id:"C0GCuiuieZc",title:"English for Iraq – Unit 1 Lesson 1: Hello",channel:"الأستاذ طه نعمت"};
const englishPlaylist="https://www.youtube.com/playlist?list=PLNSYFG5Ynsw_GbZe2CiVRnqrWUGPxoOiR";
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e}
function block(video,kind){
const d=el("div","taha-chapter-video");d.style.cssText="margin:15px 0;padding:15px;background:#091d32;border:1px solid #4e8e9f;border-radius:14px;color:#eef8ff";
const title=el("h3",null,"🎬 فيديو شرح مرتبط بـ "+kind);title.style.cssText="margin:0 0 5px;color:#ffe19f";d.append(title);
d.append(el("p",null,video.title+" — المصدر: "+video.channel+" (قناة مستقلة عن طه أندرويد)"));
const cover=el("div","taha-chapter-video-cover");cover.style.cssText="position:relative;max-width:620px;aspect-ratio:16/9;background:#09111f;border-radius:12px;overflow:hidden";
const btn=el("button",null,"▶ تشغيل الشرح داخل الصفحة");btn.type="button";btn.style.cssText="position:absolute;inset:0;display:grid;place-items:center;width:100%;height:100%;border:0;background:linear-gradient(#071b2a55,#071b2acc),url('https://i.ytimg.com/vi/"+video.id+"/hqdefault.jpg') center/cover;color:#fff;text-shadow:1px 2px 5px #000;font-weight:900;font-size:clamp(1rem,3vw,1.4rem);cursor:pointer";
btn.addEventListener("click",function(){const iframe=el("iframe");iframe.src="https://www.youtube-nocookie.com/embed/"+video.id+"?rel=0&autoplay=1";iframe.title="شرح "+video.title+" — "+video.channel;iframe.loading="lazy";iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";iframe.setAttribute("allowfullscreen","");iframe.style.cssText="width:100%;height:100%;border:0";cover.replaceChildren(iframe)}, {once:true});
cover.append(btn);d.append(cover);
const link=el("a",null,"فتح فيديو المدرّس الأصلي على يوتيوب");link.href="https://www.youtube.com/watch?v="+video.id;link.target="_blank";link.rel="noopener noreferrer";link.style.cssText="display:inline-block;margin-top:10px;color:#ffe19f;text-decoration:underline";d.append(link);
return d
}
function insertNear(parent,video,label){if(!parent||!video)return;const videoBlock=block(video,label);const h=parent.querySelector("h2, h3");if(h)h.insertAdjacentElement("afterend",videoBlock);else parent.prepend(videoBlock)}
const path=(location.pathname.split("/").pop()||"").toLowerCase();
if(path==="grade-three-science.html"){
for(const [n,video] of Object.entries(chapterVideos)){const section=document.getElementById("chapter-"+n);if(section)insertNear(section,video,"الفصل "+n)}
}
const science=path.match(/^grade-three-science-lesson-(\d\d)\.html$/);
if(science){const lesson=Number(science[1]);const ends=[2,4,6,8,10,12,15,17,19,21];const chapter=ends.findIndex(end=>lesson<=end)+1;const video=chapterVideos[chapter];if(video){const main=document.querySelector("main");const card=block(video,video.lesson===lesson?"موضوع هذا الدرس":"الفصل "+chapter+" (فيديو تمهيدي، ليس نفس عنوان الدرس)");if(main){const first=main.querySelector(".lesson");if(first)first.insertAdjacentElement("beforebegin",card);else main.prepend(card)}}}
if(path==="grade-three-reading.html"){
const cards=document.querySelectorAll("section.grid .card");for(const [idx,video] of Object.entries(readingVideos)){const c=cards[Number(idx)-1];if(c)c.append(block(video,"موضوع القراءة"))}
}
const reading=path.match(/^grade-three-reading-lesson-(\d\d)\.html$/);if(reading){const video=readingVideos[Number(reading[1])];if(video){const lesson=document.querySelector("main .lesson");if(lesson)lesson.insertAdjacentElement("beforebegin",block(video,"موضوع القراءة"))}}
if(path==="grade-three-english.html"){
const unit=document.getElementById("unit-1");if(unit)insertNear(unit,englishVideo,"الوحدة الأولى – الدرس الأول");
const info=document.querySelector("main .info");if(info){const p=el("p");const a=el("a",null,"قائمة تشغيل فيديوهات إنكليزي الثالث الابتدائي على يوتيوب (مصدر خارجي)");a.href=englishPlaylist;a.target="_blank";a.rel="noopener noreferrer";p.append(a);info.append(p)}
}
if(path==="grade-three-english-lesson-01.html"){const first=document.querySelector("main .lesson");if(first)first.insertAdjacentElement("beforebegin",block(englishVideo,"الوحدة الأولى – التحية"))}
if(/^grade-three-english-lesson-\d\d\.html$/.test(path)){const main=document.querySelector("main");if(main){const p=el("p","info");const a=el("a",null,"قائمة فيديوهات شرح منهج إنكليزي الثالث على يوتيوب – لا يعني أن كل فيديو يطابق تماريننا");a.href=englishPlaylist;a.target="_blank";a.rel="noopener noreferrer";p.append(a);main.append(p)}}
})();