const source = 'https://t.me/s/Educationiq';
const maxAge = 180000;
let lastGood = null;
let pending = null;

function decode(value) {
  const named = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (raw, key) => {
    if (!key.startsWith('#')) return named[key.toLowerCase()] ?? raw;
    const hex = key[1]?.toLowerCase() === 'x';
    const point = parseInt(key.slice(hex ? 2 : 1),hex ? 16 : 10);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  });
}
function articles(html) {
  const hits = [...html.matchAll(/\bdata-post=["']Educationiq\/(\d{1,12})["']/gi)];
  const items = new Map();
  hits.forEach((hit, i) => {
    const id = hit[1];
    const data = html.slice(hit.index, hits[i+1]?.index ?? html.length);
    const date = data.match(/<time\b[^>]*\bdatetime="([^"]+)"/i)?.[1];
    if (!date || !Number.isFinite(Date.parse(date))) return;
    const message = data.match(/<div\b[^>]*class="[^"]*\btgme_widget_message_text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
    const lines = (message ?? '').split(/<br\s*\/?\s*>/i).map(line =>
      decode(line.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim()
    ).filter(line => /[\u0600-\u06ff]/.test(line) && !line.startsWith('#'));
    const headline = lines.find(line=>line.length>=18);
    const title = headline ? (headline.length>145 ? headline.slice(0,142).trimEnd()+'…' : headline)
      : 'منشور من وزارة التربية العراقية';
    items.set(id,{id,title,date:new Date(date).toISOString(),url:'https://t.me/Educationiq/'+id});
  });
  return [...items.values()].sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,8);
}
async function refresh() {
  const result=await fetch(source,{headers:{'User-Agent':'TahaAndroidNews/1.0','Accept':'text/html'},signal:AbortSignal.timeout(8500)});
  if(!result.ok)throw Error('Source unavailable');
  const html=await result.text();
  const items=articles(html);
  if(!items.length)throw Error('No posts found in official channel preview');
  lastGood={items,checkedAt:new Date().toISOString()};
  return lastGood;
}
const cors={'Access-Control-Allow-Origin':'https://taha20054ta10-prog.github.io','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey','Vary':'Origin'};
const headers={...cors,'Content-Type':'application/json; charset=UTF-8','X-Content-Type-Options':'nosniff'};
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='GET')return new Response(null,{status:405,headers:{...cors,'Allow':'GET, OPTIONS'}});
  let stale=false;
  if(!lastGood || Date.now()-Date.parse(lastGood.checkedAt)>maxAge){
    pending ??= refresh().finally(()=>{pending=null});
    try{await pending;}catch {stale=true;}
  }
  if(!lastGood)return Response.json({items:[],checkedAt:null,source},{status:503,headers});
  return Response.json({...lastGood,source,stale},{headers:{...headers,'Cache-Control':stale?'no-store':'public, max-age=90'}});
});
