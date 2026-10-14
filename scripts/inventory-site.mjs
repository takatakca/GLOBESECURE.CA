import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const HOME = "https://globesecure.ca/";
const HOSTS = new Set(["globesecure.ca","www.globesecure.ca"]);
const SKIP = ["/wp-admin", "/wp-login", "/api/", "/_next/", "/admin", "/login", "/logout", "/cart", "/checkout", "/compte", "/my-account", "/portal"];
const FILE = /\.(?:ico|avif|webp|gif|svg|jpe?g|png|pdf|zip|woff2?|ttf|otf|js|css|xml|json|mp[34])$/i;
export function normalizedUrl(input, base=HOME) {
  if (typeof input !== "string" || !input.trim()) return null;
  try {
    const u = new URL(input.trim(),base);
    if (!["https:","http:"].includes(u.protocol) || !HOSTS.has(u.hostname.toLowerCase()) || u.username || u.password || u.port && !["80","443"].includes(u.port)) return null;
    if (SKIP.some(p=>u.pathname.toLowerCase().startsWith(p)) || FILE.test(u.pathname)) return null;
    return "https://globesecure.ca" + u.pathname.replace(/\/{2,}/g,"/");
  } catch { return null; }
}
function decode(s) {
  const names={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",eacute:"é",egrave:"è",agrave:"à",ccedil:"ç",ecirc:"ê",ugrave:"ù",rsquo:"’",ndash:"–",mdash:"—"};
  return s.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-zA-Z]+);/gi, (whole,k)=>{
    if(k[0]==="#") {const n=k[1]?.toLowerCase()==="x"?parseInt(k.slice(2),16):Number(k.slice(1));return n>0&&n<=1114111&&!(n>=55296&&n<=57343)?String.fromCodePoint(n):whole;}
    return names[k.toLowerCase()]||whole;
  });
}
function plain(html) {
  return decode(html.replace(/<!--[\s\S]*?-->/g," ")
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi," ")
    .replace(/<\/?(?:p|h[1-6]|li|div|section|article|br)\b[^>]*>/gi,"\n")
    .replace(/<[^>]+>/g," ")).replace(/[\t\r ]+/g," ").replace(/\n\s*\n+/g,"\n").trim();
}
export function extractPublicPage(html,url) {
  const title=/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]||"";
  const meta=/<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i.exec(html)?.[0]||"";
  const desc=/content\s*=\s*["']([^"']*)["']/i.exec(meta)?.[1]||"";
  const headings=[...html.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].slice(0,100).map(m=>({level:Number(m[1]),text:plain(m[2]).replace(/\s+/g," ").slice(0,300)}));
  const internalLinks=[...new Set([...html.matchAll(/<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi)].map(m=>normalizedUrl(decode(m[1]),url)).filter(Boolean))];
  const assets=[...new Set([...html.matchAll(/<(?:img|source)\s[^>]*(?:src|srcset)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1].split(",")[0].trim().split(/\s+/)[0]).filter(x=>x.length<800).slice(0,100))];
  const contacts=[...html.matchAll(/href\s*=\s*["']((?:tel:|mailto:)[^"'\s<>]+)["']/gi)]
    .map(m=>m[1].trim()).filter(x=>x.length<250);
  const outbound=[...html.matchAll(/<a\s[^>]*href\s*=\s*["'](https?:\/\/[^"']+)["']/gi)].map(m=>m[1]);
  const externalLinks=[...new Set(outbound.filter(x=>{
    try{return !HOSTS.has(new URL(x).hostname.toLowerCase())}catch{return false}
  }).slice(0,50))];
  const forms=[...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].slice(0,15).map(m=>{
    const action=/action\s*=\s*["']([^"']{1,300})["']/i.exec(m[1])?.[1]||"";
    const method=/method\s*=\s*["']([^"']{1,20})["']/i.exec(m[1])?.[1]||"get";
    const fields=[...m[2].matchAll(/<(?:input|select|textarea)\b([^>]*)>/gi)].slice(0,60).map(f=>({
      name:/name\s*=\s*["']([^"']{1,100})["']/i.exec(f[1])?.[1]||"",
      type:/type\s*=\s*["']([^"']{1,60})["']/i.exec(f[1])?.[1]||"text"
    })).filter(f=>f.name);
    return {action,method:method.toUpperCase(),fields};
  });
  return {url,title:plain(title).replace(/\s+/g," ").slice(0,250),description:decode(desc).slice(0,1000),headings,text:plain(html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi," ")).slice(0,40000),internalLinks,externalLinks,contacts,forms,assets};
}
async function fetchPublic(url) {
  let next=url;
  for(let redirect=0;redirect<5;redirect++){
    const response=await fetch(next,{redirect:"manual",signal:AbortSignal.timeout(15000),headers:{"User-Agent":"GlobeSecureContentInventory/1.0",Accept:"text/html,application/xhtml+xml,application/xml"}});
    if(response.status>=300&&response.status<400){
      const location=response.headers.get("location");
      if(!location) throw Error("Redirect missing Location");
      const u=new URL(location,next);
      if(!HOSTS.has(u.hostname.toLowerCase())||!["https:","http:"].includes(u.protocol)) throw Error("Redirect to another domain refused");
      next=u.href;
      continue;
    }
    if(!response.ok) throw Error("HTTP "+response.status);
    if(Number(response.headers.get("content-length")||0)>3000000) throw Error("Page too large");
    const b=await response.arrayBuffer();
    if(b.byteLength>3000000) throw Error("Page too large");
    return {html:new TextDecoder().decode(b),type:response.headers.get("content-type")||""};
  }
  throw Error("Too many redirects");
}
async function main(){
  const out=resolve("audit/live-site");
  await mkdir(out,{recursive:true});
  const report={source:HOME,capturedAt:new Date().toISOString(),pages:[],errors:[],successful:false};
  const queue=[HOME],visited=new Set();
  try {
    const s=await fetchPublic(HOME+"sitemap.xml");
    for(const m of s.html.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
      const u=normalizedUrl(decode(m[1]));
      if(u&&!queue.includes(u))queue.push(u);
    }
  }catch(e){report.errors.push({url:HOME+"sitemap.xml",error:String(e.message||e)});}
  while(queue.length&&visited.size<50&&report.pages.length<45){
    const url=queue.shift();if(visited.has(url))continue;visited.add(url);
    try{
      const x=await fetchPublic(url);
      if(!/html/i.test(x.type)&&!/<html[\s>]/i.test(x.html.slice(0,1000)))throw Error("Non-HTML response");
      const page=extractPublicPage(x.html,url);report.pages.push(page);
      console.log("PAGE "+report.pages.length+" "+url+" title="+JSON.stringify(page.title)+" headings="+JSON.stringify(page.headings.filter(h=>h.level===1)));
      for(const u of page.internalLinks)if(!visited.has(u)&&!queue.includes(u)&&queue.length<200)queue.push(u);
    }catch(e){const error=String(e.message||e).slice(0,300);report.errors.push({url,error});console.error("FETCH ERROR "+url+" "+error);}
  }
  report.successful=report.pages.some(p=>p.url===HOME);
  await writeFile(out+"/inventory.json",JSON.stringify(report,null,2)+"\n");
  console.log("RESULT pages="+report.pages.length+" errors="+report.errors.length+" successful="+report.successful);
  if(!report.successful)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await main();
