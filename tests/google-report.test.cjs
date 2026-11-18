const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{constructor(){this.children=[];this.value='';this.events={}}replaceChildren(...v){this.children=v}append(...v){this.children.push(...v)}addEventListener(k,f){this.events[k]=f}}
async function scenario({configured=true,granted=true,denied=false}={}){
 const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id)};get('report-start').value='2026-11-13';get('report-end').value='2026-11-19';
 const calls=[];let oauthConfig;
 const row={metricValues:[{value:'4'},{value:'2'},{value:'7'},{value:'12'},{value:'3'},{value:'.5'}]};
 const mock={accounts:{oauth2:{initTokenClient(c){oauthConfig=c;return{requestAccessToken(){c.callback({access_token:'test-ephemeral-token',expires_in:3600})}}},hasGrantedAllScopes(){return granted}}}};
 const ctx={Intl,Date,AbortController,setTimeout,clearTimeout,setInterval(){},document:{hidden:false,getElementById:get,createElement(){return new Element()}},TAHA_GOOGLE_REPORT:{clientId:configured?'test-public-client':'',propertyId:'565112535'},google:mock,fetch:async(url,opt)=>{calls.push({url,opt});return{ok:!denied,status:denied?403:200,json:async()=>denied?{error:{message:'Access denied'}}:url.endsWith('batchRunReports')?{reports:[{rows:[row],metadata:{timeZone:'Asia/Baghdad'}},{rows:[]},{rows:[]},{rows:[]}]}:{rows:[{metricValues:[{value:'1'}]}]}}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../google-owner-report.js'),'utf8'),ctx);
 await get('google-connect').events.click();assert.equal(calls.length,0,'logged out must never request data');
 ctx.TahaGoogleReports.open();await get('google-connect').events.click();await new Promise(setImmediate);
 if(!configured||!granted){assert.equal(calls.length,0);return}
 assert.equal(oauthConfig.scope,'https://www.googleapis.com/auth/analytics.readonly');assert.equal(oauthConfig.include_granted_scopes,false);assert.equal(calls[0].opt.headers.Authorization,'Bearer test-ephemeral-token');
 const body=JSON.parse(calls[0].opt.body);assert.equal(body.requests.length,4);assert.equal(body.requests[0].dateRanges[0].startDate,'2026-11-13');
 if(denied){assert.equal(get('google-summary').children.length,0);assert(get('google-report-status').textContent.includes('Access denied'))}
 else{assert.equal(get('google-summary').children.length,6);assert(get('google-realtime').textContent.includes('١'))}
 ctx.TahaGoogleReports.close();assert.equal(get('google-summary').children.length,0);const before=calls.length;await get('google-refresh').events.click();assert.equal(calls.length,before);
}
(async()=>{await scenario();await scenario({configured:false});await scenario({granted:false});await scenario({denied:true});console.log('PASS: GA owner gate, read-only scope, date payload, success/denial, no setup traffic and logout cleanup')})().catch(e=>{console.error(e);process.exitCode=1});
