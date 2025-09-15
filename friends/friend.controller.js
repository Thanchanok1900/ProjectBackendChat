// friend.controller.js
const express = require('express');
const router = express.Router();
const friendService = require('./friend.service');

// 16. POST /api/friends/request -> ส่งคำขอเป็นเพื่อน
router.post('/request', async (req, res) => {
    const { senderId, receiverId } = req.body;
    try {
        const newRequest = await friendService.sendFriendRequest(senderId, receiverId);
        res.status(201).send({ message: "Friend request sent successfully.", request: newRequest });
    } catch (error) {
        res.status(500).send({ message: "Error sending friend request.", error: error.message });
    }
});

// 17. GET /api/friends/status/:userId -> ดูสถานะเพื่อนทั้งหมดของเรา
router.get('/status/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const status = await friendService.getFriendshipStatus(userId);
        res.status(200).send(status);
    } catch (error) {
        res.status(500).send({ message: "Error retrieving friendship status.", error: error.message });
    }
});

// 18. PUT /api/friends/respond/:friendshipId -> ตอบรับ/ปฏิเสธ คำขอ
router.put('/respond/:friendshipid', async (req, res) => {
    const { friendshipid } = req.params;
    const { response, userid } = req.body; // แก้ไขจาก userId เป็น userid
    try {
        const result = await friendService.respondToRequest(friendshipid, response, userid); // ส่งค่า userid ที่ถูกต้อง
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
router.delete('/:friendshipId', async (req, res) => {
    const { friendshipId } = req.params;
    try {
        const result = await friendService.unfriend(friendshipId);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({ message: "Error removing friend.", error: error.message });
    }
});

module.exports = router;