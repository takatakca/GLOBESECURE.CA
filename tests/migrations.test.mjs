import test from "node:test";
import assert from "node:assert/strict";
import {migrationManifest,migrationAllowed} from "../lib/migrations.mjs";
test("sequential numbered SQL migrations have sha256 checksums",async()=>{
  const files=await migrationManifest();
  assert.ok(files.length>=9);
  assert.equal(files[0].name,"001_init.sql");
  assert.equal(files[8].name,"009_client_requests.sql");
  assert.ok(files.every(item=>/^[a-f0-9]{64}$/.test(item.checksum)));
});
test("migrations cannot accidentally run without explicit backup and target gate",()=>{
  const base={DATABASE_URL:"postgresql://test:test@127.0.0.1:5432/globesecure_test",GLOBESECURE_DEPLOYMENT_ENV:"ci",GLOBESECURE_MIGRATE_ENABLED:"true",GLOBESECURE_BACKUP_VERIFIED:"true",GLOBESECURE_ALLOW_TEST_DB:"true"};
  assert.equal(migrationAllowed(base),true);
  assert.equal(migrationAllowed({...base,GLOBESECURE_BACKUP_VERIFIED:"false"}),false);
  assert.equal(migrationAllowed({...base,GLOBESECURE_ALLOW_TEST_DB:"false"}),false);
  assert.equal(migrationAllowed({...base,DATABASE_URL:"postgresql://test:pass@remote.example.com/globesecure_test"}),false);
  assert.equal(migrationAllowed({...base,GLOBESECURE_DEPLOYMENT_ENV:"production",GLOBESECURE_MIGRATE_ENABLED:"false"}),false);
});
