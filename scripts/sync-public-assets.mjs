import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const origin="https://globesecure.ca";
const names=["logo.jpeg","globe1.jpeg","globe2.jpeg","event-security.jpeg","contruction.jpeg","hospital.jpeg","corporate.jpeg","retail.jpeg","alarm.jpeg"];
await mkdir("public/original-site",{recursive:true});
await mkdir("audit/live-site",{recursive:true});
const results=[];
for(const name of names){
  try{
    const url=origin+"/"+name;
    const r=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error("HTTP "+r.status);
    const type=r.headers.get("content-type")||"";
    if(!/^image\/jpeg(?:;|$)/i.test(type))throw Error("Unexpected MIME "+type);
    if(Number(r.headers.get("content-length")||0)>6000000)throw Error("File exceeds 6MB");
    const data=Buffer.from(await r.arrayBuffer());
    if(data.length<50||data.length>6000000||data[0]!==255||data[1]!==216)throw Error("Invalid JPEG");
    await writeFile(join("public/original-site",name),data);
    console.log("ASSET "+name+" "+data.length+" bytes");
    results.push({name,bytes:data.length,ok:true});
  }catch(error){
    console.error("ASSET ERROR "+name+" "+String(error.message||error));
    results.push({name,error:String(error.message||error),ok:false});
  }
}
await writeFile("audit/live-site/assets-status.json",JSON.stringify({source:origin,files:results},null,2)+"\n");
if(results.some(v=>!v.ok))process.exitCode=1;
