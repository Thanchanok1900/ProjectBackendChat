// messages.controller.js
const express = require('express');
const router = express.Router();
const svc = require('./messages.service');
const { authenticateToken } = require('../utils/authMiddleware');

// health
router.get('/health', async (req, res) => {
  try {
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: ส่งข้อความ
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

// GET: ข้อความทั้งหมด
router.get('/', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const roomid = req.query.roomid ? Number(req.query.roomid) : null;
    const filter = (req.query.filter || 'all').toLowerCase();

    let out;
    if (roomid) {
      if (filter === 'mine') out = await svc.listSentWithRoom(me, roomid);
      else if (filter === 'other') out = await svc.listReceivedWithRoom(me, roomid);
      else out = await svc.listAllWithRoom(me, roomid);
    } else {
      if (filter === 'mine') out = await svc.listSentMyActiveRoom(me);
      else if (filter === 'other') out = await svc.listReceivedMyActiveRoom(me);
      else out = await svc.listAllMyActiveRoom(me);
    }

    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// GET: อ่านข้อความตาม messageid
router.get('/:messageid', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.messageid);
    const out = await svc.getMessageById(messageid, me);
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// PUT: แก้ไขข้อความ
router.put('/:messageid', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.messageid);
    const { originalmessage } = req.body;
    const out = await svc.updateMyMessage(messageid, me, originalmessage);
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// DELETE: ลบข้อความ
router.delete('/:messageid', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.messageid);
    const out = await svc.deleteMyMessage(messageid, me);
    res.json(out);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

module.exports = router;