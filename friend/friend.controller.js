// friend.controller.js
const express = require('express');
const router = express.Router();
const friendService = require('./friend.service');
const { authenticateToken } = require('../utils/authMiddleware'); // เพิ่มบรรทัดนี้

// 16. POST /api/friends/request -> ส่งคำขอเป็นเพื่อน
router.post('/request', authenticateToken, async (req, res) => { // เพิ่ม authenticateToken
    // ดึง userid จาก req.user ที่ได้จาก middleware
    const senderid = req.user.userid; 
    const { targetid } = req.body; 
    try {
        const newRequest = await friendService.sendFriendRequest(senderid, targetid);
        res.status(201).send({ message: "Friend request sent successfully.", request: newRequest });
    } catch (error) {
        res.status(500).send({ message: "Error sending friend request.", error: error.message });
    }
});

// 17. GET /api/friends/status/:userId -> ดูสถานะเพื่อนทั้งหมดของเรา
router.get('/status/me', authenticateToken, async (req, res) => { // เพิ่ม authenticateToken
     try {
        const userId = req.user.userid; // ดึงจาก token เลย ไม่ต้องมาจาก params

        const status = await friendService.getFriendshipStatus(userId);
        res.status(200).send(status);
    } catch (error) {
        res.status(500).send({ 
            message: "Error retrieving friendship status.", 
            error: error.message 
        });
    }
});

// 18. PUT /api/friends/respond/:friendshipId -> ตอบรับ/ปฏิเสธ คำขอ
router.put('/respond/:friendshipid', authenticateToken, async (req, res) => { // เพิ่ม authenticateToken
    const { friendshipid } = req.params;
    const { response } = req.body; 
    // ดึง userid จาก req.user
    const userid = req.user.userid;
    try {
        const result = await friendService.respondToRequest(friendshipid, response, userid);
        if (result.message) {
            res.status(200).send(result);
        } else {
            res.status(200).send({ message: "Friend request accepted.", friendship: result });
        }
    } catch (error) {
        res.status(500).send({ message: "Error responding to friend request.", error: error.message });
    }
});

// 19. DELETE /api/friends/:friendshipId -> ลบเพื่อน
router.delete('/:friendshipId', authenticateToken, async (req, res) => { // เพิ่ม authenticateToken
    const { friendshipId } = req.params;
    const userid = req.user.userid;
    try {
        const result = await friendService.unfriend(friendshipId, userid);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ message: "Error removing friend.", error: error.message });
    }
});

module.exports = router;