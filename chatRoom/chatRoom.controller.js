const express = require('express');
const router = express.Router();
const chatRoomService = require('./chatRoom.service');

// Create room
router.post('/', async (req, res) => {
    try {
        const { headuserid, targetuserid } = req.body;
        if (!headuserid || !targetuserid) {
            return res.status(400).json({ message: 'Missing headuserid or targetuserid' });
        }
        const room = await chatRoomService.createRoom(headuserid, targetuserid);
        res.status(201).json(room);
    } catch (err) {
        console.error('POST error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get room by ID
router.get('/:roomid', async (req, res) => {
    try {
        const room = await chatRoomService.getRoomById(req.params.roomid);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    } catch (err) {
        console.error('GET/:roomid error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all rooms
router.get('/', async (req, res) => {
    try {
        const rooms = await chatRoomService.getAllRooms();
        res.json(rooms);
    } catch (err) {
        console.error('GET error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete room
router.delete('/:roomid', async (req, res) => {
    try {
        const room = await chatRoomService.deleteRoom(req.params.roomid);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json({ message: 'Room deleted successfully' });
    } catch (err) {
        console.error('DELETE error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
