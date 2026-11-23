/* Third-primary verified external educational sources; no guessed YouTube IDs. */
(function(){"use strict";
const chapterNames=["التغذية عند النباتات والفطريات","التغذية عند الحيوانات","موارد البيئة","المحافظة على البيئة","القياس","المخاليط غير المتجانسة","الضوء","الحرارة","الصخور والتربة","المعادن"];
const subjects={"grade-three-reading.html":{title:"قراءتي الثالث الابتدائي",url:"https://vid.haltaelam.com/qrd3pr/"},"grade-three-english.html":{title:"إنكليزي الثالث الابتدائي",url:"https://vid.haltaelam.com/end3pr/"},"grade-three-science.html":{title:"علوم الثالث الابتدائي",url:"https://vid.haltaelam.com/scd3pr/"}};
const path=location.pathname.split("/").pop()||"";
const science=path.match(/^grade-three-science-lesson-(\d\d)\.html$/);
const reading=path.match(/^grade-three-reading-lesson-(\d\d)\.html$/);
const eng=path.match(/^grade-three-english-lesson-(\d\d)\.html$/);
function add(parent,title,url,extra){if(!parent)return;const box=document.createElement("section");box.className="taha-grade3-source";box.style.cssText="margin:15px 0;padding:16px;border-radius:12px;background:#0c2740;border:1px solid #488c9e;color:#eef9ff";const h=document.createElement("h3");h.textContent="🎬 "+title;h.style.cssText="margin:0 0 7px;color:#ffe2a4";const p=document.createElement("p");p.textContent=extra||"دروس الفيديو منشورة من قنوات مدرسين خارجية، وتُراجع مطابقتها لعنوان الدرس والطبعة.";const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="افتح الفيديوهات من المصدر الأصلي";a.style.color="#ffe2a4";box.append(h,p,a);parent.prepend(box)}
if(subjects[path]){const x=subjects[path];add(document.querySelector("main"),"فيديوهات "+x.title,x.url)}
if(science){const n=Number(science[1]);const ends=[2,4,6,8,10,12,15,17,19,21];const chapter=ends.findIndex(end=>n<=end);if(chapter>=0)add(document.querySelector("main"),"الفصل "+(chapter+1)+" – "+chapterNames[chapter],"https://vid.haltaelam.com/scd3pr/","فهرس فيديوهات العلوم حسب الفصل؛ اضغط على الدرس الذي يطابق موضوعك. الفيديو ليس من إنتاج طه أندرويد.")}
if(reading)add(document.querySelector("main"),"قراءتي – الدرس "+Number(reading[1]),"https://vid.haltaelam.com/qrd3pr/");
if(eng)add(document.querySelector("main"),"الإنكليزي – الدرس "+Number(eng[1]),"https://vid.haltaelam.com/end3pr/");
const container=(science&&Number(science[1])===1)?document.querySelector("main"):path==="grade-three-science.html"?document.getElementById("chapter-1"):null;
if(container){const id="ElY8dNmIUVE";const a=document.createElement("a");a.href="https://www.youtube.com/watch?v="+id;a.target="_blank";a.rel="noopener noreferrer";a.textContent="▶ شرح التغذية عند النباتات – علوم الثالث الابتدائي على يوتيوب";a.style.cssText="display:block;padding:10px;background:#18334a;color:#ffe3a6;border-radius:8px;margin:10px 0";container.append(a)}
})();
// Show lesson-by-lesson illustrated walkthroughs without claiming to host teacher videos.
(function(){if(!document.querySelector('article.lesson,article.less,section.topic,article.letter'))return;const s=document.createElement('script');s.src='study-slides.js?v=1';s.defer=true;document.head.append(s)})();
