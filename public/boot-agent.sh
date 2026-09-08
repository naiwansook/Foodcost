#!/data/data/com.termux/files/usr/bin/sh
# ════════════════════════════════════════════════════════════════════════
#  FOODCOST — สคริปต์เปิดตัวพิมพ์อัตโนมัติตอนมือถือบูต (Termux:Boot)
#  วางไว้ที่ ~/.termux/boot/  → ทุกครั้งที่มือถือเปิด ตัวพิมพ์จะรันเองทันที
# ════════════════════════════════════════════════════════════════════════
termux-wake-lock 2>/dev/null
cd "$HOME" || exit 1
# โหลดตัวเรียกใช้งานล่าสุด (เผื่อยังไม่มี/มีอัปเดต) แล้วรัน — agent-run.sh จะวนโหลด print-agent.js ล่าสุดให้เอง
curl -fsS -o agent-run.sh "https://foodcost-eta.vercel.app/agent-run.sh" 2>/dev/null
# เลขสาขาอ่านจากไฟล์ ~/.foodcost-branch — ตั้งครั้งเดียวตอนติดตั้ง:
#     echo 8 > $HOME/.foodcost-branch
# ⚠️ อย่าใส่เลขตายตัวในไฟล์นี้ เพราะเครื่องนี้มักถูกก๊อปไปใช้ที่สาขาอื่น
# แล้วลืมแก้ ผลคือตัวพิมพ์ไปดึงบิลของสาขาเดิมมาพิมพ์ที่ร้านใหม่
BR="$(cat "$HOME/.foodcost-branch" 2>/dev/null | tr -dc '0-9')"
if [ -z "$BR" ]; then
  echo "❌ ยังไม่ได้ตั้งเลขสาขา — สั่ง:  echo <เลขสาขา> > \$HOME/.foodcost-branch"
  exit 2
fi
sh agent-run.sh "$BR"
