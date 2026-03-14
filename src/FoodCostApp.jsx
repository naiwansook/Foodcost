import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const SUPA_URL = "https://niplvsfxynrufiyvbwme.supabase.co";
const SUPA_KEY = "sb_publishable_jpym6Xg4gOIPWDUDt5IntQ_7Bbh9KcZ";

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": opts.prefer || "return=representation", ...opts.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const api = {
  getIngs: (bid) => sb(`ingredients?order=id.asc${bid ? `&branch_id=eq.${bid}` : ""}`),
  addIng: (d) => sb("ingredients", { method: "POST", body: JSON.stringify(d) }),
  updateIng: (id, d) => sb(`ingredients?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteIng: (id) => sb(`ingredients?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getMenus: (bid) => sb(`menus?order=id.asc${bid ? `&branch_id=eq.${bid}` : ""}`),
  addMenu: (d) => sb("menus", { method: "POST", body: JSON.stringify(d) }),
  updateMenu: (id, d) => sb(`menus?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteMenu: (id) => sb(`menus?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getCats: () => sb("categories?order=id.asc"),
  addCat: (d) => sb("categories", { method: "POST", body: JSON.stringify(d) }),
  deleteCat: (id) => sb(`categories?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getUsers: () => sb("app_users?order=id.asc"),
  addUser: (d) => sb("app_users", { method: "POST", body: JSON.stringify(d) }),
  updateUser: (id, d) => sb(`app_users?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteUser: (id) => sb(`app_users?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  loginUser: (u, p) => sb(`app_users?username=eq.${u}&password=eq.${p}&active=eq.true`),
  getBranches: () => sb("branches?order=id.asc"),
  addBranch: (d) => sb("branches", { method: "POST", body: JSON.stringify(d) }),
  updateBranch: (id, d) => sb(`branches?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteBranch: (id) => sb(`branches?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getSuppliers: () => sb("suppliers?order=id.asc"),
  addSupplier: (d) => sb("suppliers", { method: "POST", body: JSON.stringify(d) }),
  updateSupplier: (id, d) => sb(`suppliers?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteSupplier: (id) => sb(`suppliers?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getCostHist: (bid) => sb(`cost_history?order=id.desc&limit=50${bid ? `&branch_id=eq.${bid}` : ""}`),
  addCostHist: (d) => sb("cost_history", { method: "POST", body: JSON.stringify(d) }),
  clearCostHist: (bid) => sb(`cost_history?${bid ? `branch_id=eq.${bid}` : "id=gt.0"}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getActionHist: () => sb("action_history?order=id.desc&limit=100"),
  addActionHist: (d) => sb("action_history", { method: "POST", body: JSON.stringify(d) }),
  clearActionHist: () => sb("action_history?id=gt.0", { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getOrders: (bid) => sb(`order_requests?order=id.desc${bid ? `&branch_id=eq.${bid}` : ""}`),
  addOrder: (d) => sb("order_requests", { method: "POST", body: JSON.stringify(d) }),
  updateOrder: (id, d) => sb(`order_requests?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(d) }),
  deleteOrder: (id) => sb(`order_requests?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } }),
  getAllOrders: () => sb("order_requests?order=id.desc"),
  uploadImage: async (file, path) => {
    const res = await fetch(`${SUPA_URL}/storage/v1/object/foodcost-images/${path}`, {
      method: "POST", headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": file.type, "x-upsert": "true" }, body: file,
    });
    if (!res.ok) throw new Error(await res.text());
    return `${SUPA_URL}/storage/v1/object/public/foodcost-images/${path}`;
  },
};

const C = {
  brand:"#FF6B35",brandDark:"#E85520",brandLight:"#FFF4F0",brandBorder:"#FFD4C2",
  green:"#10B981",greenLight:"#ECFDF5",blue:"#3B82F6",blueLight:"#EFF6FF",
  yellow:"#F59E0B",yellowLight:"#FFFBEB",red:"#EF4444",redLight:"#FEF2F2",
  purple:"#8B5CF6",purpleLight:"#F5F3FF",teal:"#0D9488",tealLight:"#F0FDFA",
  ink:"#0F172A",ink2:"#334155",ink3:"#64748B",ink4:"#94A3B8",
  line:"#E2E8F0",lineLight:"#F1F5F9",bg:"#F8FAFC",white:"#FFFFFF",
};

const Ic = ({ d, s=18, c="currentColor", sw=1.75 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {Array.isArray(d)?d.map((p,i)=><path key={i} d={p}/>):<path d={d}/>}
  </svg>
);
const I = {
  leaf:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M8 12s1-4 4-4 4 4 4 4",
  fire:"M12 2c0 6-6 7-6 12a6 6 0 0012 0c0-5-6-6-6-12z",
  sop:["M9 12h6","M9 16h6","M9 8h2","M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z","M13 2v7h7"],
  chart:["M18 20V10","M12 20V4","M6 20v-6"],
  clock:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  plus:["M12 5v14","M5 12h14"],
  search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  pencil:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  x:["M18 6L6 18","M6 6l12 12"],
  check:"M5 13l4 4L19 7",
  img:["M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z","M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z","M21 15l-5-5L5 21"],
  save:["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z","M17 21v-8H7v8","M7 3v5h8"],
  dl:["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M7 10l5 5 5-5","M12 15V3"],
  user:["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8z"],
  lock:["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"],
  settings:["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  logout:["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"],
  tag:"M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  bolt:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  warning:"M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  calendar:["M8 2v4","M16 2v4","M3 8h18","M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"],
  printer:["M6 9V2h12v7","M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2","M6 14h12v8H6z"],
  sortAsc:["M3 8h8","M3 12h6","M3 16h4","M17 20V4","M13 8l4-4 4 4"],
  sortDesc:["M3 8h8","M3 12h6","M3 16h4","M17 4v16","M13 16l4 4 4-4"],
  eye:["M1 12s4-8 11-8 11 8 11 8","M1 12s4 8 11 8 11-8 11-8","M12 9a3 3 0 100 6 3 3 0 000-6z"],
  users:["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  refresh:"M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15",
  cloud:"M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
  branch:["M6 3v12","M18 9a3 3 0 100-6 3 3 0 000 6z","M6 21a3 3 0 100-6 3 3 0 000 6z","M15 6a9 9 0 01-9 9"],
  truck:["M1 3h15v13H1z","M16 8h4l3 3v5h-7V8z","M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z","M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"],
  shop:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  send:["M22 2L11 13","M22 2L15 22 11 13 2 9l20-7z"],
  box:"M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  arrowRight:"M5 12h14 M12 5l7 7-7 7",
  chevD:"M19 9l-7 7-7-7",
};

const ALL_PERMS=[
  {id:"view_ingredients",label:"ดูวัตถุดิบ",group:"วัตถุดิบ"},{id:"edit_ingredients",label:"แก้ไขวัตถุดิบ",group:"วัตถุดิบ"},{id:"delete_ingredients",label:"ลบวัตถุดิบ",group:"วัตถุดิบ"},
  {id:"view_menus",label:"ดูเมนู",group:"เมนู"},{id:"edit_menus",label:"แก้ไขเมนู",group:"เมนู"},{id:"delete_menus",label:"ลบเมนู",group:"เมนู"},
  {id:"view_sop",label:"ดู SOP",group:"SOP"},{id:"edit_sop",label:"แก้ไข SOP",group:"SOP"},
  {id:"view_summary",label:"ดูสรุปต้นทุน",group:"สรุปต้นทุน"},{id:"edit_summary",label:"บันทึกสรุปต้นทุน",group:"สรุปต้นทุน"},
  {id:"view_history",label:"ดูประวัติ",group:"ประวัติ"},{id:"view_orders",label:"ดูสั่งวัตถุดิบ",group:"สั่งวัตถุดิบ"},{id:"edit_orders",label:"แก้ไข/ส่งคำสั่งซื้อ",group:"สั่งวัตถุดิบ"},
  {id:"export",label:"Export ข้อมูล",group:"ระบบ"},{id:"settings",label:"ตั้งค่าระบบ",group:"ระบบ"},
];
const ROLE_DEFAULT_PERMS={
  admin:ALL_PERMS.map(p=>p.id),
  manager:["view_ingredients","edit_ingredients","delete_ingredients","view_menus","edit_menus","delete_menus","view_sop","edit_sop","view_summary","edit_summary","view_history","view_orders","edit_orders","export"],
  staff:["view_ingredients","edit_ingredients","view_menus","edit_menus","view_sop","edit_sop","view_summary","edit_summary","view_history","view_orders"],
  viewer:["view_ingredients","view_menus","view_sop","view_summary","view_history"],
};
function hasPerm(user,perm){return user&&(user.perms||ROLE_DEFAULT_PERMS[user.role]||[]).includes(perm);}
const ROLES={admin:{label:"Admin",color:"purple"},manager:{label:"Manager",color:"blue"},staff:{label:"Staff",color:"green"},viewer:{label:"Viewer",color:"gray"}};
const ppg=(price,gram)=>(gram>0?price/gram:0);
const menuCost=(menu,ings)=>(menu.ingredients||[]).reduce((s,x)=>{const i=ings.find(g=>g.id===x.ingredientId);return s+(i?i.price_per_gram*x.amountGram:0);},0);
const marginColor=(m)=>m>=60?C.green:m>=40?C.yellow:C.red;
const marginLabel=(m)=>m>=60?"ดี":m>=40?"พอใช้":"ต่ำ";
const nowStr=()=>new Date().toLocaleString("th-TH");
const todayStr=()=>new Date().toISOString().slice(0,10);

const iS={width:"100%",padding:"11px 14px",border:`1.5px solid ${C.line}`,borderRadius:10,fontSize:15,fontFamily:"'Sarabun',sans-serif",outline:"none",boxSizing:"border-box",color:C.ink,background:C.white,transition:"border .15s"};
function Field({label,hint,children,style}){return <div style={{marginBottom:16,...style}}>{(label||hint)&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>{label&&<label style={{fontSize:13,fontWeight:600,color:C.ink2,fontFamily:"'Sarabun',sans-serif"}}>{label}</label>}{hint&&<span style={{fontSize:12,color:C.ink4,fontFamily:"'Sarabun',sans-serif"}}>{hint}</span>}</div>}{children}</div>;}
function Inp({label,hint,style:s,...p}){return <Field label={label} hint={hint}><input style={{...iS,...s}} {...p}/></Field>;}
function TA({label,hint,rows=4,...p}){return <Field label={label} hint={hint}><textarea rows={rows} style={{...iS,resize:"vertical",lineHeight:1.8}} {...p}/></Field>;}
function Sel({label,options,...p}){return <Field label={label}><select style={{...iS,appearance:"none",cursor:"pointer"}} {...p}>{options.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}</select></Field>;}
function Btn({children,v="primary",onClick,icon,disabled,full,s,loading}){
  const st={primary:{bg:`linear-gradient(135deg,${C.brand},${C.brandDark})`,c:C.white,sh:`0 4px 16px ${C.brand}44`},success:{bg:`linear-gradient(135deg,${C.green},#059669)`,c:C.white,sh:`0 4px 16px ${C.green}44`},ghost:{bg:C.white,c:C.ink2,sh:`0 0 0 1.5px ${C.line}`},danger:{bg:C.redLight,c:C.red,sh:"none"},info:{bg:`linear-gradient(135deg,${C.blue},#2563EB)`,c:C.white,sh:`0 4px 16px ${C.blue}44`},teal:{bg:`linear-gradient(135deg,${C.teal},#0F766E)`,c:C.white,sh:`0 4px 16px ${C.teal}44`},purple:{bg:`linear-gradient(135deg,${C.purple},#7C3AED)`,c:C.white,sh:`0 4px 16px ${C.purple}44`}}[v]||{bg:C.lineLight,c:C.ink2,sh:"none"};
  return <button onClick={(disabled||loading)?undefined:onClick} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px 20px",borderRadius:10,fontSize:14,fontWeight:700,cursor:(disabled||loading)?"not-allowed":"pointer",border:"none",fontFamily:"'Sarabun',sans-serif",transition:"all .15s",opacity:(disabled||loading)?.6:1,background:st.bg,color:st.c,boxShadow:st.sh,width:full?"100%":undefined,whiteSpace:"nowrap",...s}} onMouseEnter={e=>{if(!disabled&&!loading){e.currentTarget.style.opacity=".85";e.currentTarget.style.transform="translateY(-1px)";}}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="";}}>{loading?<span>⟳ กำลังโหลด...</span>:<>{icon&&<Ic d={icon} s={15} c={st.c}/>}{children}</>}</button>;
}
function Chip({children,color="orange"}){const m={orange:[C.brandLight,C.brand],blue:[C.blueLight,C.blue],green:[C.greenLight,C.green],red:[C.redLight,C.red],yellow:[C.yellowLight,C.yellow],gray:[C.lineLight,C.ink3],purple:[C.purpleLight,C.purple],teal:[C.tealLight,C.teal]};const[bg,tc]=m[color]||m.gray;return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 10px",background:bg,color:tc,borderRadius:20,fontSize:12,fontWeight:700,fontFamily:"'Sarabun',sans-serif"}}>{children}</span>;}
function Card({children,style,onClick,hover}){const[hov,setHov]=useState(false);return <div style={{background:C.white,borderRadius:16,border:`1px solid ${hov&&hover?C.brandBorder:C.line}`,boxShadow:hov&&hover?"0 8px 32px rgba(255,107,53,.12)":"0 2px 8px rgba(15,23,42,.06)",transition:"all .2s",cursor:onClick?"pointer":undefined,...style}} onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>{children}</div>;}
function Modal({title,onClose,children,wide,extraWide}){
  useEffect(()=>{const h=e=>e.key==="Escape"&&onClose();document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[]);
  return <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.white,borderRadius:20,width:"100%",maxWidth:extraWide?1000:wide?760:560,maxHeight:"94vh",display:"flex",flexDirection:"column",boxShadow:"0 40px 100px rgba(15,23,42,.22)",animation:"mIn .22s cubic-bezier(.34,1.56,.64,1)",overflow:"hidden"}}>
      <div style={{padding:"18px 24px 14px",borderBottom:`1px solid ${C.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,background:C.bg}}>
        <span style={{fontFamily:"'Sarabun',sans-serif",fontSize:18,fontWeight:800,color:C.ink}}>{title}</span>
        <button onClick={onClose} style={{background:C.line,border:"none",cursor:"pointer",color:C.ink3,padding:7,borderRadius:8,display:"flex"}}><Ic d={I.x} s={15}/></button>
      </div>
      <div style={{padding:"20px 24px 24px",overflowY:"auto",flex:1}}>{children}</div>
    </div>
  </div>;
}
function EditedBy({username,editAt}){if(!username)return null;return <span style={{fontSize:10,color:C.ink4,fontFamily:"'Sarabun',sans-serif",display:"flex",alignItems:"center",gap:3}}><Ic d={I.user} s={9} c={C.ink4}/>แก้โดย {username}{editAt?` · ${editAt}`:""}</span>;}
function Loading({text="กำลังโหลด..."}){return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:16}}><div style={{width:44,height:44,border:`4px solid ${C.brandLight}`,borderTop:`4px solid ${C.brand}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/><p style={{color:C.ink3,fontFamily:"'Sarabun',sans-serif",fontSize:15}}>{text}</p></div>;}
function ErrBox({msg,onRetry}){return <div style={{background:C.redLight,border:`1px solid ${C.red}22`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}><Ic d={I.warning} s={20} c={C.red}/><span style={{flex:1,color:C.red,fontFamily:"'Sarabun',sans-serif",fontSize:14}}>{msg}</span>{onRetry&&<Btn v="danger" onClick={onRetry} s={{padding:"6px 14px",fontSize:12}}>ลองใหม่</Btn>}</div>;}
function STh({label,col,sortCol,sortDir,onSort}){const active=sortCol===col;return <th onClick={()=>onSort(col)} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:active?C.brand:C.ink3,cursor:"pointer",whiteSpace:"nowrap",userSelect:"none",background:active?C.brandLight:C.bg}}><div style={{display:"flex",alignItems:"center",gap:4}}>{label}<Ic d={active?(sortDir==="asc"?I.sortAsc:I.sortDesc):I.sortAsc} s={12} c={active?C.brand:C.ink4}/></div></th>;}

async function compressImage(file,maxW=800,quality=0.75){return new Promise(resolve=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,maxW/Math.max(img.width,img.height));const w=Math.round(img.width*scale);const h=Math.round(img.height*scale);const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);canvas.toBlob(blob=>{URL.revokeObjectURL(url);resolve(blob);},"image/jpeg",quality);};img.src=url;});}

function ImgUp({value,onChange,label,compact}){
  const ref=useRef();const[uploading,setUploading]=useState(false);
  const h=async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>10*1024*1024){alert("รูปต้องไม่เกิน 10MB");return;}setUploading(true);try{const compressed=await compressImage(f,800,0.75);const path=`${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;const url=await api.uploadImage(new File([compressed],path,{type:"image/jpeg"}),path);onChange(url);}catch(err){alert("อัปโหลดรูปไม่สำเร็จ: "+err.message);}setUploading(false);e.target.value="";};
  return <div style={{marginBottom:compact?0:16}}>{label&&!compact&&<div style={{fontSize:13,fontWeight:600,color:C.ink2,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>{label}</div>}
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {value?<div style={{position:"relative"}}><img src={value} alt="" style={{width:compact?44:96,height:compact?44:96,objectFit:"cover",borderRadius:compact?8:14,border:`2px solid ${C.line}`}}/><button onClick={()=>onChange(null)} style={{position:"absolute",top:-7,right:-7,width:20,height:20,borderRadius:"50%",background:C.red,border:`2px solid ${C.white}`,color:C.white,cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button></div>
      :<div onClick={()=>ref.current?.click()} style={{width:compact?44:96,height:compact?44:96,border:`2px dashed ${C.line}`,borderRadius:compact?8:14,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:uploading?C.brandLight:C.bg,gap:4,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.brand;e.currentTarget.style.background=C.brandLight;}} onMouseLeave={e=>{if(!uploading){e.currentTarget.style.borderColor=C.line;e.currentTarget.style.background=C.bg;}}}>
        {uploading?<span style={{fontSize:10,color:C.brand,fontFamily:"'Sarabun',sans-serif",textAlign:"center",padding:4}}>กำลังอัปโหลด...</span>:<><Ic d={I.img} s={compact?16:24} c={C.ink4}/>{!compact&&<span style={{fontSize:11,color:C.ink4,fontFamily:"'Sarabun',sans-serif"}}>อัปโหลด</span>}</>}
      </div>}
      {!compact&&!value&&!uploading&&<div style={{fontSize:12,color:C.ink4,fontFamily:"'Sarabun',sans-serif",lineHeight:1.6}}>JPG, PNG<br/>ย่อรูปอัตโนมัติ</div>}
      <input ref={ref} type="file" accept="image/*" onChange={h} style={{display:"none"}}/>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════
// ── LOGIN ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════
function LoginPage({onLogin}){
  const[u,setU]=useState("");const[p,setP]=useState("");const[err,setErr]=useState("");const[show,setShow]=useState(false);const[loading,setLoading]=useState(false);
  async function login(){if(!u||!p)return;setLoading(true);setErr("");try{const found=await api.loginUser(u,p);if(found&&found.length>0)onLogin(found[0]);else setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");}catch(e){setErr("เชื่อมต่อ Supabase ไม่ได้");}setLoading(false);}
  return <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.brandLight} 0%,#FEF3C7 50%,${C.blueLight} 100%)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.white,borderRadius:24,padding:"44px 40px",width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(15,23,42,.15)",animation:"mIn .4s cubic-bezier(.34,1.56,.64,1)"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:64,height:64,background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:`0 8px 24px ${C.brand}44`}}><Ic d={I.fire} s={30} c={C.white} sw={2}/></div>
        <h1 style={{fontSize:20,fontWeight:900,color:C.ink,marginBottom:2,fontFamily:"'Sarabun',sans-serif"}}>NAIWANSOOK FOODCOST</h1>
        <p style={{fontSize:11,color:C.ink4,fontFamily:"'Sarabun',sans-serif",letterSpacing:1.5}}>BY BOSSMAX</p>
      </div>
      <div style={{marginBottom:16}}><label style={{display:"block",fontSize:13,fontWeight:600,color:C.ink2,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>ชื่อผู้ใช้</label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.user} s={16} c={C.ink4}/></span><input value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="username" style={{...iS,paddingLeft:40}} autoFocus/></div></div>
      <div style={{marginBottom:20}}><label style={{display:"block",fontSize:13,fontWeight:600,color:C.ink2,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>รหัสผ่าน</label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.lock} s={16} c={C.ink4}/></span><input value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type={show?"text":"password"} placeholder="password" style={{...iS,paddingLeft:40,paddingRight:44}}/><button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer"}}><Ic d={I.eye} s={16} c={C.ink4}/></button></div></div>
      {err&&<div style={{background:C.redLight,color:C.red,borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:6}}><Ic d={I.warning} s={14} c={C.red}/>{err}</div>}
      <Btn onClick={login} full loading={loading}>เข้าสู่ระบบ</Btn>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════
// ── BRANCH SELECTOR ───────────────────────────────────
// ══════════════════════════════════════════════════════
function BranchSelector({branches,onSelect,user}){
  return <div style={{minHeight:"100vh",background:`linear-gradient(135deg,#f0fdf4,#eff6ff)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sarabun',sans-serif"}}>
    <div style={{width:"100%",maxWidth:600,padding:24}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:56,height:56,background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Ic d={I.fire} s={26} c={C.white} sw={2}/></div>
        <h2 style={{fontSize:22,fontWeight:900,color:C.ink,marginBottom:4}}>เลือกสาขา</h2>
        <p style={{fontSize:14,color:C.ink3}}>สวัสดีครับ <b>{user.name||user.username}</b> กรุณาเลือกสาขาที่ต้องการเข้าใช้งาน</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14}}>
        {branches.filter(b=>b.active).map(branch=>{
          const isCentral=branch.type==="central";
          return <div key={branch.id} onClick={()=>onSelect(branch)} style={{background:C.white,borderRadius:16,padding:"22px 20px",cursor:"pointer",border:`2px solid ${isCentral?C.teal:C.line}`,boxShadow:isCentral?`0 4px 20px ${C.teal}22`:"0 2px 8px rgba(15,23,42,.06)",transition:"all .2s",display:"flex",alignItems:"center",gap:16}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 32px ${isCentral?C.teal:C.brand}22`;}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=isCentral?`0 4px 20px ${C.teal}22`:"0 2px 8px rgba(15,23,42,.06)";}}>
            <div style={{width:48,height:48,borderRadius:14,background:isCentral?`linear-gradient(135deg,${C.teal},#0F766E)`:`linear-gradient(135deg,${C.brand},${C.brandDark})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic d={isCentral?I.shop:I.branch} s={22} c={C.white} sw={2}/>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:C.ink,marginBottom:4}}>{branch.name}</div>
              <Chip color={isCentral?"teal":"orange"}>{isCentral?"ครัวกลาง":"สาขา"}</Chip>
            </div>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════
// ── IMPORT INGREDIENTS MODAL ──────────────────────────
// ══════════════════════════════════════════════════════
function ImportIngModal({onClose,ingCats,suppliers,currentUser,currentBranch,onDone}){
  const[step,setStep]=useState(1); // 1=upload, 2=preview, 3=done
  const[rows,setRows]=useState([]);
  const[saving,setSaving]=useState(false);
  const[progress,setProgress]=useState(0);
  const fileRef=useRef();

  // parse text/csv file
  function parseFile(text){
    const lines=text.split("\n").map(l=>l.trim()).filter(l=>l);
    const parsed=[];
    let currentCat="อื่นๆ";
    const catKeywords=["หมวดหมู่","หมวด"];
    lines.forEach(line=>{
      // detect category header
      if(catKeywords.some(k=>line.includes(k))&&!line.match(/^\d/)){
        const m=line.match(/[（(](.+?)[）)]/);
        if(m){
          const raw=m[1].trim();
          if(raw.includes("หมู"))currentCat="เนื้อสัตว์";
          else if(raw.includes("ไก่"))currentCat="เนื้อสัตว์";
          else if(raw.includes("เนื้อ"))currentCat="เนื้อสัตว์";
          else if(raw.includes("ทะเล"))currentCat="เนื้อสัตว์";
          else if(raw.includes("ผัก"))currentCat="ผักและผลไม้";
          else if(raw.includes("เครื่องปรุง"))currentCat="เครื่องปรุง";
          else if(raw.includes("แช่แข็ง"))currentCat="อื่นๆ";
          else if(raw.includes("เส้น"))currentCat="แป้ง/ธัญพืช";
          else currentCat="อื่นๆ";
        }
        return;
      }
      // split by tab
      const parts=line.split("\t").map(p=>p.trim());
      if(parts.length<1||!parts[0])return;
      const name=parts[0];
      if(!name||name.length<2)return;
      // skip if looks like header
      if(["ราคา","ยี่ห้อ","ซัพ","พลาย","การสั่ง","หมายเหตุ"].includes(name))return;
      const priceRaw=parts[1]||"";
      const price=parseFloat(priceRaw.replace(/[^0-9.]/g,""))||0;
      const brand=parts[2]||"";
      const supName=parts[3]||"";
      const note=parts[5]||"";
      parsed.push({name,buy_price:price,category:currentCat,supplier_name:supName.trim(),brand:brand.trim(),note:note.trim(),buy_unit:"กก.",buy_amount:1,convert_to_gram:1000,price_per_gram:price>0?price/1000:0,stock:0,selected:true});
    });
    return parsed.filter(r=>r.name&&r.name.length>=2);
  }

  function handleFile(e){
    const f=e.target.files?.[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      const text=ev.target.result;
      const parsed=parseFile(text);
      setRows(parsed);setStep(2);
    };
    r.readAsText(f,"UTF-8");
    e.target.value="";
  }

  function handlePaste(e){
    const text=e.target.value;
    const parsed=parseFile(text);
    if(parsed.length>0){setRows(parsed);setStep(2);}
  }

  async function doImport(){
    const selected=rows.filter(r=>r.selected);
    if(!selected.length)return;
    setSaving(true);setProgress(0);
    let done=0;
    for(const row of selected){
      try{
        // find supplier id
        const sup=suppliers.find(s=>s.name===row.supplier_name||s.name.includes(row.supplier_name)||row.supplier_name.includes(s.name));
        const item={name:row.name,category:row.category,buy_unit:row.buy_unit,buy_amount:row.buy_amount,buy_price:row.buy_price,convert_to_gram:row.convert_to_gram,price_per_gram:row.buy_price>0?row.buy_price/row.convert_to_gram:0,stock:row.stock,image:null,note:row.note,edit_by:currentUser.username,edit_at:new Date().toLocaleString("th-TH"),branch_id:currentBranch.id,supplier_id:sup?.id||null,supplier_name:sup?.name||row.supplier_name||""};
        await api.addIng(item);
      }catch(e){console.error("skip:",row.name,e.message);}
      done++;setProgress(Math.round(done/selected.length*100));
    }
    setSaving(false);setStep(3);onDone();
  }

  const catColors={"เนื้อสัตว์":"orange","ผักและผลไม้":"green","เครื่องปรุง":"blue","แป้ง/ธัญพืช":"purple","นม/ไข่":"yellow","อื่นๆ":"gray"};
  const allCatList=["เนื้อสัตว์","ผักและผลไม้","เครื่องปรุง","แป้ง/ธัญพืช","นม/ไข่","อื่นๆ"];

  return <Modal title="📥 Import วัตถุดิบ" onClose={onClose} extraWide>
    {step===1&&<div>
      <div style={{background:C.blueLight,borderRadius:12,padding:"14px 16px",marginBottom:20,border:`1px solid ${C.blue}22`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.blue,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>รองรับไฟล์ประเภทไหนบ้าง?</div>
        <div style={{fontSize:13,color:C.ink2,fontFamily:"'Sarabun',sans-serif",lineHeight:1.8}}>
          ✅ ไฟล์ <b>.txt</b> จาก Google Docs (ดาวน์โหลด → ข้อความธรรมดา)<br/>
          ✅ ไฟล์ <b>.csv</b> จาก Excel<br/>
          ✅ <b>วางข้อความ</b> ตรงๆ จาก Google Sheet/Excel
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${C.line}`,borderRadius:14,padding:"32px 20px",textAlign:"center",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.brand;e.currentTarget.style.background=C.brandLight;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.line;e.currentTarget.style.background="transparent";}}>
          <Ic d={I.ul} s={36} c={C.brand}/>
          <div style={{fontWeight:700,fontSize:15,color:C.ink,marginTop:10,fontFamily:"'Sarabun',sans-serif"}}>อัปโหลดไฟล์</div>
          <div style={{fontSize:12,color:C.ink4,marginTop:4,fontFamily:"'Sarabun',sans-serif"}}>.txt หรือ .csv</div>
        </div>
        <div style={{border:`2px dashed ${C.line}`,borderRadius:14,padding:"16px"}}>
          <div style={{fontSize:13,fontWeight:600,color:C.ink2,marginBottom:8,fontFamily:"'Sarabun',sans-serif"}}>หรือวางข้อความโดยตรง</div>
          <textarea onChange={handlePaste} placeholder={"วางข้อมูลจาก Excel/Google Sheet ที่นี่...\nตัวอย่าง:\nสันคอแลป\t143\t\tปนัดดา"} style={{...iS,height:130,fontSize:12,resize:"none"}}/>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".txt,.csv" onChange={handleFile} style={{display:"none"}}/>
    </div>}

    {step===2&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Sarabun',sans-serif"}}>
          <span style={{fontWeight:800,fontSize:15,color:C.ink}}>พบข้อมูล {rows.length} รายการ</span>
          <span style={{fontSize:13,color:C.ink3,marginLeft:8}}>เลือก {rows.filter(r=>r.selected).length} รายการ</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="ghost" onClick={()=>setRows(r=>r.map(x=>({...x,selected:true})))} s={{padding:"6px 12px",fontSize:12}}>เลือกทั้งหมด</Btn>
          <Btn v="ghost" onClick={()=>setRows(r=>r.map(x=>({...x,selected:false})))} s={{padding:"6px 12px",fontSize:12}}>ยกเลิกทั้งหมด</Btn>
        </div>
      </div>
      <div style={{maxHeight:420,overflowY:"auto",border:`1px solid ${C.line}`,borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Sarabun',sans-serif",fontSize:13}}>
          <thead><tr style={{background:C.bg,position:"sticky",top:0}}>
            <th style={{padding:"8px 12px",textAlign:"center",width:40}}><input type="checkbox" checked={rows.every(r=>r.selected)} onChange={e=>setRows(r=>r.map(x=>({...x,selected:e.target.checked})))} style={{accentColor:C.brand,width:15,height:15}}/></th>
            {["ชื่อวัตถุดิบ","ราคา (฿)","หมวดหมู่","ซัพพลาย","หมายเหตุ"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:C.ink3}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((row,idx)=><tr key={idx} style={{borderTop:`1px solid ${C.lineLight}`,background:row.selected?C.white:"#f8f9fa",opacity:row.selected?1:.5}}>
              <td style={{padding:"8px 12px",textAlign:"center"}}><input type="checkbox" checked={!!row.selected} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,selected:e.target.checked}:x))} style={{accentColor:C.brand,width:15,height:15}}/></td>
              <td style={{padding:"8px 12px"}}>
                <input value={row.name} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,name:e.target.value}:x))} style={{...iS,padding:"4px 8px",fontSize:13}}/>
              </td>
              <td style={{padding:"8px 12px"}}>
                <input type="number" value={row.buy_price} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,buy_price:+e.target.value}:x))} style={{...iS,padding:"4px 8px",fontSize:13,width:80}}/>
              </td>
              <td style={{padding:"8px 12px"}}>
                <select value={row.category} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,category:e.target.value}:x))} style={{...iS,padding:"4px 8px",fontSize:12,appearance:"none"}}>
                  {allCatList.map(c=><option key={c}>{c}</option>)}
                </select>
              </td>
              <td style={{padding:"8px 12px"}}>
                <div style={{fontSize:12,color:C.teal,fontWeight:600}}>{row.supplier_name||"-"}</div>
              </td>
              <td style={{padding:"8px 12px",fontSize:11,color:C.ink4}}>{row.note||"-"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {saving&&<div style={{marginTop:12,background:C.brandLight,borderRadius:10,padding:"10px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontFamily:"'Sarabun',sans-serif",color:C.brand}}>กำลัง Import...</span><span style={{fontSize:13,fontWeight:700,color:C.brand}}>{progress}%</span></div>
        <div style={{background:C.brandBorder,borderRadius:999,height:6}}><div style={{width:`${progress}%`,background:C.brand,height:"100%",borderRadius:999,transition:"width .3s"}}/></div>
      </div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:14,borderTop:`1px solid ${C.line}`,marginTop:14}}>
        <Btn v="ghost" onClick={()=>setStep(1)}>← กลับ</Btn>
        <Btn onClick={doImport} icon={I.check} disabled={!rows.filter(r=>r.selected).length} loading={saving}>Import {rows.filter(r=>r.selected).length} รายการ</Btn>
      </div>
    </div>}

    {step===3&&<div style={{textAlign:"center",padding:"40px 0"}}>
      <div style={{fontSize:48,marginBottom:12}}>✅</div>
      <div style={{fontSize:20,fontWeight:800,color:C.green,fontFamily:"'Sarabun',sans-serif",marginBottom:8}}>Import สำเร็จ!</div>
      <div style={{fontSize:14,color:C.ink3,fontFamily:"'Sarabun',sans-serif",marginBottom:24}}>เพิ่มวัตถุดิบเข้าระบบแล้วครับ</div>
      <Btn onClick={onClose}>ปิดและดูข้อมูล</Btn>
    </div>}
  </Modal>;
}

// ══════════════════════════════════════════════════════
// ── IMPORT MENU MODAL ─────────────────────────────────
// ══════════════════════════════════════════════════════
function ImportMenuModal({onClose,menuCats,currentUser,currentBranch,onDone}){
  const[step,setStep]=useState(1);const[rows,setRows]=useState([]);const[saving,setSaving]=useState(false);const[progress,setProgress]=useState(0);
  const fileRef=useRef();
  const defaultCat=menuCats[0]?.name||"อาหารจานเดียว";
  const allMenuCatList=menuCats.map(c=>c.name);

  function parseMenuText(text){
    const lines=text.split("\n").map(l=>l.trim()).filter(l=>l);
    const parsed=[];
    lines.forEach(line=>{
      const parts=line.split("\t").map(p=>p.trim());
      const name=parts[0];
      if(!name||name.length<2)return;
      if(["ชื่อเมนู","เมนู","ราคา","หมวด"].includes(name))return;
      const priceRaw=parts[1]||"";
      const price=parseFloat(priceRaw.replace(/[^0-9.]/g,""))||0;
      const cat=parts[2]||defaultCat;
      const desc=parts[3]||"";
      parsed.push({name,price,category:allMenuCatList.includes(cat)?cat:defaultCat,description:desc,selected:true});
    });
    return parsed.filter(r=>r.name&&r.name.length>=2);
  }

  function handleFile(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const parsed=parseMenuText(ev.target.result);setRows(parsed);setStep(2);};r.readAsText(f,"UTF-8");e.target.value="";}
  function handlePaste(e){const parsed=parseMenuText(e.target.value);if(parsed.length>0){setRows(parsed);setStep(2);}}

  async function doImport(){
    const selected=rows.filter(r=>r.selected);if(!selected.length)return;
    setSaving(true);setProgress(0);let done=0;
    for(const row of selected){
      try{await api.addMenu({name:row.name,category:row.category,price:+row.price,description:row.description,image:null,ingredients:[],sop:[],edit_by:currentUser.username,edit_at:new Date().toLocaleString("th-TH"),branch_id:currentBranch.id});}
      catch(e){console.error("skip:",row.name);}
      done++;setProgress(Math.round(done/selected.length*100));
    }
    setSaving(false);setStep(3);onDone();
  }

  return <Modal title="📥 Import เมนูอาหาร" onClose={onClose} wide>
    {step===1&&<div>
      <div style={{background:C.blueLight,borderRadius:12,padding:"14px 16px",marginBottom:20,border:`1px solid ${C.blue}22`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.blue,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>รูปแบบข้อมูลที่รองรับ</div>
        <div style={{fontSize:13,color:C.ink2,fontFamily:"'Sarabun',sans-serif",lineHeight:1.8}}>
          ✅ ไฟล์ <b>.txt</b> หรือ <b>.csv</b><br/>
          ✅ คอลัมน์: <b>ชื่อเมนู | ราคา | หมวดหมู่ | รายละเอียด</b><br/>
          ✅ วางข้อความจาก Excel ได้เลย
        </div>
      </div>
      <div style={{background:C.bg,borderRadius:12,padding:"12px 14px",marginBottom:16,border:`1px solid ${C.line}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.ink3,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>ตัวอย่างรูปแบบ</div>
        <pre style={{fontSize:12,color:C.ink2,fontFamily:"monospace",lineHeight:1.6}}>{"ข้าวผัดไก่\t80\tอาหารจานเดียว\tข้าวผัดหอมๆ\nผัดกะเพราหมู\t70\tอาหารจานเดียว"}</pre>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${C.line}`,borderRadius:14,padding:"32px 20px",textAlign:"center",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.brand;e.currentTarget.style.background=C.brandLight;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.line;e.currentTarget.style.background="transparent";}}>
          <Ic d={I.ul} s={36} c={C.brand}/><div style={{fontWeight:700,fontSize:15,color:C.ink,marginTop:10,fontFamily:"'Sarabun',sans-serif"}}>อัปโหลดไฟล์</div><div style={{fontSize:12,color:C.ink4,marginTop:4,fontFamily:"'Sarabun',sans-serif"}}>.txt หรือ .csv</div>
        </div>
        <div style={{border:`2px dashed ${C.line}`,borderRadius:14,padding:"16px"}}>
          <div style={{fontSize:13,fontWeight:600,color:C.ink2,marginBottom:8,fontFamily:"'Sarabun',sans-serif"}}>หรือวางข้อความ</div>
          <textarea onChange={handlePaste} placeholder={"ชื่อเมนู\tราคา\tหมวดหมู่\nข้าวผัดไก่\t80\tอาหารจานเดียว"} style={{...iS,height:130,fontSize:12,resize:"none"}}/>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".txt,.csv" onChange={handleFile} style={{display:"none"}}/>
    </div>}

    {step===2&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Sarabun',sans-serif"}}><span style={{fontWeight:800,fontSize:15,color:C.ink}}>พบ {rows.length} เมนู</span><span style={{fontSize:13,color:C.ink3,marginLeft:8}}>เลือก {rows.filter(r=>r.selected).length} รายการ</span></div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="ghost" onClick={()=>setRows(r=>r.map(x=>({...x,selected:true})))} s={{padding:"6px 12px",fontSize:12}}>เลือกทั้งหมด</Btn>
          <Btn v="ghost" onClick={()=>setRows(r=>r.map(x=>({...x,selected:false})))} s={{padding:"6px 12px",fontSize:12}}>ยกเลิก</Btn>
        </div>
      </div>
      <div style={{maxHeight:380,overflowY:"auto",border:`1px solid ${C.line}`,borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Sarabun',sans-serif",fontSize:13}}>
          <thead><tr style={{background:C.bg}}>
            <th style={{padding:"8px 12px",width:40,textAlign:"center"}}><input type="checkbox" checked={rows.every(r=>r.selected)} onChange={e=>setRows(r=>r.map(x=>({...x,selected:e.target.checked})))} style={{accentColor:C.brand,width:15,height:15}}/></th>
            {["ชื่อเมนู","ราคา (฿)","หมวดหมู่","รายละเอียด"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:C.ink3}}>{h}</th>)}
          </tr></thead>
          <tbody>{rows.map((row,idx)=><tr key={idx} style={{borderTop:`1px solid ${C.lineLight}`,opacity:row.selected?1:.5}}>
            <td style={{padding:"8px 12px",textAlign:"center"}}><input type="checkbox" checked={!!row.selected} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,selected:e.target.checked}:x))} style={{accentColor:C.brand,width:15,height:15}}/></td>
            <td style={{padding:"8px 12px"}}><input value={row.name} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,name:e.target.value}:x))} style={{...iS,padding:"4px 8px",fontSize:13}}/></td>
            <td style={{padding:"8px 12px"}}><input type="number" value={row.price} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,price:+e.target.value}:x))} style={{...iS,padding:"4px 8px",fontSize:13,width:90}}/></td>
            <td style={{padding:"8px 12px"}}><select value={row.category} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,category:e.target.value}:x))} style={{...iS,padding:"4px 8px",fontSize:12,appearance:"none"}}>{allMenuCatList.map(c=><option key={c}>{c}</option>)}</select></td>
            <td style={{padding:"8px 12px"}}><input value={row.description} onChange={e=>setRows(r=>r.map((x,i)=>i===idx?{...x,description:e.target.value}:x))} placeholder="รายละเอียด..." style={{...iS,padding:"4px 8px",fontSize:12}}/></td>
          </tr>)}
          </tbody>
        </table>
      </div>
      {saving&&<div style={{marginTop:12,background:C.brandLight,borderRadius:10,padding:"10px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontFamily:"'Sarabun',sans-serif",color:C.brand}}>กำลัง Import...</span><span style={{fontSize:13,fontWeight:700,color:C.brand}}>{progress}%</span></div>
        <div style={{background:C.brandBorder,borderRadius:999,height:6}}><div style={{width:`${progress}%`,background:C.brand,height:"100%",borderRadius:999,transition:"width .3s"}}/></div>
      </div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:14,borderTop:`1px solid ${C.line}`,marginTop:14}}>
        <Btn v="ghost" onClick={()=>setStep(1)}>← กลับ</Btn>
        <Btn onClick={doImport} icon={I.check} disabled={!rows.filter(r=>r.selected).length} loading={saving}>Import {rows.filter(r=>r.selected).length} เมนู</Btn>
      </div>
    </div>}

    {step===3&&<div style={{textAlign:"center",padding:"40px 0"}}>
      <div style={{fontSize:48,marginBottom:12}}>✅</div>
      <div style={{fontSize:20,fontWeight:800,color:C.green,fontFamily:"'Sarabun',sans-serif",marginBottom:8}}>Import เมนูสำเร็จ!</div>
      <div style={{fontSize:14,color:C.ink3,fontFamily:"'Sarabun',sans-serif",marginBottom:24}}>เพิ่มเมนูเข้าระบบแล้วครับ</div>
      <Btn onClick={onClose}>ปิดและดูเมนู</Btn>
    </div>}
  </Modal>;
}

// ══════════════════════════════════════════════════════
// ── INGREDIENT TAB ────────────────────────────────────
// ══════════════════════════════════════════════════════
function IngTab({ings,reload,ingCats,suppliers,currentUser,currentBranch,addH}){
  const[q,setQ]=useState("");const[cat,setCat]=useState("ทุกหมวด");const[open,setOpen]=useState(false);const[editId,setEditId]=useState(null);const[saving,setSaving]=useState(false);const[pg,setPg]=useState(1);const PG=18;const[showImport,setShowImport]=useState(false);
  const ef={name:"",category:ingCats[0]?.name||"",buy_unit:"กก.",buy_amount:1,buy_price:"",convert_to_gram:1000,price_per_gram:0,stock:"",image:null,note:"",supplier_id:"",supplier_name:""};
  const[form,setForm]=useState(ef);
  const canE=hasPerm(currentUser,"edit_ingredients");const canD=hasPerm(currentUser,"delete_ingredients");
  const filtered=useMemo(()=>ings.filter(i=>i.name.toLowerCase().includes(q.toLowerCase())&&(cat==="ทุกหมวด"||i.category===cat)),[ings,q,cat]);
  const paged=useMemo(()=>filtered.slice(0,pg*PG),[filtered,pg]);
  function upd(k,val){setForm(f=>{const n={...f,[k]:val};if(k==="buy_price"||k==="convert_to_gram")n.price_per_gram=ppg(+(k==="buy_price"?val:n.buy_price)||0,+(k==="convert_to_gram"?val:n.convert_to_gram)||1);if(k==="supplier_id"){const sup=suppliers.find(s=>String(s.id)===String(val));n.supplier_name=sup?sup.name:"";}return n;});}
  async function save(){if(!form.name||!form.buy_price)return;setSaving(true);try{const item={...form,buy_price:+form.buy_price,buy_amount:+form.buy_amount,convert_to_gram:+form.convert_to_gram,price_per_gram:ppg(+form.buy_price,+form.convert_to_gram),stock:+form.stock,edit_by:currentUser.username,edit_at:nowStr(),branch_id:currentBranch.id,supplier_id:form.supplier_id?+form.supplier_id:null};if(editId){await api.updateIng(editId,item);addH(`แก้ไขวัตถุดิบ: ${form.name}`);}else{await api.addIng(item);addH(`เพิ่มวัตถุดิบ: ${form.name}`);}await reload();setOpen(false);}catch(e){alert("บันทึกไม่สำเร็จ: "+e.message);}setSaving(false);}
  async function del(id,name){if(!confirm(`ลบ "${name}"?`))return;try{await api.deleteIng(id);addH(`ลบวัตถุดิบ: ${name}`);await reload();}catch(e){alert("ลบไม่สำเร็จ");}}
  return <div>
    <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:1,minWidth:220}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.search} s={16} c={C.ink4}/></span><input value={q} onChange={e=>{setQ(e.target.value);setPg(1);}} placeholder="ค้นหาวัตถุดิบ..." style={{...iS,paddingLeft:40}}/></div>
      <select value={cat} onChange={e=>{setCat(e.target.value);setPg(1);}} style={{...iS,width:"auto",minWidth:140,appearance:"none"}}><option>ทุกหมวด</option>{ingCats.map(c=><option key={c.id}>{c.name}</option>)}</select>
      {canE&&<Btn onClick={()=>{setForm(ef);setEditId(null);setOpen(true);}} icon={I.plus}>เพิ่มวัตถุดิบ</Btn>}
      {canE&&<Btn v="info" onClick={()=>setShowImport(true)} icon={I.ul}>Import</Btn>}
    </div>
    <div style={{fontSize:12,color:C.ink4,marginBottom:14,fontFamily:"'Sarabun',sans-serif"}}>แสดง {paged.length} จาก {filtered.length} รายการ</div>
    {paged.length===0?<div style={{textAlign:"center",padding:"80px 0",color:C.ink4}}><Ic d={I.warning} s={44} c={C.line}/><p style={{marginTop:12,fontFamily:"'Sarabun',sans-serif",fontSize:15}}>ไม่พบวัตถุดิบ</p></div>:<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
        {paged.map(item=><Card key={item.id} hover style={{overflow:"hidden"}}>
          <div style={{display:"flex"}}>
            {item.image?<img src={item.image} alt={item.name} style={{width:88,height:88,objectFit:"cover",flexShrink:0}}/>:<div style={{width:88,height:88,background:`linear-gradient(135deg,${C.brandLight},#FEF3C7)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={I.leaf} s={32} c={C.brand}/></div>}
            <div style={{flex:1,padding:"12px 14px 10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div><div style={{fontWeight:800,fontSize:15,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:3}}>{item.name}</div><Chip color="orange">{item.category}</Chip></div>
                <div style={{display:"flex",gap:4}}>
                  {canE&&<button onClick={()=>{setForm({name:item.name,category:item.category,buy_unit:item.buy_unit,buy_amount:item.buy_amount,buy_price:item.buy_price,convert_to_gram:item.convert_to_gram,price_per_gram:item.price_per_gram,stock:item.stock,image:item.image,note:item.note||"",supplier_id:String(item.supplier_id||""),supplier_name:item.supplier_name||""});setEditId(item.id);setOpen(true);}} style={{background:C.blueLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.pencil} s={13} c={C.blue}/></button>}
                  {canD&&<button onClick={()=>del(item.id,item.name)} style={{background:C.redLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>}
                </div>
              </div>
              {item.supplier_name&&<div style={{fontSize:11,color:C.teal,fontFamily:"'Sarabun',sans-serif",display:"flex",alignItems:"center",gap:3}}><Ic d={I.truck} s={10} c={C.teal}/>ซัพพลาย: {item.supplier_name}</div>}
            </div>
          </div>
          <div style={{padding:"10px 14px 14px",borderTop:`1px solid ${C.lineLight}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:6}}>
              {[{l:"ซื้อมา",v:`฿${item.buy_price}`,sub:`${item.buy_amount} ${item.buy_unit}`,bg:C.lineLight,tc:C.ink},{l:"รวมกรัม",v:`${(+item.convert_to_gram).toLocaleString()}g`,sub:"ทั้งหมด",bg:C.brandLight,tc:C.brand},{l:"ราคา/กรัม",v:`฿${(+item.price_per_gram).toFixed(3)}`,sub:"ต่อ 1g",bg:C.greenLight,tc:C.green}].map(st=><div key={st.l} style={{background:st.bg,borderRadius:10,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,color:C.ink4,fontFamily:"'Sarabun',sans-serif",marginBottom:2}}>{st.l}</div><div style={{fontSize:13,fontWeight:800,color:st.tc,fontFamily:"'Sarabun',sans-serif"}}>{st.v}</div><div style={{fontSize:10,color:C.ink4,fontFamily:"'Sarabun',sans-serif"}}>{st.sub}</div></div>)}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:C.ink4,fontFamily:"'Sarabun',sans-serif"}}>สต็อก: <b style={{color:+item.stock<3?C.red:C.green}}>{item.stock} {item.buy_unit}</b></span>
              <EditedBy username={item.edit_by} editAt={item.edit_at}/>
            </div>
          </div>
        </Card>)}
      </div>
      {paged.length<filtered.length&&<div style={{textAlign:"center",marginTop:20}}><Btn v="ghost" onClick={()=>setPg(p=>p+1)}>โหลดเพิ่ม ({filtered.length-paged.length})</Btn></div>}
    </>}
    {showImport&&<ImportIngModal onClose={()=>setShowImport(false)} ingCats={ingCats} suppliers={suppliers} currentUser={currentUser} currentBranch={currentBranch} onDone={async()=>{await reload();setShowImport(false);}}/>}
    {open&&<Modal title={editId?"✏️ แก้ไขวัตถุดิบ":"➕ เพิ่มวัตถุดิบใหม่"} onClose={()=>setOpen(false)}>
      <ImgUp label="รูปวัตถุดิบ" value={form.image} onChange={v=>upd("image",v)}/>
      <Inp label="ชื่อวัตถุดิบ" value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="เช่น ไก่หน้าอก" autoFocus/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="หมวดหมู่"><select value={form.category} onChange={e=>upd("category",e.target.value)} style={{...iS,appearance:"none"}}>{ingCats.map(c=><option key={c.id}>{c.name}</option>)}</select></Field>
        <Field label="ซัพพลาย"><select value={form.supplier_id} onChange={e=>upd("supplier_id",e.target.value)} style={{...iS,appearance:"none"}}><option value="">-- ไม่ระบุ --</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      </div>
      <div style={{background:C.lineLight,borderRadius:12,padding:"16px",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:C.ink2,marginBottom:12,fontFamily:"'Sarabun',sans-serif",display:"flex",alignItems:"center",gap:6}}><Ic d={I.tag} s={14} c={C.brand}/>ข้อมูลการซื้อ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="จำนวนที่ซื้อ" type="number" value={form.buy_amount} onChange={e=>upd("buy_amount",e.target.value)} placeholder="1"/><Inp label="หน่วยที่ซื้อ" value={form.buy_unit} onChange={e=>upd("buy_unit",e.target.value)} placeholder="กก., ขวด, แผง"/></div>
        <Inp label="ราคาที่ซื้อมา (บาท)" type="number" value={form.buy_price} onChange={e=>upd("buy_price",e.target.value)} placeholder="0"/>
      </div>
      <div style={{background:C.brandLight,borderRadius:12,padding:"16px",marginBottom:16,border:`1px solid ${C.brandBorder}`}}>
        <Inp label="รวมทั้งหมดกี่กรัม" hint="แปลงเป็นกรัม" type="number" value={form.convert_to_gram} onChange={e=>upd("convert_to_gram",e.target.value)} placeholder="1000"/>
        <div style={{background:C.white,borderRadius:10,padding:"10px 14px",border:`1px solid ${C.brandBorder}`,textAlign:"center"}}>
          <div style={{fontSize:12,color:C.ink4,fontFamily:"'Sarabun',sans-serif",marginBottom:2}}>ราคาต่อกรัม</div>
          <div style={{fontSize:24,fontWeight:900,color:C.brand,fontFamily:"'Sarabun',sans-serif"}}>฿{form.buy_price&&form.convert_to_gram?ppg(+form.buy_price,+form.convert_to_gram).toFixed(4):"0.0000"}<span style={{fontSize:12,fontWeight:500,color:C.ink3,marginLeft:4}}>/ กรัม</span></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="สต็อกปัจจุบัน" type="number" value={form.stock} onChange={e=>upd("stock",e.target.value)} placeholder="0"/></div>
      <TA label="หมายเหตุ" rows={2} value={form.note} onChange={e=>upd("note",e.target.value)} placeholder="หมายเหตุ..."/>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid ${C.line}`}}>
        <Btn v="ghost" onClick={()=>setOpen(false)}>ยกเลิก</Btn>
        <Btn onClick={save} icon={I.check} disabled={!form.name||!form.buy_price} loading={saving}>{editId?"บันทึก":"เพิ่มวัตถุดิบ"}</Btn>
      </div>
    </Modal>}
  </div>;
}

// ══════════════════════════════════════════════════════
// ── MENU TAB ──────────────────────────────────────────
// ══════════════════════════════════════════════════════
function MenuTab({menus,reload,ings,menuCats,currentUser,currentBranch,addH}){
  const[q,setQ]=useState("");const[open,setOpen]=useState(false);const[editId,setEditId]=useState(null);const[saving,setSaving]=useState(false);const[showImportMenu,setShowImportMenu]=useState(false);
  const ef={name:"",category:menuCats[0]?.name||"",price:"",description:"",image:null,ingredients:[],sop:[]};
  const[form,setForm]=useState(ef);const[ingQ,setIngQ]=useState("");const[ni,setNi]=useState({ingredientId:"",amountGram:""});
  const canE=hasPerm(currentUser,"edit_menus");const canD=hasPerm(currentUser,"delete_menus");
  const filtered=useMemo(()=>menus.filter(m=>m.name.toLowerCase().includes(q.toLowerCase())),[menus,q]);
  const filteredIngs=useMemo(()=>ings.filter(i=>i.name.toLowerCase().includes(ingQ.toLowerCase())),[ings,ingQ]);
  const fc=(form.ingredients||[]).reduce((s,x)=>{const i=ings.find(g=>g.id===x.ingredientId);return s+(i?i.price_per_gram*x.amountGram:0);},0);
  const fm=form.price>0?((+form.price-fc)/+form.price*100):0;
  async function save(){if(!form.name||!form.price)return;setSaving(true);try{const item={name:form.name,category:form.category,price:+form.price,description:form.description,image:form.image,ingredients:form.ingredients,sop:form.sop||[],edit_by:currentUser.username,edit_at:nowStr(),branch_id:currentBranch.id};if(editId){await api.updateMenu(editId,item);addH(`แก้ไขเมนู: ${form.name}`);}else{await api.addMenu(item);addH(`เพิ่มเมนู: ${form.name}`);}await reload();setOpen(false);}catch(e){alert("บันทึกไม่สำเร็จ: "+e.message);}setSaving(false);}
  async function del(id,name){if(!confirm(`ลบเมนู "${name}"?`))return;try{await api.deleteMenu(id);addH(`ลบเมนู: ${name}`);await reload();}catch(e){alert("ลบไม่สำเร็จ");}}
  return <div>
    <div style={{display:"flex",gap:10,marginBottom:20}}>
      <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.search} s={16} c={C.ink4}/></span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาเมนู..." style={{...iS,paddingLeft:40}}/></div>
      {canE&&<Btn onClick={()=>{setForm(ef);setEditId(null);setIngQ("");setOpen(true);}} icon={I.plus}>เพิ่มเมนู</Btn>}
      {canE&&<Btn v="info" onClick={()=>setShowImportMenu(true)} icon={I.ul}>Import</Btn>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
      {filtered.map(menu=>{const cost=menuCost(menu,ings);const profit=menu.price-cost;const mg=menu.price>0?profit/menu.price*100:0;const mc=marginColor(mg);return <Card key={menu.id} hover style={{overflow:"hidden"}}>
        <div style={{height:5,background:`linear-gradient(90deg,${mc},${mc}66)`}}/>
        {menu.image?<img src={menu.image} alt={menu.name} style={{width:"100%",height:130,objectFit:"cover"}}/>:<div style={{height:80,background:`linear-gradient(135deg,${C.brandLight},#FEF9C3)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.fire} s={36} c={C.brand}/></div>}
        <div style={{padding:"12px 16px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontWeight:800,fontSize:16,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:3}}>{menu.name}</div><Chip color="blue">{menu.category}</Chip></div>
            <div style={{display:"flex",gap:4}}>
              {canE&&<button onClick={()=>{setForm({name:menu.name,category:menu.category,price:menu.price,description:menu.description||"",image:menu.image,ingredients:menu.ingredients||[],sop:menu.sop||[]});setEditId(menu.id);setIngQ("");setOpen(true);}} style={{background:C.blueLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.pencil} s={13} c={C.blue}/></button>}
              {canD&&<button onClick={()=>del(menu.id,menu.name)} style={{background:C.redLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{l:"ราคาขาย",v:`฿${menu.price}`,c:C.ink},{l:"ต้นทุน",v:`฿${cost.toFixed(1)}`,c:C.brand},{l:"กำไร %",v:`${mg.toFixed(0)}%`,c:mc}].map(s=><div key={s.l} style={{background:C.bg,borderRadius:10,padding:8,textAlign:"center"}}><div style={{fontSize:10,color:C.ink4,fontFamily:"'Sarabun',sans-serif"}}>{s.l}</div><div style={{fontSize:14,fontWeight:800,color:s.c,fontFamily:"'Sarabun',sans-serif"}}>{s.v}</div></div>)}
          </div>
          <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><Chip color={mg>=60?"green":mg>=40?"yellow":"red"}>{marginLabel(mg)}</Chip><EditedBy username={menu.edit_by} editAt={menu.edit_at}/></div>
        </div>
      </Card>;})}
    </div>
    {showImportMenu&&<ImportMenuModal onClose={()=>setShowImportMenu(false)} menuCats={menuCats} currentUser={currentUser} currentBranch={currentBranch} onDone={async()=>{await reload();setShowImportMenu(false);}}/>}
    {open&&<Modal title={editId?"✏️ แก้ไขเมนู":"➕ เพิ่มเมนูใหม่"} onClose={()=>setOpen(false)} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <ImgUp label="รูปเมนู" value={form.image} onChange={v=>setForm(f=>({...f,image:v}))}/>
          <Inp label="ชื่อเมนู" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="เช่น ข้าวผัดไก่" autoFocus/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="หมวดหมู่"><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...iS,appearance:"none"}}>{menuCats.map(c=><option key={c.id}>{c.name}</option>)}</select></Field>
            <Inp label="ราคาขาย (฿)" type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0"/>
          </div>
          <TA label="รายละเอียดเมนู" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="อธิบายเมนูสั้นๆ"/>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.ink2,fontFamily:"'Sarabun',sans-serif",marginBottom:10}}>วัตถุดิบ</div>
          <div style={{maxHeight:140,overflowY:"auto",marginBottom:10}}>
            {(form.ingredients||[]).map((mi,idx)=>{const ing=ings.find(i=>i.id===mi.ingredientId);const c=ing?ing.price_per_gram*mi.amountGram:0;return <div key={idx} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:C.bg,borderRadius:9,padding:"8px 10px",border:`1px solid ${C.line}`}}><span style={{flex:1,fontSize:13,fontFamily:"'Sarabun',sans-serif",fontWeight:600}}>{ing?.name??"?"}</span><span style={{fontSize:12,color:C.brand,fontWeight:700}}>{mi.amountGram}g</span><span style={{fontSize:11,color:C.ink3}}>฿{c.toFixed(2)}</span><button onClick={()=>setForm(f=>({...f,ingredients:f.ingredients.filter((_,i)=>i!==idx)}))} style={{background:"none",border:"none",cursor:"pointer",display:"flex"}}><Ic d={I.x} s={13} c={C.red}/></button></div>;})}
          </div>
          <div style={{background:C.bg,borderRadius:12,padding:"12px",marginBottom:10,border:`1px solid ${C.line}`}}>
            <div style={{position:"relative",marginBottom:8}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.search} s={13} c={C.ink4}/></span><input value={ingQ} onChange={e=>setIngQ(e.target.value)} placeholder="ค้นหาวัตถุดิบ..." style={{...iS,paddingLeft:32,fontSize:13,padding:"8px 12px 8px 32px"}}/></div>
            <div style={{maxHeight:120,overflowY:"auto"}}>
              {filteredIngs.map(ing=>{const already=(form.ingredients||[]).find(x=>x.ingredientId===ing.id);return <div key={ing.id} onClick={()=>{if(!already)setNi(n=>({...n,ingredientId:String(ing.id)}));}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,marginBottom:3,background:already?C.greenLight:ni.ingredientId===String(ing.id)?C.brandLight:C.white,border:`1px solid ${already?C.green:ni.ingredientId===String(ing.id)?C.brandBorder:C.line}`,cursor:already?"default":"pointer"}}>
                <span style={{flex:1,fontSize:13,fontWeight:600,fontFamily:"'Sarabun',sans-serif"}}>{ing.name}</span>
                <span style={{fontSize:10,color:C.teal}}>{ing.supplier_name||""}</span>
                <span style={{fontSize:11,color:C.brand}}>฿{(+ing.price_per_gram).toFixed(3)}/g</span>
                {already&&<Chip color="green">✓</Chip>}
              </div>;})}
            </div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            <div style={{flex:2}}><select value={ni.ingredientId} onChange={e=>setNi({...ni,ingredientId:e.target.value})} style={{...iS,fontSize:13}}><option value="">-- ยืนยันวัตถุดิบ --</option>{ings.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
            <div style={{flex:1}}><input type="number" value={ni.amountGram} onChange={e=>setNi({...ni,amountGram:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"&&ni.ingredientId&&ni.amountGram){setForm(f=>({...f,ingredients:[...f.ingredients,{ingredientId:+ni.ingredientId,amountGram:+ni.amountGram}]}));setNi({ingredientId:"",amountGram:""});}}} placeholder="กรัม" style={{...iS,fontSize:13}}/></div>
            <Btn v="ghost" onClick={()=>{if(!ni.ingredientId||!ni.amountGram)return;setForm(f=>({...f,ingredients:[...f.ingredients,{ingredientId:+ni.ingredientId,amountGram:+ni.amountGram}]}));setNi({ingredientId:"",amountGram:""});}} icon={I.plus} s={{padding:"10px 12px"}}>เพิ่ม</Btn>
          </div>
          {(form.ingredients||[]).length>0&&<div style={{background:C.brandLight,borderRadius:12,padding:"12px",border:`1px solid ${C.brandBorder}`}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,color:C.ink3,fontFamily:"'Sarabun',sans-serif"}}>ต้นทุนรวม</span><span style={{fontSize:18,fontWeight:900,color:C.brand,fontFamily:"'Sarabun',sans-serif"}}>฿{fc.toFixed(2)}</span></div>
            {form.price>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:C.ink3,fontFamily:"'Sarabun',sans-serif"}}>กำไร</span><span style={{fontSize:13,fontWeight:700,color:marginColor(fm)}}>฿{(+form.price-fc).toFixed(2)} ({fm.toFixed(1)}%)</span></div>}
          </div>}
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:16,borderTop:`1px solid ${C.line}`,marginTop:8}}>
        <Btn v="ghost" onClick={()=>setOpen(false)}>ยกเลิก</Btn>
        <Btn onClick={save} icon={I.check} disabled={!form.name||!form.price} loading={saving}>{editId?"บันทึก":"เพิ่มเมนู"}</Btn>
      </div>
    </Modal>}
  </div>;
}

// ══════════════════════════════════════════════════════
// ── SOP TAB ───────────────────────────────────────────
// ══════════════════════════════════════════════════════
function SOPTab({menus,reload,ings,currentUser}){
  const[sel,setSel]=useState(menus[0]?.id??null);const[edit,setEdit]=useState(false);const[sop,setSop]=useState([]);const[saving,setSaving]=useState(false);const[ingQ,setIngQ]=useState("");
  const menu=useMemo(()=>menus.find(m=>m.id===sel),[menus,sel]);
  const canE=hasPerm(currentUser,"edit_sop");
  useEffect(()=>{if(menu){setSop(menu.sop?[...menu.sop.map(s=>({...s}))]:[]); setEdit(false);}}, [sel]);
  async function saveSop(){setSaving(true);try{await api.updateMenu(sel,{sop,edit_by:currentUser.username,edit_at:nowStr()});await reload();setEdit(false);}catch(e){alert("บันทึกไม่สำเร็จ: "+e.message);}setSaving(false);}
  const filteredIngs=useMemo(()=>ings.filter(i=>i.name.toLowerCase().includes(ingQ.toLowerCase())),[ings,ingQ]);
  return <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:16,minHeight:520}}>
    <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.line}`,overflow:"hidden"}}>
      <div style={{padding:"12px 16px 8px",borderBottom:`1px solid ${C.lineLight}`,background:C.bg}}><div style={{fontSize:11,fontWeight:800,color:C.ink4,letterSpacing:1.2,textTransform:"uppercase",fontFamily:"'Sarabun',sans-serif"}}>รายการเมนู</div></div>
      <div style={{padding:8,overflowY:"auto",maxHeight:520}}>
        {menus.map(m=>{const cost=menuCost(m,ings);const mg=m.price>0?((m.price-cost)/m.price*100):0;const active=sel===m.id;return <div key={m.id} onClick={()=>setSel(m.id)} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",marginBottom:4,background:active?C.brandLight:"transparent",border:`1px solid ${active?C.brandBorder:"transparent"}`,transition:"all .15s"}}>
          <div style={{fontFamily:"'Sarabun',sans-serif",fontSize:14,fontWeight:active?800:500,color:active?C.brand:C.ink2,marginBottom:2}}>{m.name}</div>
          <div style={{display:"flex",gap:6}}><span style={{fontSize:11,color:marginColor(mg),fontWeight:700}}>กำไร {mg.toFixed(0)}%</span><span style={{fontSize:11,color:C.ink4}}>· {(m.sop||[]).length} ขั้นตอน</span></div>
        </div>;})}
      </div>
    </div>
    <Card style={{padding:"20px 24px",overflow:"auto"}}>
      {menu?<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${C.lineLight}`}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {menu.image&&<img src={menu.image} alt={menu.name} style={{width:52,height:52,objectFit:"cover",borderRadius:10,border:`2px solid ${C.line}`}}/>}
            <div><h2 style={{fontFamily:"'Sarabun',sans-serif",fontSize:20,fontWeight:900,color:C.ink,marginBottom:3}}>{menu.name}</h2><EditedBy username={menu.edit_by} editAt={menu.edit_at}/></div>
          </div>
          {canE&&<div style={{display:"flex",gap:8}}>
            {edit?<><Btn v="ghost" onClick={()=>{setSop(menu.sop?[...menu.sop]:[]); setEdit(false);}} s={{padding:"8px 14px"}}>ยกเลิก</Btn><Btn v="success" onClick={saveSop} icon={I.check} loading={saving} s={{padding:"8px 14px"}}>บันทึก SOP</Btn></>
            :<Btn v="info" onClick={()=>setEdit(true)} icon={I.pencil} s={{padding:"8px 14px"}}>แก้ไข SOP</Btn>}
          </div>}
        </div>
        {edit&&<div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.ink3,marginBottom:6,fontFamily:"'Sarabun',sans-serif"}}>ค้นหาวัตถุดิบ</div>
          <div style={{position:"relative",marginBottom:8}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.search} s={13} c={C.ink4}/></span><input value={ingQ} onChange={e=>setIngQ(e.target.value)} placeholder="ค้นหาวัตถุดิบ..." style={{...iS,paddingLeft:32,fontSize:13,padding:"8px 12px 8px 32px"}}/></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:90,overflowY:"auto",background:C.bg,borderRadius:10,padding:8,border:`1px solid ${C.line}`}}>
            {filteredIngs.map(ing=><span key={ing.id} style={{background:C.white,border:`1px solid ${C.line}`,borderRadius:8,padding:"3px 10px",fontSize:12,fontFamily:"'Sarabun',sans-serif",color:C.ink2}}>{ing.name}<span style={{color:C.teal,marginLeft:4,fontSize:10}}>{ing.supplier_name||""}</span></span>)}
          </div>
        </div>}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Sarabun',sans-serif",marginBottom:8}}>วัตถุดิบในเมนู</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {(menu.ingredients||[]).map((mi,idx)=>{const ing=ings.find(i=>i.id===mi.ingredientId);return ing?<div key={idx} style={{background:C.bg,borderRadius:8,padding:"5px 12px",fontSize:13,fontFamily:"'Sarabun',sans-serif",border:`1px solid ${C.line}`,display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:C.ink}}>{ing.name}</span><span style={{color:C.brand,fontWeight:700}}>{mi.amountGram}g</span></div>:null;})}
          </div>
        </div>
        <div style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Sarabun',sans-serif",marginBottom:12}}>ขั้นตอนการทำ (SOP)</div>
        {edit?<div>
          {sop.map((step,idx)=><div key={idx} style={{background:C.bg,borderRadius:14,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.line}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800}}>{idx+1}</div>
              <button onClick={()=>setSop(f=>f.filter((_,j)=>j!==idx))} style={{background:C.redLight,border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",color:C.red,fontSize:12,fontFamily:"'Sarabun',sans-serif",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><Ic d={I.trash} s={12} c={C.red}/>ลบ</button>
            </div>
            <Inp label="ชื่อขั้นตอน" value={step.title} onChange={e=>setSop(f=>f.map((s,j)=>j===idx?{...s,title:e.target.value}:s))} placeholder="เช่น เตรียมวัตถุดิบ"/>
            <TA label="รายละเอียด" hint="อธิบายให้ละเอียด" rows={5} value={step.desc} onChange={e=>setSop(f=>f.map((s,j)=>j===idx?{...s,desc:e.target.value}:s))} placeholder="อธิบายวิธีทำ..."/>
            <ImgUp label="รูปประกอบ" value={step.image} onChange={v=>setSop(f=>f.map((s,j)=>j===idx?{...s,image:v}:s))}/>
          </div>)}
          <Btn v="ghost" onClick={()=>setSop(f=>[...f,{step:f.length+1,title:"",desc:"",image:null}])} icon={I.plus} full>+ เพิ่มขั้นตอน</Btn>
        </div>:<div>
          {(!menu.sop||menu.sop.length===0)?<div style={{textAlign:"center",padding:"60px 0",color:C.ink4}}><Ic d={I.sop} s={44} c={C.line}/><p style={{marginTop:12,fontFamily:"'Sarabun',sans-serif",fontSize:15}}>ยังไม่มี SOP</p></div>
          :menu.sop.map((step,idx)=><div key={idx} style={{display:"flex",gap:14,marginBottom:24}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:34}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,boxShadow:`0 4px 12px ${C.brand}44`}}>{idx+1}</div>
              {idx<menu.sop.length-1&&<div style={{width:2,flex:1,minHeight:20,background:`linear-gradient(to bottom,${C.brand},${C.brand}22)`,marginTop:5}}/>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:15,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:5}}>{step.title||`ขั้นตอนที่ ${idx+1}`}</div>
              {step.desc&&<p style={{fontSize:14,color:C.ink2,fontFamily:"'Sarabun',sans-serif",lineHeight:1.8,background:C.bg,padding:"10px 14px",borderRadius:10,border:`1px solid ${C.line}`,marginBottom:step.image?10:0}}>{step.desc}</p>}
              {step.image&&<img src={step.image} alt={step.title} style={{maxWidth:340,borderRadius:12,border:`2px solid ${C.line}`,marginTop:8,display:"block"}}/>}
            </div>
          </div>)}
        </div>}
      </>:<div style={{textAlign:"center",padding:"100px 0",color:C.ink4}}><Ic d={I.sop} s={52} c={C.line}/><p style={{marginTop:16,fontFamily:"'Sarabun',sans-serif",fontSize:16}}>เลือกเมนูเพื่อดู SOP</p></div>}
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════
// ── SUMMARY TAB ───────────────────────────────────────
// ══════════════════════════════════════════════════════
function SumTab({menus,ings,currentBranch,reloadHistory,reloadOrders,currentUser}){
  const[dateFrom,setDateFrom]=useState(todayStr);const[dateTo,setDateTo]=useState(todayStr);
  const[q,setQ]=useState("");const[selected,setSelected]=useState({});
  const[sortCol,setSortCol]=useState("margin");const[sortDir,setSortDir]=useState("desc");
  const[saving,setSaving]=useState(false);const[sendingOrder,setSendingOrder]=useState(false);
  const canE=hasPerm(currentUser,"edit_summary");const canOrder=hasPerm(currentUser,"edit_orders");
  function onSort(col){if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("desc");}}
  const allItems=useMemo(()=>menus.map(m=>{const c=menuCost(m,ings);const p=m.price-c;const mg=m.price>0?p/m.price*100:0;return{...m,cost:c,profit:p,margin:mg};}),[menus,ings]);
  const searchResults=useMemo(()=>allItems.filter(m=>m.name.toLowerCase().includes(q.toLowerCase())&&!selected[m.id]),[allItems,q,selected]);
  const selectedItems=useMemo(()=>allItems.filter(m=>selected[m.id]!==undefined),[allItems,selected]);
  const sortedSelected=useMemo(()=>[...selectedItems].sort((a,b)=>{let va=a[sortCol]??0,vb=b[sortCol]??0;if(sortCol==="soldQty"){va=+(selected[a.id]||0);vb=+(selected[b.id]||0);}return sortDir==="asc"?va-vb:vb-va;}),[selectedItems,sortCol,sortDir,selected]);
  const stats=useMemo(()=>({total:selectedItems.length,avg:selectedItems.length?selectedItems.reduce((s,i)=>s+i.margin,0)/selectedItems.length:0,totalRev:selectedItems.reduce((s,i)=>s+(+(selected[i.id]||0))*i.price,0),totalProfit:selectedItems.reduce((s,i)=>s+(+(selected[i.id]||0))*(i.price-i.cost),0)}),[selectedItems,selected]);

  async function saveSummary(){
    const snap=sortedSelected.map(m=>({name:m.name,category:m.category,price:m.price,cost:m.cost,margin:m.margin,soldQty:+(selected[m.id]||0),totalRevenue:(+(selected[m.id]||0))*m.price,totalCost:(+(selected[m.id]||0))*m.cost,totalProfit:(+(selected[m.id]||0))*(m.price-m.cost),ingredients:m.ingredients||[]}));
    setSaving(true);try{await api.addCostHist({date_from:dateFrom,date_to:dateTo,items:snap,saved_by:currentUser.username,saved_at:nowStr(),branch_id:currentBranch.id,branch_name:currentBranch.name});await reloadHistory();alert("✅ บันทึกสรุปต้นทุนสำเร็จ!");}catch(e){alert("บันทึกไม่สำเร็จ: "+e.message);}setSaving(false);
  }

  // คำนวณวัตถุดิบที่ต้องสั่ง จากยอดขาย
  function calcOrderItems(){
    const ingMap={};
    sortedSelected.forEach(m=>{
      const qty=+(selected[m.id]||0);
      if(!qty)return;
      (m.ingredients||[]).forEach(mi=>{
        const ing=ings.find(g=>g.id===mi.ingredientId);
        if(!ing)return;
        const totalGram=mi.amountGram*qty;
        if(!ingMap[ing.id])ingMap[ing.id]={ingId:ing.id,name:ing.name,unit:ing.buy_unit,pricePerGram:ing.price_per_gram,buyPrice:ing.buy_price,convertToGram:ing.convert_to_gram,supplierId:ing.supplier_id,supplierName:ing.supplier_name||"ไม่ระบุ",totalGram:0};
        ingMap[ing.id].totalGram+=totalGram;
      });
    });
    return Object.values(ingMap).map(i=>({...i,qtyNeeded:+(i.totalGram/i.convertToGram).toFixed(2),estimatedCost:+(i.totalGram*i.pricePerGram).toFixed(2)}));
  }

  async function sendOrderToCentral(){
    const orderItems=calcOrderItems();
    if(!orderItems.length){alert("ไม่มีวัตถุดิบที่ต้องสั่ง");return;}
    // group by supplier
    const supMap={};
    orderItems.forEach(i=>{const k=i.supplierId||"none";if(!supMap[k])supMap[k]={supplierId:i.supplierId,supplierName:i.supplierName,items:[]};supMap[k].items.push(i);});
    setSendingOrder(true);
    try{
      for(const sup of Object.values(supMap)){
        await api.addOrder({branch_id:currentBranch.id,branch_name:currentBranch.name,supplier_id:sup.supplierId,supplier_name:sup.supplierName,items:sup.items,status:"pending",requested_by:currentUser.username,requested_at:nowStr(),note:`${dateFrom} - ${dateTo}`});
      }
      await reloadOrders();alert("✅ ส่งรายการสั่งวัตถุดิบไปครัวกลางสำเร็จ!");
    }catch(e){alert("ส่งไม่สำเร็จ: "+e.message);}setSendingOrder(false);
  }

  return <div>
    <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
      <div style={{background:C.white,borderRadius:12,padding:"12px 16px",border:`1px solid ${C.line}`,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><Ic d={I.calendar} s={16} c={C.brand}/><span style={{fontSize:13,fontWeight:600,color:C.ink2,fontFamily:"'Sarabun',sans-serif"}}>ช่วงวันที่</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...iS,width:155,fontSize:13,padding:"7px 10px"}}/>
          <span style={{color:C.ink3}}>ถึง</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...iS,width:155,fontSize:13,padding:"7px 10px"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        {canE&&<Btn onClick={saveSummary} icon={I.save} v="success" disabled={selectedItems.length===0} loading={saving}>บันทึกสรุป</Btn>}
        {canOrder&&<Btn onClick={sendOrderToCentral} icon={I.send} v="teal" disabled={selectedItems.length===0} loading={sendingOrder}>ส่งสั่งวัตถุดิบ</Btn>}
      </div>
    </div>
    <Card style={{padding:"16px 20px",marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:10}}>ค้นหาและเพิ่มเมนูที่ต้องการสรุป</div>
      <div style={{position:"relative",marginBottom:10}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><Ic d={I.search} s={16} c={C.ink4}/></span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="พิมพ์ชื่อเมนู..." style={{...iS,paddingLeft:40}}/></div>
      {q&&<div style={{maxHeight:200,overflowY:"auto",background:C.bg,borderRadius:10,border:`1px solid ${C.line}`,padding:8}}>
        {searchResults.length===0?<div style={{textAlign:"center",padding:"16px",color:C.ink4,fontFamily:"'Sarabun',sans-serif",fontSize:13}}>ไม่พบเมนู</div>
        :searchResults.map(m=><div key={m.id} onClick={()=>{setSelected(p=>({...p,[m.id]:0}));setQ("");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,marginBottom:4,cursor:"pointer",background:C.white,border:`1px solid ${C.line}`,transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.brandLight} onMouseLeave={e=>e.currentTarget.style.background=C.white}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>{m.image&&<img src={m.image} alt={m.name} style={{width:28,height:28,objectFit:"cover",borderRadius:5}}/>}<span style={{fontWeight:600,color:C.ink,fontFamily:"'Sarabun',sans-serif"}}>{m.name}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,color:C.brand,fontWeight:700}}>฿{m.price}</span><Btn icon={I.plus} s={{padding:"4px 10px",fontSize:12}}>เพิ่ม</Btn></div>
        </div>)}
      </div>}
    </Card>
    {selectedItems.length>0&&<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:20}}>
        {[{l:"เมนูที่เลือก",v:stats.total,u:"เมนู",icon:I.fire,c:C.blue},{l:"กำไรเฉลี่ย",v:stats.avg.toFixed(1),u:"%",icon:I.chart,c:C.brand},{l:"รายรับรวม",v:`฿${stats.totalRev.toFixed(0)}`,u:"",icon:I.bolt,c:C.green},{l:"กำไรสุทธิ",v:`฿${stats.totalProfit.toFixed(0)}`,u:"",icon:I.check,c:C.purple}].map(card=><div key={card.l} style={{background:C.white,borderRadius:16,padding:"14px 18px",boxShadow:"0 2px 8px rgba(15,23,42,.06)",display:"flex",alignItems:"center",gap:12}}><div style={{width:42,height:42,borderRadius:12,background:`${card.c}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={card.icon} s={20} c={card.c}/></div><div><div style={{fontSize:11,color:C.ink4,fontFamily:"'Sarabun',sans-serif",marginBottom:1}}>{card.l}</div><div style={{fontSize:18,fontWeight:800,color:card.c,fontFamily:"'Sarabun',sans-serif",lineHeight:1.1}}>{card.v}<span style={{fontSize:12,fontWeight:600,marginLeft:2,color:C.ink3}}>{card.u}</span></div></div></div>)}
      </div>
      <Card>
        <div style={{padding:"12px 18px 10px",borderBottom:`1px solid ${C.line}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontWeight:800,fontSize:14,fontFamily:"'Sarabun',sans-serif",color:C.ink}}>ตารางสรุป ({selectedItems.length} เมนู)</span>
          <span style={{fontSize:11,color:C.ink3,fontFamily:"'Sarabun',sans-serif"}}>กดหัวตารางเพื่อเรียง</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Sarabun',sans-serif"}}>
            <thead><tr><STh label="เมนู" col="name" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><STh label="ราคาขาย" col="price" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><STh label="ต้นทุน" col="cost" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><STh label="% กำไร" col="margin" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><STh label="ขายออก (จาน)" col="soldQty" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><STh label="รายรับ" col="totalRevenue" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><STh label="กำไรสุทธิ" col="totalProfit" sortCol={sortCol} sortDir={sortDir} onSort={onSort}/><th style={{padding:"10px 12px",background:C.bg}}></th></tr></thead>
            <tbody>{sortedSelected.map((item,idx)=>{const qty=+(selected[item.id]||0);const rev=qty*item.price;const np=qty*(item.price-item.cost);return <tr key={item.id} style={{borderTop:`1px solid ${C.lineLight}`,background:idx%2===0?C.white:C.bg}} onMouseEnter={e=>e.currentTarget.style.background=C.brandLight} onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?C.white:C.bg}>
              <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}>{item.image&&<img src={item.image} alt={item.name} style={{width:26,height:26,objectFit:"cover",borderRadius:5}}/>}<span style={{fontWeight:700,color:C.ink,fontSize:13}}>{item.name}</span></div></td>
              <td style={{padding:"10px 12px",fontWeight:700,fontSize:13}}>฿{item.price}</td>
              <td style={{padding:"10px 12px",color:C.brand,fontWeight:700,fontSize:13}}>฿{item.cost.toFixed(2)}</td>
              <td style={{padding:"10px 12px"}}><span style={{fontSize:12,fontWeight:700,color:marginColor(item.margin)}}>{item.margin.toFixed(0)}%</span></td>
              <td style={{padding:"10px 12px"}}>{canE?<input type="number" min="0" value={selected[item.id]||""} onChange={e=>setSelected(p=>({...p,[item.id]:e.target.value}))} placeholder="0" style={{...iS,width:80,padding:"5px 8px",fontSize:13,textAlign:"center"}}/>:<span style={{fontWeight:700}}>{selected[item.id]||0}</span>}</td>
              <td style={{padding:"10px 12px",color:C.blue,fontWeight:700,fontSize:13}}>฿{rev.toFixed(0)}</td>
              <td style={{padding:"10px 12px",color:np>=0?C.green:C.red,fontWeight:700,fontSize:13}}>฿{np.toFixed(0)}</td>
              <td style={{padding:"10px 12px"}}><button onClick={()=>setSelected(p=>{const n={...p};delete n[item.id];return n;})} style={{background:C.redLight,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",display:"flex"}}><Ic d={I.x} s={13} c={C.red}/></button></td>
            </tr>;})}
            </tbody>
          </table>
        </div>
      </Card>
    </>}
    {selectedItems.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:C.ink4}}><Ic d={I.search} s={44} c={C.line}/><p style={{marginTop:12,fontFamily:"'Sarabun',sans-serif",fontSize:15}}>ค้นหาและเพิ่มเมนูเพื่อสรุปต้นทุน</p></div>}
  </div>;
}

// ══════════════════════════════════════════════════════
// ── ORDER TAB ─────────────────────────────────────────
// ══════════════════════════════════════════════════════
function OrderTab({orders,allOrders,reload,ings,suppliers,currentBranch,currentUser}){
  const isCentral=currentBranch.type==="central";
  const[view,setView]=useState(isCentral?"all":"mine");
  const[editOrder,setEditOrder]=useState(null);
  const[saving,setSaving]=useState(false);
  const canOrder=hasPerm(currentUser,"edit_orders");

  const displayOrders=isCentral?(view==="all"?allOrders:orders):orders;

  function printOrder(order){
    const w=window.open("","_blank");
    const rows=(order.items||[]).map(i=>`<tr><td>${i.supplierName||i.supplier_name||"-"}</td><td>${i.name}</td><td>${i.qtyNeeded||0} ${i.unit||""}</td><td>฿${i.estimatedCost?.toFixed(2)||0}</td></tr>`).join("");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>รายการสั่งวัตถุดิบ</title><style>body{font-family:'Sarabun',sans-serif;padding:24px}h2{color:#FF6B35}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;font-size:13px}th{background:#f5f5f5;font-weight:700}.status{display:inline-block;padding:2px 10px;border-radius:20px;font-weight:700}@media print{.noprint{display:none}}</style></head><body><h2>NAIWANSOOK FOODCOST — รายการสั่งวัตถุดิบ</h2><p>สาขา: <b>${order.branch_name}</b> | ซัพพลาย: <b>${order.supplier_name}</b></p><p>สั่งโดย: <b>${order.requested_by}</b> | วันที่: ${order.requested_at}</p><p>ช่วงวันที่: ${order.note||"-"}</p><table><thead><tr><th>ซัพพลาย</th><th>วัตถุดิบ</th><th>จำนวน</th><th>ราคาประมาณ</th></tr></thead><tbody>${rows}</tbody></table><br/><button class="noprint" onclick="window.print()">🖨️ พิมพ์</button></body></html>`);
    w.document.close();setTimeout(()=>w.print(),600);
  }

  const statusColor={pending:"yellow",approved:"green",rejected:"red",delivered:"blue"};
  const statusLabel={pending:"รอดำเนินการ",approved:"อนุมัติ",rejected:"ปฏิเสธ",delivered:"จัดส่งแล้ว"};

  return <div>
    {isCentral&&<div style={{display:"flex",gap:8,marginBottom:16}}>
      {[{id:"all",l:"ทุกสาขา"},{id:"mine",l:"ครัวกลาง"}].map(t=><button key={t.id} onClick={()=>setView(t.id)} style={{padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Sarabun',sans-serif",fontSize:13,fontWeight:700,background:view===t.id?C.teal:"transparent",color:view===t.id?C.white:C.ink3,transition:"all .15s"}}>{t.l}</button>)}
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,background:C.tealLight,borderRadius:8,padding:"6px 12px"}}><Ic d={I.shop} s={14} c={C.teal}/><span style={{fontSize:12,fontWeight:700,color:C.teal,fontFamily:"'Sarabun',sans-serif"}}>ครัวกลาง — รับคำสั่งซื้อจากทุกสาขา</span></div>
    </div>}

    {displayOrders.length===0?<div style={{textAlign:"center",padding:"80px 0",color:C.ink4}}><Ic d={I.box} s={48} c={C.line}/><p style={{marginTop:16,fontFamily:"'Sarabun',sans-serif",fontSize:15}}>ยังไม่มีรายการสั่งวัตถุดิบ<br/><span style={{fontSize:13}}>กด "ส่งสั่งวัตถุดิบ" จากหน้าสรุปต้นทุน</span></p></div>
    :<div style={{display:"flex",flexDirection:"column",gap:12}}>
      {displayOrders.map(order=><Card key={order.id} style={{overflow:"hidden"}}>
        <div style={{padding:"14px 18px",background:C.bg,borderBottom:`1px solid ${C.line}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Chip color="teal">{order.branch_name}</Chip>
              <Chip color="orange">{order.supplier_name}</Chip>
              <Chip color={statusColor[order.status]||"gray"}>{statusLabel[order.status]||order.status}</Chip>
            </div>
            <div style={{fontSize:12,color:C.ink3,fontFamily:"'Sarabun',sans-serif"}}>สั่งโดย {order.requested_by} · {order.requested_at} · ช่วง: {order.note||"-"}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {canOrder&&<button onClick={()=>setEditOrder(editOrder?.id===order.id?null:order)} style={{background:C.blueLight,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:C.blue,fontFamily:"'Sarabun',sans-serif",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Ic d={I.pencil} s={12} c={C.blue}/>แก้ไข</button>}
            <button onClick={()=>printOrder(order)} style={{background:C.lineLight,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:C.ink2,fontFamily:"'Sarabun',sans-serif",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Ic d={I.printer} s={12} c={C.ink3}/>PDF/พิมพ์</button>
            {isCentral&&canOrder&&<>
              {order.status==="pending"&&<button onClick={async()=>{try{await api.updateOrder(order.id,{status:"approved"});await reload();}catch(e){alert("ไม่สำเร็จ");}}} style={{background:C.greenLight,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:C.green,fontFamily:"'Sarabun',sans-serif",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Ic d={I.check} s={12} c={C.green}/>อนุมัติ</button>}
              {order.status==="approved"&&<button onClick={async()=>{try{await api.updateOrder(order.id,{status:"delivered"});await reload();}catch(e){alert("ไม่สำเร็จ");}}} style={{background:C.blueLight,border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:C.blue,fontFamily:"'Sarabun',sans-serif",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Ic d={I.truck} s={12} c={C.blue}/>จัดส่งแล้ว</button>}
            </>}
            {canOrder&&<button onClick={async()=>{if(!confirm("ลบรายการนี้?"))return;try{await api.deleteOrder(order.id);await reload();}catch(e){alert("ลบไม่สำเร็จ");}}} style={{background:C.redLight,border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>}
          </div>
        </div>
        <div style={{padding:"12px 18px"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Sarabun',sans-serif",fontSize:13}}>
            <thead><tr style={{background:C.bg}}>{["ซัพพลาย","วัตถุดิบ","จำนวนที่ต้องสั่ง","ราคาประมาณ"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",fontWeight:700,color:C.ink3,fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{(order.items||[]).map((it,i)=><tr key={i} style={{borderTop:`1px solid ${C.lineLight}`}}>
              <td style={{padding:"7px 10px"}}><Chip color="teal">{it.supplierName||it.supplier_name||"ไม่ระบุ"}</Chip></td>
              <td style={{padding:"7px 10px",fontWeight:600,color:C.ink}}>{it.name}</td>
              <td style={{padding:"7px 10px",color:C.brand,fontWeight:700}}>{it.qtyNeeded} {it.unit}</td>
              <td style={{padding:"7px 10px",color:C.green,fontWeight:700}}>฿{it.estimatedCost?.toFixed(2)}</td>
            </tr>)}
            </tbody>
          </table>
          {editOrder?.id===order.id&&<div style={{marginTop:12,padding:"12px",background:C.bg,borderRadius:10}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink2,marginBottom:8,fontFamily:"'Sarabun',sans-serif"}}>เปลี่ยนสถานะ</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["pending","approved","rejected","delivered"].map(s=><button key={s} onClick={async()=>{try{await api.updateOrder(order.id,{status:s});await reload();setEditOrder(null);}catch(e){alert("ไม่สำเร็จ");}}} style={{padding:"6px 14px",borderRadius:8,border:`2px solid ${order.status===s?C.brand:C.line}`,background:order.status===s?C.brandLight:C.white,cursor:"pointer",fontFamily:"'Sarabun',sans-serif",fontWeight:700,fontSize:13,color:order.status===s?C.brand:C.ink3}}>{statusLabel[s]}</button>)}
            </div>
          </div>}
        </div>
      </Card>)}
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════
// ── HISTORY TAB ───────────────────────────────────────
// ══════════════════════════════════════════════════════
function HisTab({costHistory,actionHistory,reloadHistory,reloadAction,ings,currentBranch,reloadOrders,currentUser}){
  const[view,setView]=useState("cost");const[selSnap,setSelSnap]=useState(null);const[sendingOrder,setSendingOrder]=useState(null);
  const canOrder=hasPerm(currentUser,"edit_orders");

  function exportCSV(snap){const rows=[["เมนู","ราคาขาย","ต้นทุน","กำไร%","ขายออก","รายรับ","กำไรสุทธิ"],...(snap.items||[]).map(i=>[i.name,i.price,i.cost?.toFixed(2),i.margin?.toFixed(1),i.soldQty,i.totalRevenue?.toFixed(0),i.totalProfit?.toFixed(0)])];const csv=rows.map(r=>r.join(",")).join("\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=`foodcost-${snap.date_from}_${snap.date_to}.csv`;a.click();URL.revokeObjectURL(u);}
  function printSnap(snap){const w=window.open("","_blank");const rows=(snap.items||[]).map(i=>`<tr><td>${i.name}</td><td>฿${i.price}</td><td>฿${i.cost?.toFixed(2)}</td><td>${i.margin?.toFixed(1)}%</td><td>${i.soldQty}</td><td>฿${i.totalRevenue?.toFixed(0)}</td><td>฿${i.totalProfit?.toFixed(0)}</td></tr>`).join("");w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>สรุปต้นทุน</title><style>body{font-family:'Sarabun',sans-serif;padding:24px}h2{color:#FF6B35}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;font-size:13px}th{background:#f5f5f5;font-weight:700}@media print{.noprint{display:none}}</style></head><body><h2>NAIWANSOOK FOODCOST — สรุปต้นทุน</h2><p>สาขา: <b>${snap.branch_name||""}</b> | ${snap.date_from} ถึง ${snap.date_to} | บันทึกโดย: ${snap.saved_by}</p><table><thead><tr><th>เมนู</th><th>ราคาขาย</th><th>ต้นทุน</th><th>กำไร%</th><th>ขายออก</th><th>รายรับ</th><th>กำไรสุทธิ</th></tr></thead><tbody>${rows}</tbody></table><button class="noprint" onclick="window.print()">พิมพ์</button></body></html>`);w.document.close();setTimeout(()=>w.print(),600);}

  async function sendOrderFromSnap(snap){
    const ingMap={};
    (snap.items||[]).forEach(m=>{
      const qty=+(m.soldQty||0);
      (m.ingredients||[]).forEach(mi=>{
        const ing=ings.find(g=>g.id===mi.ingredientId);
        if(!ing)return;
        const totalGram=mi.amountGram*qty;
        if(!ingMap[ing.id])ingMap[ing.id]={ingId:ing.id,name:ing.name,unit:ing.buy_unit,pricePerGram:ing.price_per_gram,buyPrice:ing.buy_price,convertToGram:ing.convert_to_gram,supplierId:ing.supplier_id,supplierName:ing.supplier_name||"ไม่ระบุ",totalGram:0};
        ingMap[ing.id].totalGram+=totalGram;
      });
    });
    const orderItems=Object.values(ingMap).map(i=>({...i,qtyNeeded:+(i.totalGram/i.convertToGram).toFixed(2),estimatedCost:+(i.totalGram*i.pricePerGram).toFixed(2)}));
    if(!orderItems.length){alert("ไม่มีวัตถุดิบที่ต้องสั่ง");return;}
    const supMap={};
    orderItems.forEach(i=>{const k=i.supplierId||"none";if(!supMap[k])supMap[k]={supplierId:i.supplierId,supplierName:i.supplierName,items:[]};supMap[k].items.push(i);});
    setSendingOrder(snap.id);
    try{for(const sup of Object.values(supMap)){await api.addOrder({branch_id:currentBranch.id,branch_name:currentBranch.name,supplier_id:sup.supplierId,supplier_name:sup.supplierName,items:sup.items,status:"pending",requested_by:currentUser.username,requested_at:nowStr(),note:`${snap.date_from} - ${snap.date_to}`});}await reloadOrders();alert("✅ ส่งรายการสั่งวัตถุดิบไปครัวกลางสำเร็จ!");}
    catch(e){alert("ส่งไม่สำเร็จ: "+e.message);}setSendingOrder(null);
  }

  return <div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {[{id:"cost",l:"ประวัติต้นทุน"},{id:"action",l:"ประวัติการแก้ไข"}].map(t=><button key={t.id} onClick={()=>setView(t.id)} style={{padding:"8px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Sarabun',sans-serif",fontSize:13,fontWeight:700,background:view===t.id?C.brand:"transparent",color:view===t.id?C.white:C.ink3,transition:"all .15s"}}>{t.l}</button>)}
    </div>
    {view==="cost"&&<div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}>
        <Btn v="ghost" onClick={reloadHistory} icon={I.refresh} s={{padding:"7px 14px",fontSize:12}}>รีเฟรช</Btn>
        {costHistory.length>0&&<Btn v="danger" onClick={async()=>{if(!confirm("ลบประวัติต้นทุนทั้งหมด?"))return;try{await api.clearCostHist(currentBranch.id);await reloadHistory();}catch(e){alert("ลบไม่สำเร็จ");}}} s={{padding:"7px 14px",fontSize:12}} icon={I.trash}>ลบทั้งหมด</Btn>}
      </div>
      {costHistory.length===0?<Card><div style={{textAlign:"center",padding:"60px 0",color:C.ink4}}><Ic d={I.clock} s={40} c={C.line}/><p style={{marginTop:12,fontFamily:"'Sarabun',sans-serif"}}>ยังไม่มีประวัติต้นทุน</p></div></Card>
      :costHistory.map(snap=><Card key={snap.id} style={{marginBottom:12,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg,borderBottom:`1px solid ${C.line}`,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:2}}>📅 {snap.date_from} → {snap.date_to}</div>
            <div style={{fontSize:11,color:C.ink3,fontFamily:"'Sarabun',sans-serif"}}>{(snap.items||[]).length} เมนู · บันทึกโดย {snap.saved_by} · {snap.saved_at}</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <Btn v="ghost" onClick={()=>setSelSnap(selSnap?.id===snap.id?null:snap)} s={{padding:"5px 10px",fontSize:11}} icon={I.eye}>รายละเอียด</Btn>
            <Btn v="success" onClick={()=>exportCSV(snap)} s={{padding:"5px 10px",fontSize:11}} icon={I.dl}>CSV</Btn>
            <Btn v="info" onClick={()=>printSnap(snap)} s={{padding:"5px 10px",fontSize:11}} icon={I.printer}>PDF/พิมพ์</Btn>
            {canOrder&&<Btn v="teal" onClick={()=>sendOrderFromSnap(snap)} loading={sendingOrder===snap.id} s={{padding:"5px 10px",fontSize:11}} icon={I.send}>ส่งสั่งวัตถุดิบ</Btn>}
          </div>
        </div>
        {selSnap?.id===snap.id&&<div style={{padding:"12px 18px",overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Sarabun',sans-serif",fontSize:13}}>
            <thead><tr style={{background:C.bg}}>{["เมนู","ราคาขาย","ต้นทุน","กำไร%","ขายออก","รายรับ","กำไรสุทธิ"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontWeight:700,color:C.ink3,fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{(snap.items||[]).map((it,i)=><tr key={i} style={{borderTop:`1px solid ${C.lineLight}`}}>
              <td style={{padding:"7px 10px",fontWeight:600}}>{it.name}</td>
              <td style={{padding:"7px 10px"}}>฿{it.price}</td>
              <td style={{padding:"7px 10px",color:C.brand}}>฿{it.cost?.toFixed(2)}</td>
              <td style={{padding:"7px 10px",color:marginColor(it.margin||0),fontWeight:700}}>{it.margin?.toFixed(1)}%</td>
              <td style={{padding:"7px 10px",fontWeight:700}}>{it.soldQty} จาน</td>
              <td style={{padding:"7px 10px",color:C.blue,fontWeight:700}}>฿{it.totalRevenue?.toFixed(0)}</td>
              <td style={{padding:"7px 10px",color:(it.totalProfit||0)>=0?C.green:C.red,fontWeight:700}}>฿{it.totalProfit?.toFixed(0)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </Card>)}
    </div>}
    {view==="action"&&<div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}>
        <Btn v="ghost" onClick={reloadAction} icon={I.refresh} s={{padding:"7px 14px",fontSize:12}}>รีเฟรช</Btn>
        {actionHistory.length>0&&<Btn v="danger" onClick={async()=>{if(!confirm("ลบประวัติ?"))return;try{await api.clearActionHist();await reloadAction();}catch(e){alert("ลบไม่สำเร็จ");}}} s={{padding:"7px 14px",fontSize:12}} icon={I.trash}>ลบ</Btn>}
      </div>
      <Card>{actionHistory.length===0?<div style={{textAlign:"center",padding:"60px 0",color:C.ink4}}><Ic d={I.clock} s={40} c={C.line}/><p style={{marginTop:12,fontFamily:"'Sarabun',sans-serif"}}>ยังไม่มีประวัติ</p></div>
      :actionHistory.map((item,idx)=><div key={idx} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:`1px solid ${C.lineLight}`}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:C.brandLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic d={I.check} s={13} c={C.brand}/></div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.ink,fontFamily:"'Sarabun',sans-serif"}}>{item.action}</div><div style={{fontSize:11,color:C.ink4,fontFamily:"'Sarabun',sans-serif",marginTop:1}}>{item.time}</div></div>
      </div>)}</Card>
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════
// ── SETTINGS TAB ──────────────────────────────────────
// ══════════════════════════════════════════════════════
function SettingsTab({ingCats,menuCats,reloadCats,users,reloadUsers,branches,reloadBranches,suppliers,reloadSuppliers,currentUser}){
  const[section,setSection]=useState("cats");
  const[newIC,setNewIC]=useState("");const[newMC,setNewMC]=useState("");
  const[showUser,setShowUser]=useState(false);const[editUID,setEditUID]=useState(null);const[saving,setSaving]=useState(false);
  const uF0={username:"",password:"",name:"",role:"staff",active:true,perms:ROLE_DEFAULT_PERMS.staff};
  const[uF,setUF]=useState(uF0);
  const[branchForm,setBranchForm]=useState({name:"",type:"branch",active:true});const[editBID,setEditBID]=useState(null);
  const[supForm,setSupForm]=useState({name:"",contact:"",phone:"",note:"",active:true});const[editSID,setEditSID]=useState(null);
  const isAdmin=hasPerm(currentUser,"settings");
  const permGroups=useMemo(()=>{const g={};ALL_PERMS.forEach(p=>{(g[p.group]||(g[p.group]=[])).push(p);});return g;},[]);

  async function saveUser(){if(!uF.username||!uF.password)return;setSaving(true);try{if(editUID)await api.updateUser(editUID,uF);else await api.addUser(uF);await reloadUsers();setShowUser(false);setEditUID(null);setUF(uF0);}catch(e){alert("บันทึกไม่สำเร็จ: "+e.message);}setSaving(false);}
  async function saveBranch(){if(!branchForm.name)return;try{if(editBID)await api.updateBranch(editBID,branchForm);else await api.addBranch(branchForm);await reloadBranches();setBranchForm({name:"",type:"branch",active:true});setEditBID(null);}catch(e){alert("บันทึกไม่สำเร็จ");};}
  async function saveSup(){if(!supForm.name)return;try{if(editSID)await api.updateSupplier(editSID,supForm);else await api.addSupplier(supForm);await reloadSuppliers();setSupForm({name:"",contact:"",phone:"",note:"",active:true});setEditSID(null);}catch(e){alert("บันทึกไม่สำเร็จ");};}

  const sections=[{id:"cats",label:"หมวดหมู่",icon:I.tag},{id:"branches",label:"สาขา",icon:I.branch},{id:"suppliers",label:"ซัพพลาย",icon:I.truck},{id:"users",label:"ผู้ใช้",icon:I.users}];

  return <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:16,minHeight:480}}>
    <Card style={{padding:8,height:"fit-content"}}>
      {sections.map(s=><div key={s.id} onClick={()=>setSection(s.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,cursor:"pointer",marginBottom:4,background:section===s.id?C.brandLight:"transparent",color:section===s.id?C.brand:C.ink2,fontWeight:section===s.id?700:500,fontFamily:"'Sarabun',sans-serif",fontSize:14,transition:"all .15s"}}><Ic d={s.icon} s={15} c={section===s.id?C.brand:C.ink3}/>{s.label}</div>)}
    </Card>
    <div>
    {section==="cats"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {[{title:"หมวดหมู่วัตถุดิบ",icon:I.leaf,cats:ingCats,addFn:async()=>{if(!newIC.trim())return;await api.addCat({type:"ingredient",name:newIC.trim()});await reloadCats();setNewIC("");},delFn:async(id,name)=>{if(!confirm(`ลบหมวด "${name}"?`))return;await api.deleteCat(id);await reloadCats();},newV:newIC,setNew:setNewIC},
        {title:"หมวดหมู่เมนู",icon:I.fire,cats:menuCats,addFn:async()=>{if(!newMC.trim())return;await api.addCat({type:"menu",name:newMC.trim()});await reloadCats();setNewMC("");},delFn:async(id,name)=>{if(!confirm(`ลบหมวด "${name}"?`))return;await api.deleteCat(id);await reloadCats();},newV:newMC,setNew:setNewMC}
      ].map(({title,icon,cats,addFn,delFn,newV,setNew})=>(
        <Card key={title} style={{padding:"18px 20px"}}>
          <h3 style={{fontFamily:"'Sarabun',sans-serif",fontSize:15,fontWeight:800,color:C.ink,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic d={icon} s={15} c={C.brand}/>{title}</h3>
          {cats.map(c=><div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:9,marginBottom:5,background:C.bg,border:`1px solid ${C.line}`}}>
            <span style={{fontFamily:"'Sarabun',sans-serif",fontSize:14,color:C.ink2}}>{c.name}</span>
            {isAdmin&&<button onClick={()=>delFn(c.id,c.name)} style={{background:C.redLight,border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>}
          </div>)}
          {isAdmin&&<div style={{display:"flex",gap:8,marginTop:8}}><input value={newV} onChange={e=>setNew(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFn()} placeholder="หมวดใหม่..." style={{...iS,flex:1,padding:"7px 12px",fontSize:13}}/><Btn onClick={addFn} icon={I.plus} s={{padding:"7px 12px"}}>เพิ่ม</Btn></div>}
        </Card>
      ))}
    </div>}

    {section==="branches"&&<div>
      <h3 style={{fontFamily:"'Sarabun',sans-serif",fontSize:15,fontWeight:800,color:C.ink,marginBottom:14}}>จัดการสาขา</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:16}}>
        {branches.map(b=><Card key={b.id} style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:5}}>{b.name}</div>
              <Chip color={b.type==="central"?"teal":"orange"}>{b.type==="central"?"ครัวกลาง":"สาขา"}</Chip>
              <Chip color={b.active?"green":"gray"} style={{marginLeft:4}}>{b.active?"เปิด":"ปิด"}</Chip>
            </div>
            {isAdmin&&<div style={{display:"flex",gap:4}}>
              <button onClick={()=>{setBranchForm({name:b.name,type:b.type,active:b.active});setEditBID(b.id);}} style={{background:C.blueLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.pencil} s={13} c={C.blue}/></button>
              {b.type!=="central"&&<button onClick={async()=>{if(!confirm("ลบสาขา?"))return;await api.deleteBranch(b.id);await reloadBranches();}} style={{background:C.redLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>}
            </div>}
          </div>
        </Card>)}
      </div>
      {isAdmin&&<Card style={{padding:"16px 18px"}}>
        <h4 style={{fontFamily:"'Sarabun',sans-serif",fontSize:14,fontWeight:700,color:C.ink,marginBottom:12}}>{editBID?"แก้ไขสาขา":"เพิ่มสาขาใหม่"}</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <Inp label="ชื่อสาขา" value={branchForm.name} onChange={e=>setBranchForm(f=>({...f,name:e.target.value}))} placeholder="ชื่อสาขา"/>
          <Field label="ประเภท"><select value={branchForm.type} onChange={e=>setBranchForm(f=>({...f,type:e.target.value}))} style={{...iS,appearance:"none"}}><option value="branch">สาขา</option><option value="central">ครัวกลาง</option></select></Field>
          <Field label="สถานะ"><select value={branchForm.active?"true":"false"} onChange={e=>setBranchForm(f=>({...f,active:e.target.value==="true"}))} style={{...iS,appearance:"none"}}><option value="true">เปิดใช้งาน</option><option value="false">ปิดใช้งาน</option></select></Field>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={saveBranch} icon={I.check} disabled={!branchForm.name}>{editBID?"บันทึก":"เพิ่มสาขา"}</Btn>
          {editBID&&<Btn v="ghost" onClick={()=>{setBranchForm({name:"",type:"branch",active:true});setEditBID(null);}}>ยกเลิก</Btn>}
        </div>
      </Card>}
    </div>}

    {section==="suppliers"&&<div>
      <h3 style={{fontFamily:"'Sarabun',sans-serif",fontSize:15,fontWeight:800,color:C.ink,marginBottom:14}}>จัดการซัพพลาย</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,marginBottom:16}}>
        {suppliers.map(s=><Card key={s.id} style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:C.ink,fontFamily:"'Sarabun',sans-serif",marginBottom:4}}>{s.name}</div>
              {s.contact&&<div style={{fontSize:12,color:C.ink3,fontFamily:"'Sarabun',sans-serif"}}>{s.contact}</div>}
              {s.phone&&<div style={{fontSize:12,color:C.blue,fontFamily:"'Sarabun',sans-serif"}}>{s.phone}</div>}
              {s.note&&<div style={{fontSize:11,color:C.ink4,fontFamily:"'Sarabun',sans-serif",fontStyle:"italic",marginTop:4}}>📝 {s.note}</div>}
            </div>
            {isAdmin&&<div style={{display:"flex",gap:4}}>
              <button onClick={()=>{setSupForm({name:s.name,contact:s.contact||"",phone:s.phone||"",note:s.note||"",active:s.active});setEditSID(s.id);}} style={{background:C.blueLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.pencil} s={13} c={C.blue}/></button>
              <button onClick={async()=>{if(!confirm("ลบซัพพลาย?"))return;await api.deleteSupplier(s.id);await reloadSuppliers();}} style={{background:C.redLight,border:"none",borderRadius:7,padding:6,cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>
            </div>}
          </div>
        </Card>)}
      </div>
      {isAdmin&&<Card style={{padding:"16px 18px"}}>
        <h4 style={{fontFamily:"'Sarabun',sans-serif",fontSize:14,fontWeight:700,color:C.ink,marginBottom:12}}>{editSID?"แก้ไขซัพพลาย":"เพิ่มซัพพลายใหม่"}</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label="ชื่อซัพพลาย" value={supForm.name} onChange={e=>setSupForm(f=>({...f,name:e.target.value}))} placeholder="เช่น ตลาดสด ก."/>
          <Inp label="ชื่อผู้ติดต่อ" value={supForm.contact} onChange={e=>setSupForm(f=>({...f,contact:e.target.value}))} placeholder="คุณสมชาย"/>
          <Inp label="เบอร์โทร" value={supForm.phone} onChange={e=>setSupForm(f=>({...f,phone:e.target.value}))} placeholder="081-234-5678"/>
          <Inp label="หมายเหตุ" value={supForm.note} onChange={e=>setSupForm(f=>({...f,note:e.target.value}))} placeholder="ส่งทุกเช้า..."/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={saveSup} icon={I.check} disabled={!supForm.name}>{editSID?"บันทึก":"เพิ่มซัพพลาย"}</Btn>
          {editSID&&<Btn v="ghost" onClick={()=>{setSupForm({name:"",contact:"",phone:"",note:"",active:true});setEditSID(null);}}>ยกเลิก</Btn>}
        </div>
      </Card>}
    </div>}

    {section==="users"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontFamily:"'Sarabun',sans-serif",fontSize:15,fontWeight:800,color:C.ink}}>ผู้ใช้งานและสิทธิ์</h3>
        {isAdmin&&<Btn onClick={()=>{setUF(uF0);setEditUID(null);setShowUser(true);}} icon={I.plus}>เพิ่มผู้ใช้</Btn>}
      </div>
      <Card>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Sarabun',sans-serif"}}>
          <thead><tr style={{background:C.bg}}>{["ผู้ใช้","ชื่อ","บทบาท","สิทธิ์","สถานะ",""].map(h=><th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.ink3}}>{h}</th>)}</tr></thead>
          <tbody>{users.map(u=>{const perms=u.perms||[];return <tr key={u.id} style={{borderTop:`1px solid ${C.lineLight}`}}>
            <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.user} s={14} c={C.white}/></div><span style={{fontWeight:700,color:C.ink,fontSize:13}}>{u.username}</span></div></td>
            <td style={{padding:"11px 14px",color:C.ink2,fontSize:13}}>{u.name}</td>
            <td style={{padding:"11px 14px"}}><Chip color={ROLES[u.role]?.color||"gray"}>{ROLES[u.role]?.label||u.role}</Chip></td>
            <td style={{padding:"11px 14px"}}><span style={{fontSize:12,color:C.ink3}}>{perms.length} สิทธิ์</span></td>
            <td style={{padding:"11px 14px"}}><Chip color={u.active?"green":"gray"}>{u.active?"ใช้งาน":"ปิด"}</Chip></td>
            <td style={{padding:"11px 14px"}}>{isAdmin&&<div style={{display:"flex",gap:5}}>
              <button onClick={()=>{setUF({username:u.username,password:u.password,name:u.name,role:u.role,active:u.active,perms:u.perms||[]});setEditUID(u.id);setShowUser(true);}} style={{background:C.blueLight,border:"none",borderRadius:7,padding:5,cursor:"pointer",display:"flex"}}><Ic d={I.pencil} s={13} c={C.blue}/></button>
              {u.id!==currentUser.id&&<button onClick={async()=>{if(!confirm("ลบผู้ใช้?"))return;try{await api.deleteUser(u.id);await reloadUsers();}catch(e){alert("ลบไม่สำเร็จ");}}} style={{background:C.redLight,border:"none",borderRadius:7,padding:5,cursor:"pointer",display:"flex"}}><Ic d={I.trash} s={13} c={C.red}/></button>}
            </div>}</td>
          </tr>;})}
          </tbody>
        </table>
      </Card>
    </div>}
    </div>

    {showUser&&<Modal title={editUID?"✏️ แก้ไขผู้ใช้":"➕ เพิ่มผู้ใช้ใหม่"} onClose={()=>setShowUser(false)} extraWide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Inp label="ชื่อผู้ใช้" value={uF.username} onChange={e=>setUF(f=>({...f,username:e.target.value}))} placeholder="username"/><Inp label="รหัสผ่าน" type="password" value={uF.password} onChange={e=>setUF(f=>({...f,password:e.target.value}))} placeholder="password"/></div>
          <Inp label="ชื่อ-นามสกุล" value={uF.name} onChange={e=>setUF(f=>({...f,name:e.target.value}))} placeholder="ชื่อจริง"/>
          <div style={{marginBottom:14}}><label style={{display:"block",fontSize:13,fontWeight:600,color:C.ink2,marginBottom:8,fontFamily:"'Sarabun',sans-serif"}}>บทบาท</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(ROLES).map(([k,r])=><button key={k} onClick={()=>setUF(f=>({...f,role:k,perms:ROLE_DEFAULT_PERMS[k]||[]}))} style={{padding:"6px 12px",borderRadius:8,border:`2px solid ${uF.role===k?C.brand:C.line}`,background:uF.role===k?C.brandLight:C.white,cursor:"pointer",fontFamily:"'Sarabun',sans-serif",fontWeight:700,fontSize:13,color:uF.role===k?C.brand:C.ink3}}>{r.label}</button>)}</div></div>
          <div style={{display:"flex",gap:8}}>{[{v:true,l:"ใช้งาน"},{v:false,l:"ปิดใช้"}].map(o=><button key={String(o.v)} onClick={()=>setUF(f=>({...f,active:o.v}))} style={{padding:"6px 14px",borderRadius:8,border:`2px solid ${uF.active===o.v?C.brand:C.line}`,background:uF.active===o.v?C.brandLight:C.white,cursor:"pointer",fontFamily:"'Sarabun',sans-serif",fontWeight:700,fontSize:13,color:uF.active===o.v?C.brand:C.ink3}}>{o.l}</button>)}</div>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.ink2,marginBottom:8,fontFamily:"'Sarabun',sans-serif"}}>สิทธิ์ ({(uF.perms||[]).length}/{ALL_PERMS.length})</div>
          <div style={{maxHeight:340,overflowY:"auto",background:C.bg,borderRadius:12,padding:"10px",border:`1px solid ${C.line}`}}>
            {Object.entries(permGroups).map(([group,perms])=>(
              <div key={group} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,color:C.ink3,textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontFamily:"'Sarabun',sans-serif"}}>{group}</div>
                {perms.map(p=>{const has=(uF.perms||[]).includes(p.id);return <label key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,cursor:"pointer",background:has?C.brandLight:C.white,marginBottom:3,border:`1px solid ${has?C.brandBorder:C.line}`}}>
                  <input type="checkbox" checked={has} onChange={()=>setUF(f=>{const ps=f.perms||[];return{...f,perms:ps.includes(p.id)?ps.filter(x=>x!==p.id):[...ps,p.id]};})} style={{accentColor:C.brand,width:14,height:14}}/>
                  <span style={{fontSize:13,fontFamily:"'Sarabun',sans-serif",fontWeight:has?700:400,color:has?C.brand:C.ink2}}>{p.label}</span>
                </label>;})}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:14,borderTop:`1px solid ${C.line}`,marginTop:8}}>
        <Btn v="ghost" onClick={()=>setShowUser(false)}>ยกเลิก</Btn>
        <Btn onClick={saveUser} icon={I.check} disabled={!uF.username||!uF.password} loading={saving}>{editUID?"บันทึก":"เพิ่มผู้ใช้"}</Btn>
      </div>
    </Modal>}
  </div>;
}

// ══════════════════════════════════════════════════════
// ── MAIN APP ──────────────────────────────────────────
// ══════════════════════════════════════════════════════
export default function App(){
  const[currentUser,setCurrentUser]=useState(null);
  const[currentBranch,setCurrentBranch]=useState(null);
  const[ings,setIngs]=useState([]);const[menus,setMenus]=useState([]);
  const[allCats,setAllCats]=useState([]);const[users,setUsers]=useState([]);
  const[branches,setBranches]=useState([]);const[suppliers,setSuppliers]=useState([]);
  const[costHistory,setCostHistory]=useState([]);const[actionHistory,setActionHistory]=useState([]);
  const[orders,setOrders]=useState([]);const[allOrders,setAllOrders]=useState([]);
  const[loading,setLoading]=useState(false);const[initErr,setInitErr]=useState("");
  const[tab,setTab]=useState("ingredients");

  const ingCats=useMemo(()=>allCats.filter(c=>c.type==="ingredient"),[allCats]);
  const menuCats=useMemo(()=>allCats.filter(c=>c.type==="menu"),[allCats]);

  async function loadAll(){
    if(!currentBranch)return;
    setLoading(true);setInitErr("");
    try{
      const isCentral=currentBranch.type==="central";
      const[i,m,c,u,b,s,ch,ah,o]=await Promise.all([
        api.getIngs(isCentral?null:currentBranch.id),
        api.getMenus(isCentral?null:currentBranch.id),
        api.getCats(),api.getUsers(),api.getBranches(),api.getSuppliers(),
        api.getCostHist(isCentral?null:currentBranch.id),
        api.getActionHist(),
        api.getOrders(isCentral?null:currentBranch.id),
      ]);
      setIngs(i);setMenus(m);setAllCats(c);setUsers(u);setBranches(b);setSuppliers(s);
      setCostHistory(ch);setActionHistory(ah);setOrders(o);
      if(isCentral){const ao=await api.getAllOrders();setAllOrders(ao);}
    }catch(e){setInitErr("เชื่อมต่อ Supabase ไม่ได้: "+e.message);}
    setLoading(false);
  }

  useEffect(()=>{if(currentBranch)loadAll();},[currentBranch]);

  const reload={
    ings:async()=>{const isCentral=currentBranch?.type==="central";const d=await api.getIngs(isCentral?null:currentBranch?.id);setIngs(d);},
    menus:async()=>{const isCentral=currentBranch?.type==="central";const d=await api.getMenus(isCentral?null:currentBranch?.id);setMenus(d);},
    cats:async()=>{const d=await api.getCats();setAllCats(d);},
    users:async()=>{const d=await api.getUsers();setUsers(d);},
    branches:async()=>{const d=await api.getBranches();setBranches(d);},
    suppliers:async()=>{const d=await api.getSuppliers();setSuppliers(d);},
    history:async()=>{const isCentral=currentBranch?.type==="central";const d=await api.getCostHist(isCentral?null:currentBranch?.id);setCostHistory(d);},
    action:async()=>{const d=await api.getActionHist();setActionHistory(d);},
    orders:async()=>{const isCentral=currentBranch?.type==="central";const d=await api.getOrders(isCentral?null:currentBranch?.id);setOrders(d);if(isCentral){const ao=await api.getAllOrders();setAllOrders(ao);}},
  };
  const addH=useCallback(async a=>{try{await api.addActionHist({action:a,time:nowStr()});await reload.action();}catch{}},[currentBranch]);

  const TABS=[
    {id:"ingredients",l:"วัตถุดิบ",icon:I.leaf,perm:"view_ingredients"},
    {id:"menus",l:"เมนู",icon:I.fire,perm:"view_menus"},
    {id:"sop",l:"SOP",icon:I.sop,perm:"view_sop"},
    {id:"summary",l:"สรุปต้นทุน",icon:I.chart,perm:"view_summary"},
    {id:"orders",l:"สั่งวัตถุดิบ",icon:I.truck,perm:"view_orders"},
    {id:"history",l:"ประวัติต้นทุน",icon:I.clock,perm:"view_history"},
    {id:"settings",l:"ตั้งค่า",icon:I.settings,perm:"settings"},
  ];
  const visibleTabs=TABS.filter(t=>currentUser&&hasPerm(currentUser,t.perm));
  const DESC={ingredients:"จัดการวัตถุดิบ ราคา สต็อก และซัพพลาย",menus:"คำนวณต้นทุนและกำไรแต่ละเมนู",sop:"ขั้นตอนมาตรฐานพร้อมรูปภาพ",summary:"สรุปต้นทุนและส่งรายการสั่งวัตถุดิบ",orders:currentBranch?.type==="central"?"รับและจัดการรายการสั่งวัตถุดิบจากทุกสาขา":"รายการสั่งวัตถุดิบที่ส่งไปครัวกลาง",history:"ประวัติต้นทุนและการแก้ไข",settings:"ตั้งค่าระบบ สาขา ซัพพลาย และผู้ใช้"};

  if(!currentUser)return <><style>{globalStyle}</style><LoginPage onLogin={u=>{setCurrentUser(u);}}/></>;
  if(!currentBranch)return <><style>{globalStyle}</style><BranchSelectorWithLoad user={currentUser} onSelect={b=>setCurrentBranch(b)} onLogout={()=>setCurrentUser(null)}/></>;

  const isCentral=currentBranch.type==="central";

  return <>
    <style>{globalStyle}</style>
    <div style={{minHeight:"100vh"}}>
      <nav style={{background:C.white,borderBottom:`1px solid ${C.line}`,padding:"0 20px",display:"flex",alignItems:"center",position:"sticky",top:0,zIndex:100,height:62,boxShadow:"0 1px 16px rgba(15,23,42,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:20,flexShrink:0}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${isCentral?C.teal:C.brand},${isCentral?"#0F766E":C.brandDark})`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={isCentral?I.shop:I.fire} s={17} c={C.white} sw={2}/></div>
          <div>
            <div style={{fontWeight:900,fontSize:12,color:C.ink,lineHeight:1,letterSpacing:-.2}}>NAIWANSOOK FOODCOST</div>
            <div style={{fontSize:9,color:C.ink4,fontWeight:600,letterSpacing:1.2}}>BY BOSSMAX</div>
          </div>
        </div>
        <div style={{display:"flex",flex:1,overflowX:"auto",gap:1}}>
          {visibleTabs.map(t2=>{const active=tab===t2.id;return <button key={t2.id} onClick={()=>setTab(t2.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",height:62,border:"none",background:"none",cursor:"pointer",fontSize:12,fontWeight:active?800:500,color:active?(isCentral?C.teal:C.brand):C.ink3,fontFamily:"'Sarabun',sans-serif",borderBottom:active?`2.5px solid ${isCentral?C.teal:C.brand}`:"2.5px solid transparent",transition:"all .15s",whiteSpace:"nowrap"}}><Ic d={t2.icon} s={13} c={active?(isCentral?C.teal:C.brand):C.ink4}/>{t2.l}</button>;})}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{background:isCentral?C.tealLight:C.brandLight,borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
            <Ic d={isCentral?I.shop:I.branch} s={12} c={isCentral?C.teal:C.brand}/>
            <span style={{fontSize:11,fontWeight:700,color:isCentral?C.teal:C.brand,fontFamily:"'Sarabun',sans-serif"}}>{currentBranch.name}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,background:C.bg,borderRadius:8,padding:"4px 10px",border:`1px solid ${C.line}`}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${C.brand},${C.brandDark})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic d={I.user} s={10} c={C.white}/></div>
            <span style={{fontSize:11,fontWeight:700,color:C.ink,fontFamily:"'Sarabun',sans-serif"}}>{currentUser.name||currentUser.username}</span>
          </div>
          <button onClick={()=>setCurrentBranch(null)} title="เปลี่ยนสาขา" style={{background:C.lineLight,border:`1px solid ${C.line}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,color:C.ink3,fontFamily:"'Sarabun',sans-serif",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><Ic d={I.branch} s={13} c={C.ink3}/>เปลี่ยนสาขา</button>
          <button onClick={()=>{setCurrentUser(null);setCurrentBranch(null);}} title="ออกจากระบบ" style={{background:C.redLight,border:"none",borderRadius:8,padding:"7px",cursor:"pointer",display:"flex"}}><Ic d={I.logout} s={14} c={C.red}/></button>
        </div>
      </nav>
      <div style={{maxWidth:1300,margin:"0 auto",padding:"20px 20px 56px"}}>
        {initErr&&<ErrBox msg={initErr} onRetry={loadAll}/>}
        {loading?<Loading text="กำลังโหลดข้อมูลจาก Cloud..."/>:<>
          <div style={{marginBottom:18}}>
            <h1 style={{fontSize:24,fontWeight:900,color:C.ink,marginBottom:3,letterSpacing:-.3}}>{visibleTabs.find(t2=>t2.id===tab)?.l}</h1>
            <p style={{fontSize:13,color:C.ink3}}>{DESC[tab]}</p>
          </div>
          {tab==="ingredients"&&<IngTab ings={ings} reload={reload.ings} ingCats={ingCats} suppliers={suppliers} currentUser={currentUser} currentBranch={currentBranch} addH={addH}/>}
          {tab==="menus"&&<MenuTab menus={menus} reload={reload.menus} ings={ings} menuCats={menuCats} currentUser={currentUser} currentBranch={currentBranch} addH={addH}/>}
          {tab==="sop"&&<SOPTab menus={menus} reload={reload.menus} ings={ings} currentUser={currentUser}/>}
          {tab==="summary"&&<SumTab menus={menus} ings={ings} currentBranch={currentBranch} reloadHistory={reload.history} reloadOrders={reload.orders} currentUser={currentUser}/>}
          {tab==="orders"&&<OrderTab orders={orders} allOrders={allOrders} reload={reload.orders} ings={ings} suppliers={suppliers} currentBranch={currentBranch} currentUser={currentUser}/>}
          {tab==="history"&&<HisTab costHistory={costHistory} actionHistory={actionHistory} reloadHistory={reload.history} reloadAction={reload.action} ings={ings} currentBranch={currentBranch} reloadOrders={reload.orders} currentUser={currentUser}/>}
          {tab==="settings"&&<SettingsTab ingCats={ingCats} menuCats={menuCats} reloadCats={reload.cats} users={users} reloadUsers={reload.users} branches={branches} reloadBranches={reload.branches} suppliers={suppliers} reloadSuppliers={reload.suppliers} currentUser={currentUser}/>}
        </>}
      </div>
    </div>
  </>;
}

// BranchSelector with auto-load branches
function BranchSelectorWithLoad({user,onSelect,onLogout}){
  const[branches,setBranches]=useState([]);const[loading,setLoading]=useState(true);
  useEffect(()=>{api.getBranches().then(b=>setBranches(b)).finally(()=>setLoading(false));},[]);
  if(loading)return <><style>{globalStyle}</style><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><Loading text="กำลังโหลดรายการสาขา..."/></div></>;
  return <BranchSelector branches={branches} onSelect={onSelect} user={user}/>;
}

const globalStyle=`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800;900&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{background:${C.bg};font-family:'Sarabun',sans-serif}@keyframes mIn{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${C.line};border-radius:999px}input:focus,select:focus,textarea:focus{border-color:${C.brand}!important;box-shadow:0 0 0 3px ${C.brandLight}!important;outline:none}`;
