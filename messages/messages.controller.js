// messages.controller.js
const express = require('express');
const router = express.Router();
const svc = require('./messages.service');
const { authenticateToken } = require('../utils/authMiddleware');

// POST: สร้างข้อความใหม่
router.post('/', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const { originalmessage, roomid } = req.body;
    if (!roomid) {
      return res.status(400).json({ error: 'roomid is required' });
    }
    const out = await svc.createMessage({ me, originalmessage, roomid });
    res.status(201).json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// GET: ดูข้อความทั้งหมดในห้องที่เลือกพร้อม filter
router.get('/chatrooms/:id', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const roomid = Number(req.params.id);
    const filter = (req.query.filter || 'all').toLowerCase();
    if (isNaN(roomid)) {
      return res.status(400).json({ error: 'Invalid roomid' });
    }
    let out;
    if (filter === 'sent') {
      out = await svc.listSentWithRoom(me, roomid);
    } else if (filter === 'received') {
      out = await svc.listReceivedWithRoom(me, roomid);
    } else {
      out = await svc.listAllWithRoom(me, roomid);
    }
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ✅ เพิ่มเส้นทางนี้สำหรับ GET: อ่านข้อความตามไอดี
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.id);
    if (isNaN(messageid)) {
      return res.status(400).json({ error: 'Invalid messageid' });
    }
    // `getMessageById` จะตรวจสอบว่าผู้ใช้เป็นสมาชิกในห้องหรือไม่
    const out = await svc.getMessageById(messageid, me);
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});


// PUT: แก้ไขข้อความตามไอดี
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.id);
    const { originalmessage } = req.body;
    if (isNaN(messageid)) {
      return res.status(400).json({ error: 'Invalid messageid' });
    }
    const out = await svc.updateMyMessage(messageid, me, originalmessage);
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// DELETE: ลบข้อความตามไอดี
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.id);
    if (isNaN(messageid)) {
      return res.status(400).json({ error: 'Invalid messageid' });
    }
    const out = await svc.deleteMyMessage(messageid, me);
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = router;