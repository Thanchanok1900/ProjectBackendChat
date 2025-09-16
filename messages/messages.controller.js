const express = require('express');
const router = express.Router();
const svc = require('./messages.service');

// health
router.get('/messages/health', (req, res) => res.json({ ok: true }));

// 1) POST: ส่งข้อความ โดยไม่ต้องใส่ roomid/senderid
// body: { originalmessage }
router.post('/messages', async (req, res, next) => {
  try {
    const me = req.user.userid;
    const { originalmessage } = req.body;
    const out = await svc.createMessageAutoRoom({ me, originalmessage });
    res.status(201).json(out);
  } catch (e) { next(e); }
});

// 2) GET: อ่านข้อความในห้องที่ตัวเองอยู่เท่านั้น
// - ถ้าระบุ ?target=<userid> → ใช้ห้อง me ↔ target
// - ไม่ระบุ target → ใช้ห้องล่าสุดของ me
// - filter=all|mine|other (default=all)
router.get('/messages', async (req, res, next) => {
  try {
    const me = req.user.userid;
    const target = req.query.target ? Number(req.query.target) : null;
    const filter = (req.query.filter || 'all').toLowerCase();

    if (target) {
      if (filter === 'mine')  return res.json(await svc.listSentWithTarget(me, target));
      if (filter === 'other') return res.json(await svc.listReceivedWithTarget(me, target));
      return res.json(await svc.listAllWithTarget(me, target));
    } else {
      if (filter === 'mine')  return res.json(await svc.listSentMyActiveRoom(me));
      if (filter === 'other') return res.json(await svc.listReceivedMyActiveRoom(me));
      return res.json(await svc.listAllMyActiveRoom(me));
    }
  } catch (e) { next(e); }
});

// 3) PUT: แก้ไขข้อความของตัวเอง
// body: { originalmessage }
router.put('/messages/:messageid', async (req, res, next) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.messageid);
    const { originalmessage } = req.body;
    const out = await svc.updateMyMessage(messageid, me, originalmessage);
    res.json(out);
  } catch (e) { next(e); }
});

// 4) DELETE: ลบข้อความของตัวเอง
router.delete('/messages/:messageid', async (req, res, next) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.messageid);
    const out = await svc.deleteMyMessage(messageid, me);
    res.json(out);
  } catch (e) { next(e); }
});

module.exports = router;