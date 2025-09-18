# ProjectBackendChat

โปรเจกต์นี้คือระบบ Translate Chat ที่ช่วยให้ผู้ใช้งานสามารถสื่อสารกับเพื่อนต่างภาษาได้ง่าย ไม่ต้องคอยแปลเองทีละประโยค เพราะข้อความที่พิมพ์จะถูกระบบแปลไปยังภาษาของผู้รับให้อัตโนมัติ ข้อความที่ส่งจะถูกเก็บไว้ในฐานข้อมูลก่อน จากนั้นผู้รับต้องดึงข้อมูล (GET) ด้วยตนเองเพื่อดูข้อความ

Features
-ลงทะเบียนและล็อกอินด้วย Token Authentication
-จัดการข้อมูลผู้ใช้งาน (Users)
-สร้าง/ลบห้องสนทนา (Chatrooms)
-ส่งและดึงข้อความพร้อมข้อความแปลอัตโนมัติ (Messages)
-ระบบเพื่อน (Friends) เพื่อส่งคำขอ ตอบรับ หรือยกเลิกได้


API Endpoints

🔹 Authentication

POST /v1/auth/signup → สมัครสมาชิกใหม่
POST /v1/auth/login → ล็อกอิน (รับ Token)
POST /v1/auth/logout → ล็อกเอาท์


🔹 Users

GET /v1/users → ดูผู้ใช้ทั้งหมด
GET /v1/users/me → ดูข้อมูลผู้ใช้ของตัวเอง
GET /v1/users/:id → ดูข้อมูลผู้ใช้ตาม id
PUT /v1/users/:id → อัปเดตข้อมูล (username, originallang)
DELETE /v1/users/:id → ลบผู้ใช้


🔹 Chatrooms

POST /v1/chatrooms → สร้างห้อง (targeruserid)
GET /v1/chatrooms → ดูห้องทั้งหมด
GET /v1/chatrooms/:id → ดูข้อมูลห้อง
DELETE /v1/chatrooms/:id → ลบห้อง


🔹 Messages

POST /v1/messages → ส่งข้อความ (originalmessages, roomid)
GET /v1/messages/chatrooms/:id → ดูข้อความทั้งหมดในห้องที่เลือก
GET /v1/messages/chatrooms/:id?filter=sent → ดูข้อความที่เราส่งในห้องที่เลือก
GET /v1/messages/chatrooms/:id?filter=received →  ดูข้อความที่เราได้รับในห้องที่เลือก
PUT /v1/messages/:id → แก้ไขข้อความตามไอดี
DELETE /v1/messages/:id → ลบข้อความตามไอดี


🔹 Friends

POST /v1/friend/request → ส่งคำขอเป็นเพื่อน (targetid)
GET /v1/friend/status/me → ดูสถานะเพื่อนของเรา
PUT /v1/friend/response/:friendshipid → ตอบรับ/ปฏิเสธคำขอ (accept / decline)
DELETE /v1/friend/response/:friendshipid → ลบเพื่อน



Workflow
1. สมัครสมาชิกและเข้าสู่ระบบ:

ผู้ใช้คนที่ 1 (User A) ต้องทำการสมัครสมาชิกด้วย POST /v1/auth/signup แล้วเข้าสู่ระบบด้วย POST /v1/auth/login เพื่อรับ token
ผู้ใช้คนที่ 2 (User B) ก็ต้องทำตามขั้นตอนเดียวกันเพื่อรับ token ของตนเอง

token ที่ได้จากการ Login จะต้องถูกนำไปใส่ใน Header ของทุก API ที่มีการยืนยันตัวตน (Authentication) เพื่อให้ระบบรู้ว่าใครคือผู้ใช้งานที่ส่งคำขอเข้ามา

User สามารถใช้ GET /v1/users เพื่อดูรายชื่อผู้ใช้งานทั้งหมด แล้วหา targetuserid ของ User ที่ต้องการคุยด้วย

2. สร้างห้องแชท:
User A สร้างห้องแชทกับ User B โดยใช้ POST /v1/chatrooms และระบุ targetuserid ของ User B 
User A จะได้รับ roomid ของห้องแชทใหม่ที่ถูกสร้างขึ้น

3. ส่งข้อความ:
User A ใช้ POST /v1/messages เพื่อส่งข้อความ โดยต้องระบุ originalmessage และ roomid ที่ได้รับจากขั้นตอนก่อนหน้า
ข้อความจะถูกแปลเป็นภาษาที่ตั้งค่าไว้ของ User B โดยอัตโนมัติ

ดูข้อความ:
User B ต้องใช้ GET /v1/messages/chatrooms/:id?filter=received เพื่อดึงข้อความที่ถูกส่งมาในห้องแชทนั้น ๆ

ตอบกลับ:
User B สามารถตอบกลับ User A ได้โดยใช้ POST /v1/messages และระบุ roomid เดียวกัน

4. จัดการเพื่อน (Friends) → ขอเป็นเพื่อน / ตอบรับ / ยกเลิก /ดูสถานะเพื่อน



