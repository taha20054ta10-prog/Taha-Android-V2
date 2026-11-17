/* Taha Android analytics. Add a real GA4 measurement ID to enable collection. */
(()=>{
 const measurementId=''; // GA4 ID: G-XXXXXXXXXX; never insert invented IDs
 if(!/^G-[A-Z0-9]+$/.test(measurementId))return;
 window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('config',measurementId,{send_page_view:true});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);document.head.append(script);
 document.addEventListener('click',e=>{
   const a=e.target.closest('a[href]');if(!a)return;
   let url;try{url=new URL(a.href,location.href)}catch{return}
   const label=(a.textContent||'').trim().slice(0,100);
   const isPdf=/\\.pdf(?:$|[?#])|drive\\.google\\.com\\/file\\/d\\//i.test(url.href);
   const isDownload=/\\.(apk|zip)(?:$|[?#])/i.test(url.pathname)||/تحميل|تنزيل|download/i.test(label);
   if(isPdf)window.gtag('event','pdf_open',{file_name:label,link_url:url.href});
   else if(isDownload)window.gtag('event','download_click',{item_name:label,link_url:url.href});
   else if(url.origin!==location.origin)window.gtag('event','outbound_click',{link_url:url.href});
 });
 document.addEventListener('click',e=>{
   const a=e.target.closest('#library-results .library-book a');if(a)window.gtag('event','pdf_open',{file_name:a.closest('.library-book')?.querySelector('h3')?.textContent||'PDF',link_url:a.href});
 });
})();
