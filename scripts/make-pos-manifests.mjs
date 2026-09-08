// ═══════════════════════════════════════════════════════════════════════════
// สร้าง manifest ของ "ขายหน้าร้าน" แยกรายสาขา — รันซ้ำได้ ผลลัพธ์เหมือนเดิม
//   node scripts/make-pos-manifests.mjs
//
// ทำไมต้องมีไฟล์แยกรายสาขา:
// iOS ตอนกด "เพิ่มไปยังหน้าจอโฮม" ไม่ได้ใช้ URL ที่เปิดอยู่ แต่ไปอ่าน start_url
// จาก manifest — ตัวหลักชี้ไปที่ "/" ซึ่งเป็นหน้าเข้าระบบหลังบ้าน พนักงานจึงได้
// ทางลัดผิดตัว ต้องมี manifest ที่ start_url ชี้ไป /?pos=1&branch=<id> ตรงๆ
//
// ทำไมฝังเลขสาขาไว้ใน start_url แทนที่จะจำไว้ใน localStorage:
// เว็บแอปบนหน้าจอโฮมของ iOS ใช้พื้นที่เก็บข้อมูล "แยกคนละถัง" กับ Safari
// ค่าที่เขียนตอนเปิดใน Safari จะอ่านไม่เจอตอนเปิดจากไอคอน — พึ่งไม่ได้
//
// ทำไมไม่ทำเป็น API ไดนามิก: Vercel แผนนี้จำกัด 12 serverless function
// และตอนนี้ใช้ครบ 12 พอดี (ดู api/) — เพิ่มอีกตัวไม่ได้
//
// ⚠️ ไฟล์ผลลัพธ์ public/pos-*.webmanifest เป็นของที่สคริปต์สร้าง อย่าแก้ด้วยมือ
// เพิ่มสาขาใหม่แล้วให้รันสคริปต์นี้ใหม่ (build เรียกให้อัตโนมัติอยู่แล้ว)
// ═══════════════════════════════════════════════════════════════════════════
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const SUPA = "https://niplvsfxynrufiyvbwme.supabase.co/rest/v1";
const KEY = "sb_publishable_jpym6Xg4gOIPWDUDt5IntQ_7Bbh9KcZ";

// ถ้าดึงรายชื่อสาขาไม่ได้ (เน็ตสะดุดตอน build) ให้ใช้ช่วงเลขนี้แทน
// build ต้องไม่พังเพราะเรื่องนี้ — ไฟล์เกินมาไม่กินอะไร ไฟล์ขาดต่างหากที่เจ็บ
const FALLBACK = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: "" }));

async function getBranches() {
  try {
    const r = await fetch(`${SUPA}/branches?select=id,name,type,active&order=id`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(await r.text());
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error("ไม่มีข้อมูลสาขา");
    // ครัวกลางไม่ได้ขายหน้าร้าน (แอปกันไว้แล้ว) — ไม่ต้องมีทางลัด
    return rows.filter(b => b.type !== "central");
  } catch (e) {
    console.log(`  ⚠️  ดึงรายชื่อสาขาไม่ได้ (${e.message}) — ใช้ช่วงเลขสำรอง 1-20`);
    return FALLBACK;
  }
}

const manifestFor = (b) => JSON.stringify({
  name: b.name ? `ขายหน้าร้าน · ${b.name}` : "ขายหน้าร้าน",
  short_name: "ขายหน้าร้าน",
  description: "รับออเดอร์ จัดการโต๊ะ พิมพ์ QR ให้ลูกค้าสแกนสั่งอาหาร",
  lang: "th",
  dir: "ltr",
  start_url: `/?pos=1&branch=${b.id}`,
  scope: "/",
  // ใช้ minimal-ui เท่ากับตัวหลักโดยตั้งใจ — เหลือปุ่มรีโหลดไว้ให้พนักงาน
  // ถ้าจอค้างกลางร้าน standalone จะไม่มีทางรีโหลดเลย
  display: "minimal-ui",
  display_override: ["minimal-ui"],
  orientation: "any",
  theme_color: "#F2EBE3",
  background_color: "#FFFBF6",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2) + "\n";

const branches = await getBranches();

// ล้างของเก่าก่อน — สาขาที่ถูกลบไปแล้วต้องไม่มีไฟล์ค้าง
for (const f of fs.readdirSync(PUB)) {
  if (/^pos-\d+\.webmanifest$/.test(f)) fs.unlinkSync(path.join(PUB, f));
}
for (const b of branches) {
  fs.writeFileSync(path.join(PUB, `pos-${b.id}.webmanifest`), manifestFor(b));
}
console.log(`  ✅ สร้าง manifest ขายหน้าร้าน ${branches.length} สาขา: ${branches.map(b => b.id).join(", ")}`);
