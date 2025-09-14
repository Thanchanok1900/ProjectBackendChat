// friend.service.js
const { Op, Friendship, User } = require('./friend.model');

// ส่งคำขอเป็นเพื่อน
exports.sendFriendRequest = async (senderId, receiverId) => {
    // ตรวจสอบว่าส่งหาตัวเอง
    if (senderId === receiverId) {
        throw new Error("Cannot send friend request to yourself.");
    }
    // ตรวจสอบว่ามีคำขอที่ค้างอยู่ หรือเป็นเพื่อนกันแล้วหรือไม่
    const existingFriendship = await Friendship.findOne({
        where: {
            [Op.or]: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }
    });

    if (existingFriendship) {
        throw new Error("Friend request already sent or you are already friends.");
    }
    // สร้างคำขอใหม่
    return await Friendship.create({ senderId, receiverId, status: 'pending' });
};

// ดูสถานะเพื่อนทั้งหมด
exports.getFriendshipStatus = async (userId) => {
    const friendships = await Friendship.findAll({
        where: {
            [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: [
            { model: User, as: 'sender', attributes: ['id', 'username'] },
            { model: User, as: 'receiver', attributes: ['id', 'username'] }
        ]
    });
    
    const response = {
        friends: friendships.filter(f => f.status === 'accepted'),
        pendingSent: friendships.filter(f => f.status === 'pending' && f.senderId == userId),
        pendingReceived: friendships.filter(f => f.status === 'pending' && f.receiverId == userId),
    };

    return response;
};

// ตอบรับ/ปฏิเสธคำขอ
exports.respondToRequest = async (friendshipId, response, userId) => {
    const request = await Friendship.findByPk(friendshipId);

    if (!request) {
        throw new Error("Friend request not found.");
    }
    
    if (request.receiverId !== userId){
        throw new Error("You are not authorized to respond to this request.");
    }

    if (response === 'accept') {
        request.status = 'accepted';
        return await request.save();
    } else if (response === 'decline') {
        await request.destroy();
        return { message: "Friend request declined and removed." };
    } else {
        throw new Error("Invalid response. Please use 'accept' or 'decline'.");
    }
};

// ลบเพื่อน
exports.unfriend = async (friendshipId) => {
    const friendship = await Friendship.findByPk(friendshipId);

    if (!friendship) {
        throw new Error("Friendship not found.");
    }
    
    await friendship.destroy();
    return { message: "Friend removed successfully." };
};