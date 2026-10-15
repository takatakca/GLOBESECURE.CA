// Guarded, checksum-tracked migrations. Does not deploy or modify website files.
import {migrationManifest,migrationAllowed} from "../lib/migrations.mjs";
const mode=process.argv[2]||"--plan";
if(!["--plan","--apply"].includes(mode))throw Error("Use --plan or --apply");
const manifest=await migrationManifest();
if(mode==="--plan"){
  for(const item of manifest)console.log(item.name+" "+item.checksum);
  console.log(manifest.length+" numbered migrations planned; no DB connection performed.");
}else{
  if(!migrationAllowed(process.env))throw Error("Migration refused: explicit approval, verified backup, DB URL and target scope required.");
  const {default:pg}=await import("pg");
  const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
  await client.connect();
  let locked=false;
  try {
    await client.query("SELECT pg_advisory_lock(74621011)");
    locked=true;
    await client.query(`CREATE TABLE IF NOT EXISTS gs_schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    for(const item of manifest){
      await client.query("BEGIN");
      try{
        const found=await client.query("SELECT checksum FROM gs_schema_migrations WHERE name=$1",[item.name]);
        if(found.rowCount){
          if(found.rows[0].checksum!==item.checksum)throw Error("Migration checksum mismatch for "+item.name);
          await client.query("COMMIT");
          console.log("VERIFIED "+item.name);
          continue;
        }
        await client.query(item.sql);
        await client.query("INSERT INTO gs_schema_migrations(name,checksum) VALUES($1,$2)",[item.name,item.checksum]);
        await client.query("COMMIT");
        console.log("APPLIED "+item.name);
      }catch(error){
        await client.query("ROLLBACK").catch(()=>{});
        throw error;
      }
    }
  }finally{
    if(locked)await client.query("SELECT pg_advisory_unlock(74621011)").catch(()=>{});
    await client.end();
  }
}
