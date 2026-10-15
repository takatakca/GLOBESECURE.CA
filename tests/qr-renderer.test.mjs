import test from "node:test";
import assert from "node:assert/strict";
import qrcode from "../vendor/qrcode-generator.mjs";
test("offline QR generator encodes a 32-character checkpoint secret into module grid",()=>{
  const token="abcdefghijklmnopqrstuvwxABCDEFGH";
  const qr=qrcode(0,"M");
  qr.addData(token);
  qr.make();
  const count=qr.getModuleCount();
  assert.ok(count>=21 && count<=177);
  assert.equal(qr.isDark(0,0),true);
  assert.equal(qr.isDark(0,6),true);
  let filled=0;
  for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))filled++;
  assert.ok(filled>100 && filled<count*count);
});
