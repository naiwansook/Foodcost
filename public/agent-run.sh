#!/data/data/com.termux/files/usr/bin/sh
# ════════════════════════════════════════════════════════════════════════
#  FOODCOST — ตัวเรียกใช้งานตัวพิมพ์ผ่านคลาวด์ (Bootstrap Launcher)
#
#  ติดตั้งครั้งเดียว — แล้วไม่ต้องแตะ Termux อีกเลยตลอดไป
#  ทุกครั้งที่มีอัปเดตระบบ ตัว agent จะดาวน์โหลดเวอร์ชันใหม่ + รันใหม่เอง
#
#  วิธีใช้:   sh agent-run.sh <branchId>
#  ตัวอย่าง:  sh agent-run.sh 6
# ════════════════════════════════════════════════════════════════════════
termux-wake-lock 2>/dev/null
# เลขสาขา: จากอาร์กิวเมนต์ ถ้าไม่ใส่ก็อ่านจากไฟล์ ~/.foodcost-branch
# ไม่มีค่าเริ่มต้น — ลืมใส่แล้วแอบรันเป็นสาขาอื่นคือพิมพ์ใบผิดร้าน
BR="${1:-$(cat "$HOME/.foodcost-branch" 2>/dev/null | tr -dc '0-9')}"
if [ -z "$BR" ]; then
  echo "❌ ไม่รู้ว่าเป็นสาขาไหน"
  echo "   ใส่เลขสาขาตอนรัน:   sh agent-run.sh 8"
  echo "   หรือตั้งค่าไว้ครั้งเดียว:   echo 8 > \$HOME/.foodcost-branch"
  exit 2
fi
URL="https://foodcost-eta.vercel.app/print-agent.js"
cd "$HOME" || exit 1

echo "════════════════════════════════════════"
echo " FOODCOST — ตัวเรียกใช้งานตัวพิมพ์ (อัปเดตเอง)"
echo " สาขา (branch): $BR"
echo " หยุดถาวร: กด Ctrl+C สองครั้งเร็วๆ"
echo "════════════════════════════════════════"

while true; do
  # ดาวน์โหลดเวอร์ชันล่าสุดเสมอก่อนรัน (กันโหลดพลาดด้วยไฟล์เก่า)
  if curl -fsS -o print-agent.new.js "$URL" 2>/dev/null && [ -s print-agent.new.js ]; then
    mv -f print-agent.new.js print-agent.js
    echo "✅ โหลดเวอร์ชันล่าสุดแล้ว"
  else
    echo "⚠️  โหลดไม่ได้ (เช็คเน็ต) — ใช้ไฟล์เดิมที่มีอยู่"
    rm -f print-agent.new.js 2>/dev/null
  fi

  if [ -f print-agent.js ]; then
    node print-agent.js "$BR"; RC=$?
  else
    echo "❌ ยังไม่มีไฟล์ print-agent.js และโหลดไม่ได้ — รอเน็ต..."; RC=0
  fi

  # exit code 3 = มี agent อื่นทำงานอยู่แล้ว (ตัวซ้ำ) → หยุด loop นี้ ไม่ต้องรันวนซ้ำ (กันสแปม)
  if [ "$RC" = "3" ]; then
    echo "⛔ มี Print Agent อื่นทำงานอยู่แล้ว — ปิด session ซ้ำนี้ (ไม่รันซ้ำ)"
    break
  fi

  echo ""
  echo "↻ agent หยุด/อัปเดต — กำลังเริ่มใหม่ใน 5 วินาที (กด Ctrl+C ค้างเพื่อหยุดถาวร)"
  sleep 5
done
