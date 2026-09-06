#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// NAIWANSOOK FOODCOST — ตัวตรวจโค้ด (ไม่แตะฐานข้อมูล รันได้ทุกเมื่อ)
//
//   node tools/check-code.mjs        (หรือ npm run check ซึ่งรันตัวนี้ด้วย)
//
// ทุกข้อในนี้กลั่นจากบั๊คที่เคยทำระบบพังจริง — มีไว้กันไม่ให้กลับมาอีก
// แบ่งสองแบบ:
//   ① ทดสอบพฤติกรรม — ดึงฟังก์ชันจริงจากไฟล์มารันด้วยข้อมูลจริง
//   ② ตรวจโครงสร้าง — เช็คว่าตัวกันที่ใส่ไว้ยังอยู่ (บางอย่างดึงมารันไม่ได้)
// ══════════════════════════════════════════════════════════════════════════
import fs from "node:fs";

const APP = fs.readFileSync("src/FoodCostApp.jsx", "utf8");
const AGENT = fs.readFileSync("public/print-agent.js", "utf8");

let pass = 0, fail = 0;
const section = (t) => console.log(`\n─── ${t} ───`);
const ck = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) console.log(`       ได้ ${JSON.stringify(got)} · ต้องได้ ${JSON.stringify(want)}`);
};
const ok_ = (label, cond) => ck(label, !!cond, true);

// ดึงฟังก์ชันจริงออกจากไฟล์ (นับวงเล็บปีกกา)
const grab = (src, name) => {
  const st = src.indexOf(`function ${name}(`);
  if (st < 0) throw new Error(`ไม่พบฟังก์ชัน ${name}`);
  let d = 0;
  for (let j = src.indexOf("{", st); j < src.length; j++) {
    if (src[j] === "{") d++;
    else if (src[j] === "}") { d--; if (d === 0) return src.slice(st, j + 1); }
  }
  throw new Error(`อ่าน ${name} ไม่จบ`);
};
// ดึงตัวแปรที่เป็นฟังก์ชัน (const ชื่อ = ...) จนจบบล็อก — รองรับหลายบรรทัด
const grabConst = (src, name) => {
  const st = src.indexOf(`const ${name}=`);
  if (st < 0) throw new Error(`ไม่พบ ${name}`);
  let d = 0, started = false;
  for (let j = st; j < src.length; j++) {
    if (src[j] === "{") { d++; started = true; }
    else if (src[j] === "}") { d--; if (started && d === 0) return src.slice(st, src.indexOf(";", j) + 1); }
  }
  throw new Error(`อ่าน ${name} ไม่จบ`);
};

// ══════════════════════════════════════════════════════════════════════════
// ① ใครเห็นอะไร — ปุ่มติ๊ก "เปิด/ปิดให้สาขาเห็น"
//    บั๊คจริง 27/08/2569: เมนูที่ติ๊กออกหมดกลับไปโผล่ทุกสาขา
// ══════════════════════════════════════════════════════════════════════════
section("กติกา: สาขาไหนเห็นอะไร");
{
  const m = {};
  new Function("exports",
    grabConst(APP, "menuVisibleAt") + "\n" +
    grab(APP, "ingVisibleAt") + "\n" + grab(APP, "supVisibleAt") + "\n" +
    "exports.menu=menuVisibleAt;exports.ing=ingVisibleAt;exports.sup=supVisibleAt;")(m);

  for (const [name, f] of [["เมนู", (v, b) => m.menu({ visible_branches: v }, b)],
                           ["วัตถุดิบ", (v, b) => m.ing({ visible_branches: v }, b, false)]]) {
    ck(`${name}: ไม่เคยตั้ง = เปิดให้ทุกสาขา`, f(null, 6), true);
    ck(`${name}: ติ๊กออกหมด = ไม่มีสาขาไหนเห็น`, f([], 6), false);
    ck(`${name}: ระบุสาขา = เฉพาะสาขานั้น`, [f([6], 6), f([6], 3)], [true, false]);
    ck(`${name}: เก็บเป็นสตริงก็ต้องเห็น`, f(["6"], 6), true);
  }
  ck("ครัวกลางเห็นวัตถุดิบทุกอย่างเสมอ", m.ing({ visible_branches: [] }, 1, true), true);
  ck("ซัพ: สาขาเป็นเจ้าของ = เห็น", m.sup({ branch_id: 6, visible_branches: null }, 6), true);
  ck("ซัพ: ไม่ได้เปิดให้ = ไม่เห็น (opt-in)", m.sup({ branch_id: 1, visible_branches: [] }, 6), false);
  ok_("ไม่มีสำเนากติกาเมนูกระจายอยู่ตามจอ", !APP.includes("vb.length===0||vb.includes"));
}

// ══════════════════════════════════════════════════════════════════════════
// ② ใบสั่งครัว — สั่งเมนูเดิมซ้ำต้องออกใบทุกครั้ง
//    บั๊คจริง 04/09/2569: คีย์ซ้ำถูก "ทับ" แทนที่จะ "บวก" → ครัวไม่ได้ใบเลย
// ══════════════════════════════════════════════════════════════════════════
section("ใบสั่งครัว: สั่งเมนูเดิมซ้ำ");
{
  const ma = {};
  new Function("exports", 'const optionsText=()=>"";\n' + grab(AGENT, "sumByKey") + "\n" +
    grab(AGENT, "newItemsVs") + "\nexports.f=newItemsVs;")(ma);
  const st = APP.indexOf("const diffNew=(lastSig,items)=>{");
  const mb = {};
  new Function("exports", APP.slice(st, APP.indexOf("\n    };", st) + 7) + "\nexports.f=diffNew;")(mb);

  const sigA = (it) => JSON.stringify(it.map((i) => [i.menu_id, i.qty, i.note || "", ""]));
  const sigB = (it) => JSON.stringify(it.map((i) => [i.menu_id, i.qty, i.note || ""]));
  const P = (id, qty, note = "") => ({ menu_id: id, qty, note });
  const qty = (rows) => rows.reduce((s, i) => s + i.qty, 0);

  for (const [name, before, add, want] of [
    ["สั่ง 1 → ซ้ำอีก 1", [P(42, 1)], [P(42, 1)], 1],
    ["สั่ง 2 → ซ้ำอีก 2", [P(42, 2)], [P(42, 2)], 2],
    ["สั่ง 2 → ซ้ำอีก 3", [P(42, 2)], [P(42, 3)], 3],
    ["สั่งซ้ำรอบที่สาม", [P(42, 1), P(42, 1)], [P(42, 1)], 1],
    ["คนละเมนู", [P(42, 1)], [P(77, 1)], 1],
    ["เมนูเดิมแต่ใส่หมายเหตุ", [P(42, 1)], [P(42, 1, "ไม่เผ็ด")], 1],
  ]) {
    const after = [...before, ...add];
    ck(`ตัวพิมพ์ · ${name}`, qty(ma.f(sigA(before), after)), want);
    ck(`เบราว์เซอร์ · ${name}`, qty(mb.f(sigB(before), after)), want);
  }
  const same = [P(42, 2), P(77, 1)];
  ck("ไม่มีอะไรเปลี่ยน → ไม่พิมพ์ซ้ำ",
    [ma.f(sigA(same), same).length, mb.f(sigB(same), same).length], [0, 0]);
}

// ══════════════════════════════════════════════════════════════════════════
// ③ ส่วนผสม SOP — ตัดที่การผลิตที่เดียว
//    บั๊คจริง 18/08/2569: cascade ตัดซ้ำ ครัวกลางจ่ายซ้ำ ฿134,443
// ══════════════════════════════════════════════════════════════════════════
section("สูตร SOP: ตัดส่วนผสมตอนผลิต");
{
  const m = {};
  new Function("exports", grab(APP, "sopConsumption") + "\nexports.f=sopConsumption;")(m);
  const salt = { id: 2, name: "เกลือ", buy_unit: "กิโลกรัม", convert_to_gram: 1000 };
  const parent = { id: 1, convert_to_gram: 5000, ingredients: [{ ingredientId: 2, amountGram: 250 }] };
  const map = new Map([[2, salt]]);
  ck("หารด้วยกรัมของตัวลูก ไม่ใช่ตัวแม่", m.f(parent, 1, map)[0].use, 0.25);
  ck("ผลิต 4 หม้อ = 4 เท่า", m.f(parent, 4, map)[0].use, 1);
  ck("ส่วนผสมซ้ำในสูตร รวมก่อนเขียน",
    m.f({ convert_to_gram: 1000, ingredients: [{ ingredientId: 2, amountGram: 100 }, { ingredientId: 2, amountGram: 150 }] }, 1, map).map((r) => r.use), [0.25]);
  ck("สูตรว่าง = ไม่ตัดอะไร", m.f({ ingredients: [] }, 5, map).length, 0);
  ok_("ไม่มี SOP cascade กลับมา", !APP.includes("_cascadeSopChildren"));
}

// ══════════════════════════════════════════════════════════════════════════
// ④ ตัวกันที่ต้องอยู่ — ดึงมารันไม่ได้ ตรวจว่ายังอยู่ในโค้ด
// ══════════════════════════════════════════════════════════════════════════
section("ตัวกันความเสียหาย (ต้องไม่หายไป)");
const guards = [
  ["POS กันกดซ้ำแบบทันที (ไม่ใช่ state ที่ช้า 1 เฟรม)", APP.includes("const setSavingGuard=v=>{savingRef.current=!!v;setSaving(!!v);}")],
  ["เตือนก่อนเช็คบิลที่ยังไม่ส่งครัว", APP.includes('title:"ยังไม่ได้ส่งเข้าครัว"')],
  ["หน้านับสต็อก: ปุ่มปิดถามก่อนทิ้งตัวเลข", APP.includes('onClick={guardedClose} full')],
  ["modal รับของ: ถามก่อนทิ้งข้อมูล", APP.includes("async function closeReceiveGuarded()")],
  ["กล่องยืนยันที่ถูกแทนที่ ปลดล็อกคนที่รอ", APP.includes("if(prev&&prev.resolve){try{prev.resolve(false);}catch{}}")],
  ["Enter ไม่กดยืนยันกล่องลบให้เอง", APP.includes('if(!st||st.opts?.notice!==true)return;')],
  ["ตะกร้าลูกค้าว่าง ไม่ทับออเดอร์ที่ค้าง", APP.includes("if(!cart.length){")],
  ["บิลถูกปิดกลางทาง = แจ้ง ไม่แอบสร้างบิลใหม่", APP.includes('if(sawOpenBill)throw new Error("บิลของโต๊ะนี้เพิ่งถูกปิด')],
  ["เขียนบิลล็อกสถานะด้วย ไม่ใช่แค่ updated_at", APP.includes('&status=neq.paid&status=neq.cancelled`, { method:"PATCH"')],
  ["ยกเลิกรายการ แจ้งครัว", APP.includes("❌ ยกเลิก: ${target.name}")],
  ["เครื่องพิมพ์ 'รับทุกหมวด' เก็บเป็น null ไม่ใช่ []", APP.includes("categories:sAllCats?null:sCats")],
  ["ปิดกะดึงบิลครบทั้งกะ (ไม่ตัดที่ 200)", APP.includes("api.getPOSOrdersSince(currentBranch.id,shift.opened_at)")],
  ["บิลแยกเฉลี่ยส่วนลด", APP.includes("const splitDisc=round2(totalDiscount*ratio);")],
  ["เมนูในมือถือลูกค้ารีเฟรชระหว่างมื้อ", APP.includes("menuPollId=setInterval")],
  ["ยอดลูกค้าคิดสูตรเดียวกับ POS", APP.includes("const custBill=useMemo(()=>{")],
  ["ของค้างในมือถือหมดอายุ", APP.includes("const OUTBOX_MAX_AGE=")],
  ["ตัวพิมพ์: กัน tick ซ้อน", AGENT.includes("let tickBusy = false;")],
  ["ตัวพิมพ์: พิมพ์ไม่ผ่าน = ไม่มาร์คว่าพิมพ์แล้ว", AGENT.includes("if (ok) state.sig[o.id] = sig;")],
  ["จุดสถานะเครื่องพิมพ์ดูอายุค่า", APP.includes("const fresh=age<3*60*1000;")],
  ["ช่องตัวเลขไม่มี type=number ดิบ (iOS)", (APP.match(/<input[^>]*type="number"/g) || []).length === 0],
  // หน้าลูกค้าเปิดสาธารณะ (แค่สแกน QR ก็เข้าได้) — สูตรอาหารต้องไม่หลุดไปกับ JSON
  ["หน้าลูกค้าไม่ส่ง ingredients/sop ออกไป", (() => {
    const k = APP.indexOf("getMenusPublic:");
    if (k < 0) return false;
    const ln = APP.slice(k, k + 400);
    if (!ln) return false;
    return !ln.includes("ingredients") && !ln.includes("sop");
  })()],
  ["หน้าลูกค้าโหลดครั้งแรกใช้ getMenusPublic", APP.includes("await Promise.all([api.getMenusPublic(),api.getPOSSettings(branchId)])")],
  ["สถานะของหมดยังเช็คทุก 1 นาที", APP.includes("menuPollId=setInterval(()=>{if(!document.hidden)refreshAvail();},60000)")],
  ["ตัวจับเวลาเมนูเต็มถูกเคลียร์ตอนออกจากหน้า", APP.includes("if(fullPollId)clearInterval(fullPollId);")],
];
for (const [label, cond] of guards) ok_(label, cond);

console.log(`\n${"═".repeat(52)}`);
console.log(fail === 0 ? `✅ ผ่านทั้งหมด ${pass} ข้อ` : `❌ ล้มเหลว ${fail} ข้อ (ผ่าน ${pass})`);
process.exitCode = fail ? 1 : 0;
