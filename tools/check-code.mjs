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
const HTML = fs.readFileSync(process.env.HTML_SRC || new URL("../index.html", import.meta.url), "utf8");

// ── ดึงสคริปต์เลือก manifest จาก index.html มา "รันจริง" ──────────────────
// ไม่ใช่แค่ค้นหาข้อความ — เคยพลาดมาแล้ว: แบ็กสแลชใน regex หายตอนเขียนไฟล์
// กลายเป็น /^d+$/ ซึ่งไม่แมตช์เลขสาขาเลย ทางลัดจึงยังพาไปหลังบ้านเหมือนเดิม
// ด่านที่ค้นแค่ข้อความมองไม่เห็นบั๊กแบบนั้น ต้องรันถึงจะจับได้

// ── ดึง printerHandles ตัวจริงจาก print-agent.js มารัน ────────────────────
// นี่คือกติกาที่ตัดสินว่าใบไหนออกเครื่องไหน ผิดแล้วครัวได้ใบผิด/ไม่ได้ใบ
// ตั้งแต่เลิกใช้ catch-all (categories:null) ยิ่งต้องพิสูจน์ว่ากติกายังตรง
// ── ประกอบสตรีม ESC/POS ของใบ QR: ดึงนิพจน์จริงมารัน ────────────────────
// ใบ QR ประกอบจาก 3 ชิ้น (หัวเป็นรูป → QR เนทีฟ → ท้ายเป็นรูป) ถ้า init/ตัดกระดาษ
// ไม่ตรงจังหวะ กระดาษจะตัดกลางใบหรือใบถัดไปเพี้ยน — ต้องพิสูจน์ ไม่ใช่ค้นข้อความ
// ── ดึงตัวคำนวณแบ่งจ่ายเท่ากันมารัน ──────────────────────────────────────
// เงินล้วนๆ — หารไม่ลงตัวแล้วปล่อยเศษหาย = ร้านเก็บเงินขาดทุกบิล
const splitEvenlyOf = (() => {
  const st = APP.indexOf("const splitEvenly=(total,n)=>{");
  if (st < 0) throw new Error("ไม่เจอ splitEvenly");
  let d = 0, started = false, en = -1;
  for (let i = st; i < APP.length; i++) {
    if (APP[i] === "{") { d++; started = true; }
    else if (APP[i] === "}") { d--; if (started && d === 0) { en = APP.indexOf(";", i) + 1; break; } }
  }
  return new Function(APP.slice(st, en) + " return splitEvenly;")();
})();
const sumOf = a => Math.round(a.reduce((x, y) => x + y, 0) * 100) / 100;

const escHead = (() => {
  const ln = APP.split("\n").find(l => l.includes("const head=[...(opts&&opts.noInit?[]"));
  if (!ln) throw new Error("ไม่เจอบรรทัดประกอบหัวสตรีม");
  return new Function("opts", "bpr", "h", ln.trim() + " return head;");
})();
const escTail = (() => {
  const ln = APP.split("\n").find(l => l.includes("const tail=opts&&opts.noCut?[]"));
  if (!ln) throw new Error("ไม่เจอบรรทัดประกอบท้ายสตรีม");
  return new Function("opts", ln.trim() + " return tail;");
})();
const qrBytesOf = (() => {
  const st = APP.indexOf("function escposQRBytes(payload){");
  if (st < 0) throw new Error("ไม่เจอ escposQRBytes");
  let d = 0, started = false, en = -1;
  for (let i = st; i < APP.length; i++) {
    if (APP[i] === "{") { d++; started = true; }
    else if (APP[i] === "}") { d--; if (started && d === 0) { en = i + 1; break; } }
  }
  return new Function(APP.slice(st, en) + " return escposQRBytes;")();
})();

const handlesOf = (() => {
  const st = AGENT.indexOf("function printerHandles(p, it) {");
  if (st < 0) throw new Error("ไม่เจอ printerHandles");
  let d = 0, started = false, en = -1;
  for (let i = st; i < AGENT.length; i++) {
    if (AGENT[i] === "{") { d++; started = true; }
    else if (AGENT[i] === "}") { d--; if (started && d === 0) { en = i + 1; break; } }
  }
  return new Function(AGENT.slice(st, en) + " return printerHandles;")();
})();
function pickManifest(search) {
  const st = HTML.indexOf("(function () {");
  const en = HTML.indexOf("})();", st);
  if (st < 0 || en < 0) throw new Error("หาสคริปต์เลือก manifest ใน index.html ไม่เจอ");
  const body = HTML.slice(st, en + 5);
  let href = null, title = null;
  const doc = {
    querySelector: () => ({ setAttribute: (_k, v) => { title = v; } }),
    createElement: () => ({ set href(v) { href = v; }, get href() { return href; } }),
    head: { appendChild: () => {} },
  };
  new Function("location", "document", body)({ search }, doc);
  return { href, title };
}

// ── ดึงตัวเทียบลำดับไทยตัวจริงมารัน ─────────────────────────────────────
// ค้นข้อความอย่างเดียวไม่พอ: เขียน .sort(thCmp) ไว้แต่ Collator ตั้ง locale ผิด
// ก็ยังผ่านด่านแบบค้นข้อความ ทั้งที่ลำดับบนจอผิดเหมือนเดิม ต้องเรียงจริงแล้วดูผล
const thCmpOf = (() => {
  const L = APP.split("\n");
  const a = L.find(l => l.startsWith("const _thColl="));
  const b = L.find(l => l.startsWith("const thCmp="));
  if (!a || !b) throw new Error("ไม่เจอตัวเทียบลำดับไทย");
  return new Function(a + "\n" + b + "\nreturn thCmp;")();
})();
const thSort = (arr) => [...arr].sort(thCmpOf);

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
  // เดิมเคยบังคับว่า "รับทุกหมวด" ต้องเก็บเป็น null — เลิกใช้แล้ว (8 ก.ย. 69)
  // เจ้าของสั่งให้ตัดตัวเลือกนั้นทิ้ง ให้ติ๊กหมวดเป็นตัวตัดสินอย่างเดียว
  ["ปิดกะดึงบิลครบทั้งกะ (ไม่ตัดที่ 200)", APP.includes("api.getPOSOrdersSince(currentBranch.id,shift.opened_at)")],
  ["บิลแยกเฉลี่ยส่วนลด", APP.includes("const splitDisc=round2(totalDiscount*ratio);")],
  ["เมนูในมือถือลูกค้ารีเฟรชระหว่างมื้อ", APP.includes("menuPollId=setInterval")],
  ["ยอดลูกค้าคิดสูตรเดียวกับ POS", APP.includes("const custBill=useMemo(()=>{")],
  ["ของค้างในมือถือหมดอายุ", APP.includes("const OUTBOX_MAX_AGE=")],
  ["ตัวพิมพ์: กัน tick ซ้อน", AGENT.includes("let tickBusy = false;")],
  ["ตัวพิมพ์: พิมพ์ไม่ผ่าน = ไม่มาร์คว่าพิมพ์แล้ว", AGENT.includes("if (ok) { state.sig[o.id] = sig; state.uat[o.id] = uatOf.get(String(o.id)) || null; }")],
  // ห้ามตัดสินจากอายุ onAt — ตัวพิมพ์เขียนเฉพาะตอนสถานะเปลี่ยน ค่าเก่าไม่ได้แปลว่าตาย
  ["ป้ายสถานะดูสัญญาณชีพตัวพิมพ์ ไม่ใช่อายุค่าเดิม", APP.includes("const agentOk=h.state===") && !APP.includes("const fresh=age<3*60*1000;")],
  // เจ้าของสั่ง: ให้มีแค่เขียว/แดง ไม่มีสีที่สาม
  ["สถานะเครื่องพิมพ์มีแค่ออนไลน์/ออฟไลน์", !APP.includes("ไม่ได้รายงาน (ตัวพิมพ์อาจหยุด)") && !APP.includes("[p.id]:!agentOk") && APP.includes("const stView=(st)=>st===")],
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
  // เครื่องพิมพ์: จอต้องเห็นเฉพาะของสาขาที่เปิดอยู่ (+ ที่ตั้งเป็นทุกสาขา)
  // ถ้าหลุดกติกานี้ จะเห็นเครื่องของสาขาอื่น กดสั่งพิมพ์แล้วไม่มีตัวไหนรับ
  ["มีตัวช่วยกลาง printersAt", APP.includes("const printersAt=(list,bid)=>")],
  ["กติกาตรงกับ print-agent (null = ทุกสาขา)",
    APP.includes("p.branch_id==null||+p.branch_id===+bid") && AGENT.includes("p.branch_id == null || +p.branch_id === +BRANCH")],
  ["โหลดเครื่องพิมพ์ครั้งแรก กรองตามสาขา", APP.includes("setPrinters(printersAt(pr,currentBranch.id))")],
  ["โหลดซ้ำ กรองตามสาขา", APP.includes("setPrinters(printersAt(d,currentBranch.id))")],
  ["เส้นทาง POS แยก กรองตามสาขา", APP.includes("setPrinters(printersAt(prs,branchId))")],
  // ทางลัดหน้าจอโฮม: iOS อ่าน start_url จาก manifest ไม่ใช่ URL ที่เปิดอยู่
  // Safari อ่าน manifest ครั้งเดียวตอนโหลดหน้า — ต้องตัดสินใน index.html
  // ไม่ใช่สลับทีหลังด้วย React (เคยทำแล้วไม่ทัน ทางลัดยังพาไปหลังบ้าน)
  ["ไม่มีลิงก์ manifest ตายตัวใน HTML แล้ว", !HTML.includes('<link rel="manifest"')],
  ["React ไม่ไปยุ่งกับ manifest อีก", !APP.includes('link[rel="manifest"]')],
  ["ทางลัดจอขายชี้ไป manifest ของสาขานั้น", pickManifest("?pos=1&branch=8").href === "/pos-8.webmanifest"],
  ["ชื่อบนหน้าจอโฮมเป็น 'ขายหน้าร้าน'", pickManifest("?pos=1&branch=8").title === "ขายหน้าร้าน"],
  ["หน้าแรกยังได้ manifest หลัก", pickManifest("").href === "/manifest.webmanifest"],
  ["pos=1 แต่ไม่มีเลขสาขา = ใช้ตัวหลัก", pickManifest("?pos=1").href === "/manifest.webmanifest"],
  ["เลขสาขาที่ไม่ใช่ตัวเลข ต้องไม่ถูกเอาไปต่อ path", pickManifest("?pos=1&branch=../evil").href === "/manifest.webmanifest"],
  ["หน้าลูกค้า (scan) ไม่ใช่ manifest ของจอขาย", pickManifest("?scan=1&branch=8&table=1").href === "/manifest.webmanifest"],
  ["ไฟล์ manifest ของทุกสาขาที่สร้างไว้ มีอยู่จริง", (() => {
    const dir = new URL("../public/", import.meta.url);
    const files = fs.readdirSync(dir).filter(f => /^pos-[0-9]+[.]webmanifest$/.test(f));
    if (!files.length) return false;
    return files.every(f => {
      const j = JSON.parse(fs.readFileSync(new URL(f, dir), "utf8"));
      const id = f.match(/[0-9]+/)[0];
      return j.start_url === "/?pos=1&branch=" + id;
    });
  })()],
  ["มีสคริปต์สร้าง manifest รายสาขา", fs.existsSync(new URL("./make-pos-manifests.mjs", new URL("../scripts/", import.meta.url)))],
  ["build เรียกสคริปต์สร้าง manifest", JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts.build.includes("make-pos-manifests")],
  // ── กติกา "เครื่องไหนรับหมวดอะไร" (รันฟังก์ชันจริงจากตัวพิมพ์) ──
  ["ติ๊กหมวดไหน = รับเฉพาะหมวดนั้น",
    handlesOf({ id: 1, categories: ["ชาบู"] }, { category: "ชาบู" }) === true &&
    handlesOf({ id: 1, categories: ["ชาบู"] }, { category: "หมูกระทะ" }) === false],
  ["ล้างหมดแล้ว = ไม่รับอะไรเลย (ไม่ใช่รับทุกอย่าง)",
    handlesOf({ id: 1, categories: [] }, { category: "ชาบู" }) === false],
  ["ปักหมุดเมนูไว้ที่เครื่องไหน = ออกเครื่องนั้นเท่านั้น",
    handlesOf({ id: 7, categories: [] }, { printer_id: 7, category: "ชาบู" }) === true &&
    handlesOf({ id: 8, categories: ["ชาบู"] }, { printer_id: 7, category: "ชาบู" }) === false],
  ["เครื่องเก่าที่ยังเป็น null ยังรับทุกหมวดอยู่ (ของเดิมไม่พัง)",
    handlesOf({ id: 1, categories: null }, { category: "อะไรก็ได้" }) === true],
  // ── เลิกใช้ catch-all: ติ๊กคือตัวตัดสินอย่างเดียว ──
  ["แอปไม่มีการ์ด 'รับทุกหมวด' แล้ว", !APP.includes("รับทุกหมวด (พิมพ์ทุกเมนู)") && !APP.includes("sAllCats")],
  ["แอปไม่มีปุ่ม catch-all แล้ว", !APP.includes("ทุกหมวด (catch-all)")],
  ["บันทึกหมวดเป็นรายการเสมอ ไม่เขียน null",
    APP.includes("categories:sCats,description") && APP.includes("categories:catSel||[...allCategories]")],
  ["เปิดเครื่องเดิมที่เป็น null มาให้ติ๊กครบ (ตรงกับที่มันทำอยู่จริง)",
    APP.includes("setSCats(Array.isArray(p.categories)?[...p.categories]:[...branchCategories])")],
  ["ปุ่มเลือกทุกหมวด/ล้าง ยังทำงานตรงไปตรงมา",
    APP.includes("setSCats([...branchCategories])") && APP.includes("setSCats([])") &&
    APP.includes("setCatSel([...allCategories])") && APP.includes("setCatSel([])")],
  // ── ปุ่มส่งรายการต้องอยู่กับที่ ──
  ["จอสั่งอาหารใช้โมดัลแบบไม่เลื่อนทั้งก้อน", APP.includes("onDone={loadAll}") && APP.includes("loadAll();}} wide noScroll>")],
  ["แผงสั่งอาหารไม่ยืนกรานความสูง 75vh แล้ว", !APP.includes('minHeight:isMobile?"calc(100vh - 60px)":"75vh"')],
  // ── ใบ QR โต๊ะ: ภาษาไทยต้องออกเป็นรูป ไม่ใช่ข้อความ ──
  ["ชิ้นแรกสั่ง init (0x1b,0x40)", escHead({}, 8, 8).slice(0, 2).join(",") === "27,64"],
  ["ชิ้นถัดมาไม่ init ซ้ำ", escHead({ noInit: true }, 8, 8).slice(0, 2).join(",") === "27,97"],
  ["ชิ้นที่ยังไม่จบไม่ตัดกระดาษ", escTail({ noCut: true }).length === 0],
  ["ชิ้นสุดท้ายตัดกระดาษ (GS V A)", escTail({}).join(",").includes("29,86,65")],
  ["QR เนทีฟฝังลิงก์ที่ส่งไปจริง", (() => {
    const url = "https://foodcost-eta.vercel.app/?scan=1&branch=8&table=1";
    const b = qrBytesOf(url);
    const txt = b.map(x => String.fromCharCode(x)).join("");
    return txt.includes(url) && b.join(",").includes("29,40,107");
  })()],
  ["ใบ QR สร้างเป็นรูปแล้ว (ไทยไม่เพี้ยน)", APP.includes("async function buildTableQRB64(table,branch,url)")],
  ["ทาง LAN ส่งใบ QR เป็นคำสั่งรูป (pj) ไม่ใช่ข้อความ",
    APP.includes('cmdDesc(p,"pj",{at,b64})') && !APP.includes('cmdDesc(p,"qr",{at,url')],
  ["ทางบลูทูธส่งเป็นไบต์ ไม่ใช่ base64", APP.includes("btPrint(b64Bytes(await buildTableQRB64(table,branch,url))")],
  // ── แบ่งจ่าย: ยอดต้องบวกกลับได้เท่าเดิมเป๊ะทุกกรณี ──
  ["฿1000 หาร 3 คน บวกกลับได้ 1000 พอดี", sumOf(splitEvenlyOf(1000, 3)) === 1000],
  ["฿1000 หาร 3 คน = 333.34 + 333.33 + 333.33", splitEvenlyOf(1000, 3).join(",") === "333.34,333.33,333.33"],
  ["เศษ 1 สตางค์ไม่หาย", sumOf(splitEvenlyOf(0.01, 3)) === 0.01],
  ["หารลงตัวก็ต้องเท่ากันทุกคน", splitEvenlyOf(900, 3).join(",") === "300,300,300"],
  ["คนเดียวได้เต็มยอด", splitEvenlyOf(1234.56, 1).join(",") === "1234.56"],
  ["จำนวนคนเพี้ยน (0) ไม่ทำให้ยอดหาย", sumOf(splitEvenlyOf(500, 0)) === 500],
  ["สุ่ม 400 กรณี ยอดกระทบกันครบทุกกรณี", (() => {
    for (let t = 1; t <= 20; t++) for (let n = 1; n <= 20; n++) {
      const amt = Math.round((t * 137.77 + n * 3.19) * 100) / 100;
      const parts = splitEvenlyOf(amt, n);
      if (parts.length !== n) return false;
      if (sumOf(parts) !== amt) return false;
      if (parts.some(p => p < 0)) return false;
      // ต่างกันได้ไม่เกิน 1 สตางค์ ไม่งั้นไม่เรียกว่าแบ่งเท่ากัน
      if (Math.round((Math.max(...parts) - Math.min(...parts)) * 100) > 1) return false;
    }
    return true;
  })()],
  // ── ปุ่มในแถบจัดการบิล ──
  ["เอาปุ่มพิมพ์ครัวออกแล้ว", !APP.includes('title="พิมพ์ใบครัวซ้ำทั้งหมด (ผ่านตัวพิมพ์)"')],
  ["พิมพ์ซ้ำรายรายการยังอยู่", APP.includes("agentReprint([item])")],
  ["เรียกว่า 'แบ่งจ่าย' ไม่ใช่ 'แยกบิล' แล้ว", APP.includes("แบ่งจ่าย") && !APP.includes("แยกบิล")],
  ["แบ่งจ่ายมีครบสามแบบ",
    APP.includes('tabBtn("even","เท่ากัน")') && APP.includes('tabBtn("item","ตามรายการ")') && APP.includes('tabBtn("amount","ระบุยอด")')],
  ["โหมดระบุยอดกันใส่เกินยอดบิล", APP.includes("Math.max(0,Math.min(total,+String(splitAmt)")],
  ["แบ่งจ่ายไม่ปิดบิล (ปิดบิลยังทำที่เช็คบิลที่เดียว)", APP.includes('payment_method:"split"') && !APP.includes('setSplitDone(p=>({...p,[key]:true}));await saveOrder')],
  // ── หน้าขายกับหลังบ้านต้องเห็นข้อมูลชุดเดียวกัน ──
  ["หน้าขายดึงตั้งค่าใหม่เป็นระยะ (ไม่ใช่โหลดครั้งเดียว)",
    APP.includes("const light=()=>{loadPosSettings();loadPromotions();loadZones();")],
  ["หน้าขายดึงเมนูใหม่ด้วย (ราคาต้องตรงกับหลังบ้าน)", APP.includes("if(++n%5===0)heavy();")],
  ["สลับแท็บกลับมาแล้วดึงทันที", APP.includes('const onVis=()=>{if(!document.hidden){light();heavy();}};')],
  ["ตัวจับเวลาถูกเคลียร์ตอนออกจากหน้า", APP.includes("return()=>{clearInterval(t);document.removeEventListener(\"visibilitychange\",onVis);};")],
  ["ปุ่มรีเฟรชดึงตั้งค่า+เมนูด้วย ไม่ใช่แค่ออเดอร์",
    APP.includes("if(refreshTick){loadAll();try{reloadMenus&&reloadMenus();}catch{}try{reloadPosSettings&&reloadPosSettings();}catch{}}")],
  // ── QR จ่ายเงิน ──
  // ── ตั้งค่า POS ต้องเหมือนกันทั้งหลังบ้านและหน้าร้าน (เจ้าของสั่งไว้) ──
  // เดิมเป็นฟอร์มคนละชุด หลังบ้าน 11 ฟิลด์ หน้าร้าน 5 — ขาดค่าบริการกับ PromptPay
  ["ฟอร์มตั้งค่า POS มีชุดเดียว", APP.split("function POSSettingsFields").length - 1 === 1],
  ["ทั้งสองจอใช้ฟอร์มชุดเดียวกัน", APP.split("<POSSettingsFields ").length - 1 === 2],
  ["ช่องแนบรูป QR มีนิยามที่เดียว (ไม่ก๊อปสองชุด)", APP.split("promptpay_qr_image',v)").length - 1 === 1],
  ["ค่าบริการอยู่ในฟอร์มกลาง (หน้าร้านจึงเห็นด้วย)",
    APP.includes("service_charge_enabled") && APP.includes("service_charge_rate")],
  ["แนบรูป QR เองได้ (เก็บเป็น Drive ref ไม่ใช่ base64)",
    APP.includes("set('promptpay_qr_image',v)") && APP.includes("<ImgUp label=\"\" value={settings.promptpay_qr_image")],
  ["ใบเสร็จใช้รูปที่แนบก่อน ถ้าไม่มีค่อยสร้างจากเบอร์",
    APP.includes("if(posSettings.promptpay_qr_image){") && APP.includes("}else if(posSettings.promptpay_id){")],
  ["QR แบบรูปต้องพิมพ์ยอดกำกับ (รูปไม่มียอดฝัง)",
    APP.includes('lines.push({t:"ยอดที่ต้องชำระ ฿"+(+order.total||0).toFixed(2)')],
  ["ปุ่มในป็อปอัพชำระเงินเป็นพิมพ์ QR จ่ายเงิน", APP.includes("onClick={onPrintQR}") && APP.includes("พิมพ์ QR จ่ายเงิน")],
  // ปุ่มนี้ถูกกดทุกบิล (ลูกค้าตรวจยอดก่อนยืนยัน) — ต้องเด่น ไม่ใช่ปุ่มโปร่งตัวเล็ก
  ["ปุ่มพิมพ์ QR เป็นสีส้มเด่น ไม่ใช่ปุ่มโปร่ง",
    APP.includes('<Btn v="primary" onClick={onPrintQR}') && !APP.includes('<Btn v="ghost" onClick={onPrintQR}')],
  ["ปุ่มพิมพ์ QR ใหญ่พอๆ กับปุ่มยืนยัน", APP.includes('s={{flex:"1 1 44%",padding:"15px 12px",fontSize:15.5')],
  // แถบสามปุ่มบนจอสั่งอาหารถูกย้ายเข้าป็อปอัพเช็คบิล — ไม่ใช่ลบความสามารถทิ้ง
  // ยกเลิกบิล/พิมพ์ใบเสร็จซ้ำ ไม่มีทางเข้าอื่นเลย ถ้าหายไปคือทำไม่ได้อีกเลย
  ["แถบสามปุ่มออกจากจอสั่งอาหารแล้ว", !APP.includes("{/* Quick action bar */}")],
  ["แถบ 'ยอดนิยม' ออกจากจอสั่งอาหารแล้ว", !APP.includes("quickKeys")],
  ["ยกเลิกบิลยังเข้าถึงได้ (ในป็อปอัพเช็คบิล)", APP.includes("onClick={onCancelOrder}") && APP.includes("onCancelOrder={cancelOrder}")],
  ["พิมพ์ใบเสร็จซ้ำยังเข้าถึงได้", APP.includes("onClick={onReprint}") && APP.includes("onReprint={reprintReceipt}")],
  ["แบ่งจ่ายย้ายเข้าป็อปอัพเช็คบิล", APP.includes("onClick={onSplit}") && APP.includes("onSplit={()=>setShowSplitBill(true)}")],
  ["ป็อปอัพแบ่งจ่ายซ้อนเหนือเช็คบิล (ไม่ไปโผล่ข้างหลัง)", APP.includes("zIndex:4500")],
  ["ใบ QR จ่ายเงินใช้ยอดสด ไม่ใช่ยอดจากแถวบิลที่ยังไม่ปิด",
    APP.includes("function printPayQR(){") && APP.includes("subtotal,discount:round2(manualDiscount),total,")],
  // ── ป็อปอัพเลื่อนแล้วพื้นหลังต้องอยู่นิ่ง ──
  ["กันเลื่อนทะลุไปพื้นหลัง", APP.includes("div{overscroll-behavior:contain}")],
  // เปิดจากไอคอนหน้าจอโฮม เนื้อหากินขึ้นไปใต้แถบสถานะ iOS — หัวจอต้องเผื่อไว้
  ["หัวจอขายไม่ทับเวลา/แบตของ iOS", APP.includes("calc(10px + env(safe-area-inset-top,0px))") && APP.includes("calc(12px + env(safe-area-inset-top,0px))")],
  ["ล็อกหน้าแบบที่ iOS ยอมรับ (ตรึง body ไม่ใช่ overflow:hidden)", APP.includes('b.position="fixed";b.top=') && APP.includes("window.scrollTo(0,_savedScrollY)")],
  ["นับป็อปอัพซ้อน ปลดล็อกเมื่อปิดตัวสุดท้าย", APP.includes("_modalDepth=Math.max(0,_modalDepth-1);") && APP.includes("if(_modalDepth===1){") && APP.includes("if(_modalDepth===0){")],
  ["Modal เรียกตัวล็อก", APP.includes("useScrollLock();") && APP.includes("function useScrollLock(){")],
  ["รูปจางยังพิมพ์ติด (ไม่หายเงียบ)", APP.includes("if(a>40&&lum<175)")],
  // ── ใบครัวไม่ออก ต้องเห็นในระบบ ไม่ใช่หายเงียบ ──
  // ระบบไม่พิมพ์ซ้ำเองแล้ว ถ้าไม่แสดงให้เห็น ครัวจะไม่รู้เลยว่ามีใบตกหล่น
  ["มีตัวอ่านรายการที่พิมพ์ไม่ออก", APP.includes("const printFailsOf=(printers)=>")],
  ["ผังโต๊ะขึ้นป้ายเตือนที่โต๊ะนั้น", APP.includes("⚠️ ใบครัวไม่ออก")],
  ["ผังโต๊ะได้รับข้อมูลเครื่องพิมพ์", APP.includes("<POSTableMap tables={tables} activeOrders={activeOrders} zones={zones} printers={printers}")],
  ["จอสั่งอาหารมีปุ่มให้พนักงานกดพิมพ์เอง", APP.includes("พิมพ์ใบครัวรายการนี้อีกครั้ง")],
  ["กดพิมพ์แล้วล้างรายการเตือนออก", APP.includes("async function clearPrintFail()") && APP.includes("await clearPrintFail();")],
  // ── หมวดคุมจากครัวกลางที่เดียว สาขาแก้เองไม่ได้ ──
  ["จอขายไม่มีเมนูจัดการหมวดแล้ว", !APP.includes("เพิ่ม/แก้/ลบหมวด")],
  ["ไม่เหลือโค้ดเปิดจอจัดการหมวดที่ตายแล้ว", !APP.includes("active===\"cats\"")],
  // ── จอเมนูทั้งหมด: กดแยกดูตามหมวดได้ ──
  ["จอเมนูทั้งหมดมีแถบหมวด", APP.includes("const catList=(()=>{") && APP.includes("if(cat&&menuCatOf(m)!==cat)return false;")],
  // ── ติ๊กหมวดแล้วเมนูข้างในต้องขึ้นติ๊กตาม ไม่ให้สับสน ──
  ["ติ๊กหมวด = เมนูในหมวดขึ้นติ๊กตาม", APP.includes("checked={has||here} disabled={has}")],
  // ── เรียงชื่อไทยในป๊อบอัพกำหนดการพิมพ์ (26 หมวด/169 เมนู ไล่หาด้วยตาล้วนๆ) ──
  // .sort() เปล่าๆ เรียงตามรหัสตัวอักษร สระหน้ามีรหัสสูงกว่าพยัญชนะทุกตัว
  // "ไก่ทอด" เลยไปกองท้ายตารางแทนที่จะอยู่หมวด ก
  ["สระหน้า ไ ไปนับที่พยัญชนะถัดไป (ไก่ทอด อยู่หมวด ก)",
    thSort(["ขนม", "ไก่ทอด", "จิ้มจุ่ม"]).join("|") === "ไก่ทอด|ขนม|จิ้มจุ่ม"],
  ["สระหน้า เ ก็เหมือนกัน (เคลียมัทฉะ อยู่หมวด ค)",
    thSort(["มัทฉะลาเต้", "เคลียมัทฉะ", "ลาเต้"]).join("|") === "เคลียมัทฉะ|มัทฉะลาเต้|ลาเต้"],
  ["สระหน้า โ/ใ/แ ครบทุกตัว",
    thSort(["โอเลี้ยง", "ใบเตย", "แกงส้ม", "ชาเย็น"]).join("|") === "แกงส้ม|ชาเย็น|ใบเตย|โอเลี้ยง"],
  // ชุดเมนูจริงมี "เซต 1..10" ถ้าเรียงทีละอักษรจะได้ 1, 10, 2 ซึ่งอ่านแล้วสะดุด
  ["เลขในชื่อเรียงตามค่า ไม่ใช่ทีละอักษร",
    thSort(["เซต 10", "เซต 2", "เซต 1"]).join("|") === "เซต 1|เซต 2|เซต 10"],
  ["ชื่ออังกฤษปนอยู่ก็ไม่พัง (ไปต่อท้ายไทย)",
    thSort(["Refill", "กาแฟ", "ผัก"]).join("|") === "กาแฟ|ผัก|Refill"],
  ["ชื่อว่าง/หายไป ไม่ทำให้ทั้งจอล้ม",
    (() => { try { return thSort([undefined, "กาแฟ", null, ""]).length === 4; } catch { return false; } })()],
  // ถ้าข้อบนผ่านเพราะ .sort() ธรรมดาก็ให้ผลเดียวกัน ข้อทดสอบก็ไม่ได้พิสูจน์อะไร
  ["ชุดทดสอบนี้แยกผลจาก .sort() ธรรมดาได้จริง",
    thSort(["ขนม", "ไก่ทอด"]).join("|") !== ["ขนม", "ไก่ทอด"].sort().join("|")],
  ["หัวหมวดในกำหนดการพิมพ์เรียงแบบไทย", APP.includes("return [...s].sort(thCmp);")],
  ["เมนูในแต่ละหมวดเรียงแบบไทย",
    APP.includes(".filter(m=>effCat(m)===c).sort((a,b)=>thCmp(a.name,b.name))")],
  // .filter() คืนอาร์เรย์ใหม่ก่อนเสมอ ไม่งั้น .sort() จะไปสลับลำดับ menus ตัวจริง
  ["เรียงบนสำเนา ไม่ไปสลับ menus ตัวจริง",
    !APP.includes("menus.sort(") && !APP.includes("(menus||[]).sort(")],
  // สร้าง Collator ใหม่ทุกครั้งที่เทียบ = ช้ามากเมื่อรายการยาว
  ["สร้าง Collator ไว้ตัวเดียวใช้ซ้ำ", APP.split("new Intl.Collator").length - 1 === 1],
  ["ไม่มีจุดไหนใส่รายการดิบลง state อีก",
    !APP.includes("setPrinters(pr);") && !APP.includes("setPrinters(d);") && !APP.includes("setPrinters(prs||[]);")],
];
for (const [label, cond] of guards) ok_(label, cond);

console.log(`\n${"═".repeat(52)}`);
console.log(fail === 0 ? `✅ ผ่านทั้งหมด ${pass} ข้อ` : `❌ ล้มเหลว ${fail} ข้อ (ผ่าน ${pass})`);
process.exitCode = fail ? 1 : 0;
