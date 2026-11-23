(function(){"use strict";
document.querySelectorAll("[data-video]").forEach(function(box){const id=box.getAttribute("data-video");if(!/^[A-Za-z0-9_-]{11}$/.test(id||""))return;const button=box.querySelector("button");if(!button)return;button.addEventListener("click",function(){const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+id+"?rel=0&autoplay=1";frame.title=box.getAttribute("data-title")||"محاضرة تعليمية";frame.setAttribute("allow","autoplay; encrypted-media; picture-in-picture");frame.setAttribute("allowfullscreen","");frame.loading="lazy";box.replaceChildren(frame)},{once:true})});
const gradeLinks={"four-primary":"https://vid.haltaelam.com/d4pr/","five-primary":"https://vid.haltaelam.com/d5pr/","six-primary":"https://vid.haltaelam.com/d6pr/","one-middle":"https://vid.haltaelam.com/d1sc/","two-middle":"https://vid.haltaelam.com/d2sc/","three-middle":"https://vid.haltaelam.com/d3sc/","four-scientific":"https://vid.haltaelam.com/d4alm/","four-literary":"https://vid.haltaelam.com/d4ad/","five-scientific":"https://vid.haltaelam.com/d5alm/","five-literary":"https://vid.haltaelam.com/d5ad/","six-scientific":"https://vid.haltaelam.com/d6alm/","six-literary":"https://vid.haltaelam.com/d6ad/"};
const direct={};
const verifiedSources={
"four-primary":{code:"4pr",part:"primary"},"five-primary":{code:"5pr",part:"primary"},"six-primary":{code:"6pr",part:"primary"},
"one-middle":{code:"1sc",part:"middle"},"two-middle":{code:"2sc",part:"middle"},"three-middle":{code:"3sc",part:"middle"},
"four-scientific":{code:"4al",part:"scientific"},"five-scientific":{code:"5al",part:"scientific"},"six-scientific":{code:"6al",part:"scientific"},
"four-literary":{code:"4ad",part:"literary"},"five-literary":{code:"5ad",part:"literary"},"six-literary":{code:"6ad",part:"literary"}
};
const prefixes={
primary:{islamic:"isd",arabic:"qod",english:"end",science:"scd",math:"mad",social:"igd"},
middle:{islamic:"isd",arabic:"ard",english:"end",math:"mad",biology:"bid",chemistry:"chd",physics:"pyd",social:"igd",computer:"cod"},
scientific:{islamic:"isd",arabic:"ard",english:"end",math:"mad",biology:"bid",chemistry:"chd",physics:"pyd"},
literary:{islamic:"isd",arabic:"ard",english:"end",math:"mad",history:"hsd",geography:"god",economics:"ecd"}
};
for(const [gradeKey,setting] of Object.entries(verifiedSources)){
 for(const [subject,prefix] of Object.entries(prefixes[setting.part])){
   if(gradeKey==="three-middle"&&subject==="computer")continue;
   if(gradeKey==="four-literary"&&subject==="economics")continue;
   direct[gradeKey+"-"+subject]="https://vid.haltaelam.com/"+prefix+setting.code+"/";
 }
}
const p=location.pathname.split("/").pop()||"";
const m=p.match(/^study-(.+)-(math|arabic|english|science|social|islamic|physics|chemistry|biology|computer|history|geography|economics)\.html$/);
if(m){const key=m[1],subject=m[2];const exact=direct[key+"-"+subject];const external=exact||gradeLinks[key];const main=document.querySelector("main");if(main&&external){const section=document.createElement("section");section.className="video";section.setAttribute("aria-label","فيديوهات مرتبطة بالمادة");const h=document.createElement("h2");h.textContent="🎬 فصول الفيديو من مصادر المدرسين";const para=document.createElement("p");para.textContent=exact?"تم العثور على فهرس فيديوهات منشور لهذه المادة والمرحلة. اختر الفصل المناسب من المصدر قبل المشاهدة.":"لم نعثر بعد على فهرس فيديو مثبت خاص بهذه المادة؛ افتح فهرس الصف الخارجي واختر المادة والفصل. هذا ليس فيديو مطابقاً معتمداً لكل درس.";const a=document.createElement("a");a.href=external;a.target="_blank";a.rel="noopener noreferrer";a.textContent=exact?"📺 افتح فيديوهات هذه المادة مرتبة حسب الفصول":"📚 اختر المادة والفصل من دليل فيديوهات الصف";section.append(h,para,a);const first=main.querySelector(".lesson");if(first)main.insertBefore(section,first);else main.prepend(section)}}
})();