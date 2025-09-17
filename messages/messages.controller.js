const express = require('express');
const router = express.Router();
const svc = require('./messages.service');
const { authenticateToken } = require('../utils/authMiddleware');

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

// GET: อ่านข้อความทั้งหมดในห้องตาม roomid
router.get('/chatrooms/:roomid', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const roomid = Number(req.params.roomid);
    const filter = (req.query.filter || 'all').toLowerCase();

    let out;
    if (roomid) {
      if (filter === 'sent') out = await svc.listSentWithRoom(me, roomid);
      else if (filter === 'received') out = await svc.listReceivedWithRoom(me, roomid);
      else out = await svc.listAllWithRoom(me, roomid);
    } else {
      if (filter === 'sent') out = await svc.listSentMyActiveRoom(me);
      else if (filter === 'received') out = await svc.listReceivedMyActiveRoom(me);
      else out = await svc.listAllMyActiveRoom(me);
    }

    if (isNaN(roomid)) return res.status(400).json({ error: 'Invalid roomid' });

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

// GET: อ่านข้อความตาม messageid
router.get('/:messageid', authenticateToken, async (req, res) => {
  try {
    const me = req.user.userid;
    const messageid = Number(req.params.messageid);

    if (isNaN(messageid)) return res.status(400).json({ error: 'Invalid messageid' });

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