// ════════════════════════════════════════════════════════════════════════
// ตรวจตรรกะ "ดึงเฉพาะบิลที่เปลี่ยน" ของตัวพิมพ์ (print-agent.js)
//
// ไม่ได้เขียนตรรกะเลียนแบบไว้ในนี้ — แต่ "ดึงบล็อกตัดสินใจจริง" ออกจากไฟล์
// มารัน ถ้าวันหลังใครแก้ไฟล์จนเงื่อนไขเพี้ยน เทสต์นี้จะพังทันที
//
// เดิมพัน: พลาด = ครัวไม่ได้ใบ ลูกค้าไม่ได้กิน · ซ้ำ = ทำอาหารสองรอบ
//
// ⚠️ ข้อ 12-13 คือบั๊กจริงที่ตรวจเจอตอนรีวิว (บิลที่เกิดคาบเกี่ยวสองคำขอ
//    ถูกพิมพ์ซ้ำ) — ถ้าใครเผลอเอา `for (const o of orders) live.add(...)`
//    ออกจาก print-agent.js สองข้อนี้จะแดงทันที
// ════════════════════════════════════════════════════════════════════════
import fs from "node:fs";

const SRC = fs.readFileSync(process.env.AGENT_SRC || new URL("../public/print-agent.js", import.meta.url), "utf8");
let pass = 0, fail = 0;
const ok_ = (label, cond) => { if (cond) { pass++; console.log("  OK   " + label); } else { fail++; console.log("  FAIL " + label); } };

// ── ดึงนิพจน์/บล็อกตัดสินใจจริงออกมาจากไฟล์ ───────────────────────────────
const grabLine = (needle) => {
  const ln = SRC.split("\n").find(l => l.includes(needle));
  if (!ln) throw new Error("ไม่พบบรรทัด: " + needle);
  return ln.trim();
};
const grabBetween = (from, to) => {
  const a = SRC.indexOf(from);
  if (a < 0) throw new Error("ไม่พบจุดเริ่ม: " + from);
  const b = SRC.indexOf(to, a);
  if (b < 0) throw new Error("ไม่พบจุดจบ: " + to);
  return SRC.slice(a, b);
};

const changedSrc = grabLine("const changed = heads.filter(");
const wantFullSrc = grabLine("const wantFull =");
const pruneSrc = grabBetween("const live = new Set(", "saveState();");

const changedOf = new Function("heads", "state", changedSrc + " return changed;");
const wantFullOf = new Function("primed", "fullTick", "changed", "FULL_EVERY",
  wantFullSrc.replace("const wantFull =", "return"));
// รันบล็อก prune ตัวจริง — รวมทั้งการรวม orders และตัวกันคำตอบว่างชั่วคราว
const pruneWith = new Function("heads", "orders", "state", pruneSrc + " return live;");

// ── ตรวจว่านิพจน์อ้างของถูกตัว ────────────────────────────────────────────
ok_("prune อิง heads (ไม่ใช่ orders อย่างเดียว)", pruneSrc.includes("heads.map"));
ok_("prune รวม orders เข้าไปด้วย (กันบิลที่เกิดคาบเกี่ยวสองคำขอถูกล้าง)",
  pruneSrc.includes("for (const o of orders) live.add(String(o.id));"));
ok_("ล้างสถานะเฉพาะรอบที่รู้จริงว่ามีบิลเปิดอยู่ (ไม่เชื่อคำตอบว่าง)",
  pruneSrc.includes("if (heads.length > 0) {"));
ok_("ไม่มีตัวนับ emptyHeads ที่ค้างค่าได้แล้ว", !SRC.includes("emptyHeads"));
ok_("มาร์ค uat พร้อม sig เฉพาะตอนพิมพ์ผ่าน",
  SRC.includes("if (ok) { state.sig[o.id] = sig; state.uat[o.id] = uatOf.get(String(o.id)) || null; }"));
ok_("คำขอรายการคงตัวกรองสถานะไว้ (บิลที่จ่ายแล้วต้องไม่ถูกพิมพ์)",
  SRC.includes("&status=neq.paid&status=neq.cancelled&select=id,table_number,items"));
ok_("หัวบิลไม่ลาก items มาด้วย",
  SRC.includes("getActiveOrderHeads") && SRC.includes("select=id,updated_at"));

// ── ตัวจำลอง tick — โครงเดียวกับของจริง ใช้บล็อกที่ดึงมา ──────────────────
const FULL_EVERY = 60;
function makeWorld() {
  return {
    state: { sig: {}, init: {}, uat: {}, done: {}, tries: {} },
    primed: true,
    fullTick: 0,
    printed: [],            // ทุกใบที่สั่งพิมพ์ [โต๊ะ, จำนวนรายการ]
    fetchedItemsFor: [],    // บิลที่ต้องเปิดดูรายการในรอบนั้น
  };
}
const sigOf = o => JSON.stringify((o.items || []).map(i => [i.menu_id, i.qty]));
const deltaItems = (lastSig, items) => {
  const sum = rows => { const m = new Map(); for (const [k, q] of rows) m.set(k, (m.get(k) || 0) + q); return m; };
  const old = sum(JSON.parse(lastSig).map(([mid, q]) => [String(mid), q]));
  const cur = sum(items.map(i => [String(i.menu_id), i.qty]));
  const out = [];
  for (const [k, q] of cur) { const d = q - (old.get(k) || 0); if (d > 0) out.push({ menu_id: +k, qty: d }); }
  return out;
};
const openOf = db => db.filter(o => o.status !== "paid" && o.status !== "cancelled");

// opts.printOk       — จำลองกระดาษหมด/เครื่องหลุด
// opts.insertBetween — บิลที่ลูกค้ากดส่ง "คั่นกลาง" ระหว่างคำขอหัวบิลกับคำขอรายการ
// opts.headsEmpty    — จำลองคำขอหัวบิลคืนตัวเปล่าชั่วคราว (แต่บิลยังเปิดอยู่จริง)
// opts.itemsFail     — จำลองคำขอรายการล้ม (tick ออกก่อนถึงขั้นล้างสถานะ)
function tick(w, db, opts) {
  const o_ = opts || {};
  const printOk = o_.printOk !== false;

  // ── คำขอที่ 1: หัวบิล (ถ่ายภาพ ณ เวลา T0)
  const heads = o_.headsEmpty ? [] : openOf(db).map(o => ({ id: o.id, updated_at: o.updated_at }));
  const uatOf = new Map(heads.map(h => [String(h.id), h.updated_at || null]));

  const changed = changedOf(heads, w.state);
  w.fullTick++;
  const wantFull = wantFullOf(w.primed, w.fullTick, changed, FULL_EVERY);

  // ── ช่องว่างระหว่างสองคำขอ: บิลใหม่เกิดขึ้นตรงนี้
  if (o_.insertBetween) db.push(o_.insertBetween);

  // ── คำขอที่ 2: รายการในบิล (ณ เวลา T0+Δ)
  let orders;
  if (wantFull) { orders = openOf(db); w.fullTick = 0; }
  else if (changed.length) orders = openOf(db).filter(o => changed.some(h => h.id === o.id));
  else orders = [];
  // คำขอรายการล้ม = ของจริง return ออกไปเลย ยังไม่ถึงขั้นล้างสถานะ
  if (o_.itemsFail) return;
  w.fetchedItemsFor.push(orders.map(o => o.id));

  for (const o of orders) {
    if (!o || !o.items || !o.items.length) continue;
    const sig = sigOf(o), last = w.state.sig[o.id], first = !w.state.init[o.id];
    let okFlag = true;
    if (first) {
      const items = last ? deltaItems(last, o.items) : o.items;
      if (items.length) { okFlag = printOk; if (okFlag) w.printed.push([o.table_number, items.reduce((s, i) => s + i.qty, 0)]); }
      if (okFlag) w.state.init[o.id] = 1;
    } else if (last && last !== sig) {
      const items = deltaItems(last, o.items);
      if (items.length) { okFlag = printOk; if (okFlag) w.printed.push([o.table_number, items.reduce((s, i) => s + i.qty, 0)]); }
    }
    if (okFlag) { w.state.sig[o.id] = sig; w.state.uat[o.id] = uatOf.get(String(o.id)) || null; }
  }

  pruneWith(heads, orders, w.state);
}

const totalQty = w => w.printed.reduce((s, r) => s + r[1], 0);
const billOf = (id, table, uat, items) => ({ id, table_number: table, status: "open", updated_at: uat, items });

// ── สถานการณ์จริงในร้าน ──────────────────────────────────────────────────
{ // 1) บิลใหม่ พิมพ์ครั้งเดียว แล้วเงียบ
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  for (let i = 0; i < 10; i++) tick(w, db);
  ok_("บิลใหม่ พิมพ์ใบเดียว แล้ว 10 รอบถัดมาเงียบ", w.printed.length === 1 && totalQty(w) === 2);
  ok_("รอบที่ไม่มีอะไรเปลี่ยน ไม่เปิดดูรายการเลย", w.fetchedItemsFor.slice(1, 10).every(a => a.length === 0));
}
{ // 2) ลูกค้าสั่งเพิ่ม — พิมพ์เฉพาะส่วนต่าง
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  tick(w, db); tick(w, db);
  db[0].items = [{ menu_id: 10, qty: 2 }, { menu_id: 11, qty: 3 }]; db[0].updated_at = "T2";
  tick(w, db); tick(w, db); tick(w, db);
  ok_("สั่งเพิ่ม พิมพ์เฉพาะของใหม่ 3 ชิ้น ไม่พิมพ์ซ้ำของเดิม", w.printed.length === 2 && totalQty(w) === 5);
}
{ // 3) สั่งเมนูเดิมซ้ำ — ต้องนับเป็นของใหม่
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  tick(w, db);
  db[0].items = [{ menu_id: 10, qty: 2 }, { menu_id: 10, qty: 2 }]; db[0].updated_at = "T2";
  tick(w, db);
  ok_("สั่งเมนูเดิมซ้ำ ครัวได้ใบเพิ่มอีก 2 ชิ้น", totalQty(w) === 4);
}
{ // 4) กระดาษหมด/เครื่องหลุด — รอบหน้าต้องลองใหม่ ไม่ใช่เงียบถาวร
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  tick(w, db, { printOk: false });
  ok_("พิมพ์ไม่ผ่าน = ยังไม่มาร์ค uat", w.state.uat[1] === undefined);
  tick(w, db, { printOk: false });
  ok_("รอบถัดมายังเปิดดูรายการซ้ำ (ไม่ตัดทิ้ง)", w.fetchedItemsFor[1].length === 1);
  tick(w, db, { printOk: true });
  ok_("พอเครื่องกลับมา พิมพ์ได้ครบใบเดียว ไม่ซ้ำ", w.printed.length === 1 && totalQty(w) === 2);
  tick(w, db); tick(w, db);
  ok_("หลังพิมพ์ผ่านแล้ว ไม่พิมพ์ซ้ำอีก", w.printed.length === 1);
}
{ // 5) ตาข่ายนิรภัยครบรอบ ต้องไม่ทำให้พิมพ์ซ้ำ
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  for (let i = 0; i < 200; i++) tick(w, db);
  ok_("ผ่าน 200 รอบ (มีตาข่ายนิรภัยคั่น) ยังพิมพ์ใบเดียว", w.printed.length === 1);
  const fulls = w.fetchedItemsFor.filter(a => a.length === 1).length;
  ok_("ตาข่ายนิรภัยทำงานจริง (ดึงเต็มเป็นระยะ)", fulls >= 3 && fulls <= 6);
}
{ // 6) ตาข่ายนิรภัยจับของที่หลุด — แก้ items โดยไม่ขยับ updated_at
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  tick(w, db);
  db[0].items = [{ menu_id: 10, qty: 2 }, { menu_id: 99, qty: 1 }];   // ไม่ขยับ updated_at โดยตั้งใจ
  for (let i = 0; i < 58; i++) tick(w, db);
  const beforeNet = w.printed.length;
  tick(w, db); tick(w, db);
  ok_("ถ้ามีทางเขียนไหนลืมขยับ updated_at ตาข่ายนิรภัยยังจับได้ภายใน 5 นาที",
    beforeNet === 1 && w.printed.length === 2);
}
{ // 7) บิลถูกปิดขณะที่โต๊ะอื่นยังเปิดอยู่ — ต้องล้างเฉพาะใบที่ปิด
  const w = makeWorld();
  const db = [
    billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }]),
    billOf(2, "A2", "T1", [{ menu_id: 11, qty: 1 }]),
  ];
  tick(w, db);
  ok_("สองโต๊ะ พิมพ์สองใบ", w.printed.length === 2);
  db[0].status = "paid"; db[0].updated_at = "T2";
  tick(w, db); tick(w, db);
  ok_("บิลที่จ่ายแล้วถูกล้างสถานะ",
    w.state.sig[1] === undefined && w.state.uat[1] === undefined && w.state.init[1] === undefined);
  ok_("โต๊ะที่ยังเปิดอยู่ สถานะไม่ถูกแตะ", w.state.init[2] === 1 && w.state.uat[2] === "T1");
  ok_("บิลจ่ายแล้ว ไม่มีใบเพิ่ม", w.printed.length === 2);
}
{ // 8) โต๊ะเดิมเปิดบิลใหม่หลังปิดบิลเก่า
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  tick(w, db);
  db[0].status = "paid"; tick(w, db);
  db.push(billOf(2, "A1", "T9", [{ menu_id: 10, qty: 1 }]));
  tick(w, db);
  ok_("โต๊ะเดิมเปิดบิลใหม่ ได้ใบใหม่ 1 ใบ (ไม่ปนกับบิลเก่า)", w.printed.length === 2 && totalQty(w) === 3);
}
{ // 9) อัปเกรดจาก v27 — ไฟล์สถานะเดิมมี sig/init แต่ไม่มี uat
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  w.state.sig[1] = sigOf(db[0]); w.state.init[1] = 1;
  tick(w, db); tick(w, db);
  ok_("อัปเกรดจาก v27 ไม่พิมพ์ซ้ำบิลที่ค้างอยู่", w.printed.length === 0);
  ok_("อัปเกรดแล้วเติม uat ให้เอง รอบถัดมาเงียบ",
    w.state.uat[1] === "T1" && w.fetchedItemsFor[1].length === 0);
}
{ // 10) บิลไม่มี updated_at (ข้อมูลเก่า) — ต้องถือว่าเปลี่ยนเสมอ
  const w = makeWorld();
  const db = [billOf(1, "A1", null, [{ menu_id: 10, qty: 2 }])];
  tick(w, db); tick(w, db); tick(w, db);
  ok_("บิลไม่มี updated_at ยังเปิดดูรายการทุกรอบ (ไม่เสี่ยงพลาด)",
    w.fetchedItemsFor.every(a => a.length === 1) && w.printed.length === 1);
}
{ // 11) พีค 40 บิลเปลี่ยนพร้อมกัน
  const w = makeWorld();
  const db = Array.from({ length: 40 }, (_, i) => billOf(i + 1, "T" + i, "T1", [{ menu_id: 10, qty: 1 }]));
  tick(w, db);
  ok_("บิลเปลี่ยนพร้อมกัน 40 ใบ พิมพ์ครบ 40 ใบ", w.printed.length === 40);
  ok_("changed เกิน 30 ตกไปทางดึงเต็ม (กัน URL ยาวเกิน)", wantFullOf(true, 1, new Array(31), FULL_EVERY) === true);
  ok_("changed 5 ใบ ไม่ต้องดึงเต็ม", wantFullOf(true, 1, new Array(5), FULL_EVERY) === false);
}
{ // 12) ⚠️ บั๊กที่รีวิวเจอ: บิลเกิดคาบเกี่ยวสองคำขอในรอบตาข่ายนิรภัย
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 1 }])];
  for (let i = 0; i < 59; i++) tick(w, db);           // เดินไปจ่อรอบตาข่ายนิรภัย
  const before = w.printed.length;
  // รอบถัดไปเป็นรอบดึงเต็ม — โต๊ะ 7 กดส่งคั่นระหว่างคำขอหัวบิลกับคำขอรายการ
  tick(w, db, { insertBetween: billOf(7, "B7", "T5", [{ menu_id: 20, qty: 3 }]) });
  ok_("บิลที่เกิดคาบเกี่ยว พิมพ์ออกทันทีในรอบนั้น", w.printed.length === before + 1);
  ok_("สถานะของบิลที่เพิ่งพิมพ์ ต้องไม่ถูกล้างทิ้ง", w.state.init[7] === 1);
  tick(w, db); tick(w, db); tick(w, db);
  ok_("รอบถัดมาต้องไม่พิมพ์ซ้ำ (ครัวไม่ทำอาหารสองรอบ)",
    w.printed.length === before + 1 && w.printed.filter(r => r[0] === "B7").length === 1);
}
{ // 13) คำขอหัวบิลคืนตัวเปล่าชั่วคราว ทั้งที่บิลยังเปิดอยู่
  const w = makeWorld();
  const db = Array.from({ length: 9 }, (_, i) => billOf(i + 1, "T" + (i + 1), "T1", [{ menu_id: 10, qty: 2 }]));
  tick(w, db);
  const before = w.printed.length;
  ok_("รอบแรกพิมพ์ครบ 9 โต๊ะ", before === 9);
  for (let i = 0; i < 5; i++) tick(w, db, { headsEmpty: true });   // สะดุดยาว 5 รอบติด
  ok_("คำตอบว่างติดกัน 5 รอบ ยังไม่ล้างสถานะ", w.state.init[1] === 1 && w.state.init[9] === 1);
  tick(w, db);
  ok_("พอกลับมาปกติ ไม่พิมพ์ซ้ำ 9 โต๊ะ", w.printed.length === before);
}
{ // 14) ลำดับที่ผู้ตรวจพิสูจน์: ว่าง -> ดึงรายการล้ม (แต่หัวบิลเห็นบิลเต็มมือ) -> ว่าง
  const w = makeWorld();
  const db = Array.from({ length: 9 }, (_, i) => billOf(i + 1, "T" + (i + 1), "T1", [{ menu_id: 10, qty: 2 }]));
  tick(w, db);
  const before = w.printed.length;
  tick(w, db, { headsEmpty: true });                 // ว่างครั้งที่ 1
  tick(w, db, { itemsFail: true });                  // หัวบิลเห็น 9 ใบ แต่ดึงรายการล้ม
  tick(w, db, { headsEmpty: true });                 // ว่างครั้งที่ 2
  ok_("รอบที่ดึงข้อมูลล้มคั่นกลาง ต้องไม่ทำให้สถานะถูกล้าง", w.state.init[1] === 1 && w.state.init[9] === 1);
  tick(w, db);
  ok_("ไม่พิมพ์ซ้ำทั้งร้านหลังเน็ตสะดุดสลับกับคำตอบว่าง", w.printed.length === before);
}
{ // 15) ปิดร้านจริง แล้วเปิดบิลใหม่ — ของเก่าถูกล้างตอนมีบิลจริง
  const w = makeWorld();
  const db = [billOf(1, "A1", "T1", [{ menu_id: 10, qty: 2 }])];
  tick(w, db);
  db[0].status = "paid";
  tick(w, db); tick(w, db);
  ok_("ร้านว่าง สถานะค้างไว้ก่อน (ไม่เสียหาย คีย์เป็นเลขบิล)", w.state.init[1] === 1);
  db.push(billOf(2, "A2", "T9", [{ menu_id: 11, qty: 1 }]));
  tick(w, db);
  ok_("พอมีบิลใหม่จริง ของเก่าถูกล้าง เหลือแต่บิลที่เปิดอยู่",
    w.state.init[1] === undefined && w.state.init[2] === 1);
  ok_("บิลใหม่พิมพ์ใบเดียว ไม่ปนกับบิลเก่า", w.printed.length === 2);
}



// ── กันพิมพ์ท่วมเมื่อเครื่องหนึ่งล่ม (บั๊กจริง 8 ก.ย. 69) ────────────────
// เครื่อง "ครัว" ต่อไม่ติด → ส่งไม่ผ่าน → ตัวพิมพ์วนส่งใหม่ทั้งชุดทุก 5 วินาที
// เครื่องแคชเชียร์ที่ปกติดีจึงพิมพ์ใบเดิมซ้ำไม่หยุด กระดาษหมดม้วน
{
  const ln = SRC.split("\n").find(l => l.includes("const usable = all.filter("));
  ok_("printItems กรองเครื่องที่พิมพ์ผ่านแล้วออก", !!ln);
  if (ln) {
    const pick = new Function("all", "alreadyDone", ln.trim() + String.fromCharCode(10) + "return usable;");
    const A = { id: 1, name: "ครัว" }, B = { id: 2, name: "แคชเชียร์" };
    ok_("รอบแรกส่งครบทุกเครื่อง", pick([A, B], {}).length === 2);
    ok_("รอบลองใหม่ ข้ามเครื่องที่ผ่านแล้ว (ไม่พิมพ์ซ้ำ)",
      pick([A, B], { 2: 1 }).map(p => p.id).join(",") === "1");
    ok_("ผ่านครบแล้วไม่ส่งอะไรอีก", pick([A, B], { 1: 1, 2: 1 }).length === 0);
  }
  ok_("orphan ดูจากเครื่องทั้งหมด ไม่ใช่เฉพาะที่ยังไม่ส่ง",
    SRC.includes("const orphan = items.filter(it => !all.some(p => printerHandles(p, it)));"));
  ok_("printItems คืนรายชื่อเครื่องที่ผ่าน", SRC.includes("return { ok: !anyFail, okIds };"));
  ok_("tick จำเครื่องที่ผ่านไว้ใน state.done", SRC.includes("const done = state.done[dk] || {};"));
  ok_("ลองใหม่ได้ไม่เกิน 3 ครั้ง แล้วหยุด", SRC.includes("if (n >= 3) {") && SRC.includes("state.tries[dk] = n;"));
  ok_("สถานะ done/tries ถูกเก็บกวาดตามบิลที่ปิดไป",
    SRC.includes("Object.keys(state.done)") && SRC.includes("delete state.done[k];"));
  ok_("orphan ไม่นับเป็นความล้มเหลว (ลองใหม่ก็ไม่หาย)", !SRC.includes("orphan.length === 0"));
}

console.log("\n" + "=".repeat(52));
console.log(fail === 0 ? "OK ผ่านทั้งหมด " + pass + " ข้อ" : "FAIL ล้มเหลว " + fail + " ข้อ (ผ่าน " + pass + ")");
process.exitCode = fail ? 1 : 0;
