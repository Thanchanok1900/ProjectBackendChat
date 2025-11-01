const express = require('express');
const router = express.Router();
const friendService = require('./friend.service');
const { authenticateToken } = require('../utils/authMiddleware');

// POST ส่งคำขอเป็นเพื่อน
router.post('/request', authenticateToken, async (req, res) => {
    const senderid = req.user.userid; 
    const { targetid } = req.body; 
    try {
        const newRequest = await friendService.sendFriendRequest(senderid, targetid);
        res.status(201).send({ message: "Friend request sent successfully.", request: newRequest });
    } catch (error) {
        // Return 400 for user errors, 500 for unexpected server errors
        const statusCode = error.message.includes("does not exist") || 
                           error.message.includes("yourself") || 
                           error.message.includes("already sent") ? 400 : 500;
        res.status(statusCode).send({ message: "Error sending friend request.", error: error.message });
    }
});

// GET ดูสถานะเพื่อนของเรา
router.get('/status/me', authenticateToken, async (req, res) => {
     try {
        const userId = req.user.userid;
        const status = await friendService.getFriendshipStatus(userId);
        res.status(200).send(status);
    } catch (error) {
        res.status(500).send({ 
            message: "Error retrieving friendship status.", 
            error: error.message 
        });
    }
});

// PUT ตอบรับ/ปฏิเสธ คำขอ
router.put('/response/:friendshipid', authenticateToken, async (req, res) => {
    const { friendshipid } = req.params;
    const { response } = req.body; 
    const userid = req.user.userid;
    try {
        const result = await friendService.respondToRequest(friendshipid, response, userid);
        if (result && result.message) {
            res.status(200).send(result);
        } else if (result) {
            res.status(200).send({ message: "Friend request accepted.", friendship: result });
        } else {
            res.status(200).send({ message: "Friend request processed successfully." });
        }
    } catch (error) {
        // Return 400 for user errors, 500 for unexpected server errors
        const statusCode = error.message.includes("not found") || 
                           error.message.includes("authorized") || 
                           error.message.includes("Invalid response") ? 400 : 500;
        res.status(statusCode).send({ message: "Error responding to friend request.", error: error.message });
    }
});

// DELETE ลบเพื่อน
router.delete('/response/:friendshipId', authenticateToken, async (req, res) => {
    const { friendshipId } = req.params;
    const userid = req.user.userid;
    try {
        const result = await friendService.unfriend(friendshipId, userid);
        res.status(200).send({ message: "Friendship removed successfully.", result });
    } catch (error) {
        // Return 400 for user errors, 500 for unexpected server errors
        const statusCode = error.message.includes("not found") || 
                           error.message.includes("authorized") ? 400 : 500;
        res.status(statusCode).send({ message: "Error removing friendship.", error: error.message });
    }
});

module.exports = router;