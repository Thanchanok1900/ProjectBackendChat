const express = require('express');
const router = express.Router();
const chatRoomService = require('./chatRoom.service');
const { authenticateToken } = require('../utils/authMiddleware');

// Create room
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { targetuserid } = req.body;

    if (!targetuserid) {
      return res.status(400).json({ message: "Missing targetuserid" });
    }

    const room = await chatRoomService.createRoom(targetuserid, req.user);

    return res.status(201).json(room);
  } catch (err) {
    console.error("POST /v1/chatrooms error:", err);        
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room by ID
router.get('/:roomid', authenticateToken, async (req, res) => {
    try {
        const room = await chatRoomService.getRoomById(req.params.roomid, req.user.userid);
        if (!room) return res.status(404).json({ message: 'Room not found or you are not a member' });
        res.json(room);
    } catch (err) {
        console.error('GET/:roomid error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
    try {
        const rooms = await chatRoomService.getAllRooms(req.user.userid);
        res.json(rooms);
    } catch (err) {
        console.error('GET error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete room
router.delete('/:roomid', authenticateToken, async (req, res, next) => {
    try {
        const room = await chatRoomService.deleteRoom(req.params.roomid, req.user.userid);
        if (!room) return res.status(404).json({ message: 'Room not found or you are not authorized to delete it' });
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        console.error('DELETE error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;