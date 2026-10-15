import {readdir,readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
export const MIGRATIONS_DIR=resolve(fileURLToPath(new URL("../db/migrations/",import.meta.url)));
export async function migrationManifest(directory=MIGRATIONS_DIR){
  const filenames=(await readdir(directory)).filter(name=>/^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
  if(!filenames.length)throw Error("No SQL migrations found");
  for(let index=0;index<filenames.length;index++) {
    if(Number(filenames[index].slice(0,3))!==index+1)throw Error("Migration sequence has a gap");
  }
  return Promise.all(filenames.map(async name=>{
    const sql=await readFile(join(directory,name),"utf8");
    if(sql.length>1_000_000)throw Error("Migration too large");
    return {name,sql,checksum:createHash("sha256").update(sql).digest("hex")};
  }));
}
export function migrationAllowed(env) {
  if(env.GLOBESECURE_MIGRATE_ENABLED!=="true" || env.GLOBESECURE_BACKUP_VERIFIED!=="true")return false;
  if(!["ci","staging","production"].includes(env.GLOBESECURE_DEPLOYMENT_ENV)||!env.DATABASE_URL)return false;
  if(env.GLOBESECURE_DEPLOYMENT_ENV==="ci"){
    try{
      const db=new URL(env.DATABASE_URL);
      return env.GLOBESECURE_ALLOW_TEST_DB==="true" &&
        ["localhost","127.0.0.1"].includes(db.hostname) &&
        db.pathname==="/globesecure_test";
    }catch{return false;}
  }
  return true;
}
