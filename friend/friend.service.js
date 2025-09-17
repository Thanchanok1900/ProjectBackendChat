const { Op, Friendship, User } = require('./friend.model');

// ส่งคำขอเป็นเพื่อน
exports.sendFriendRequest = async (senderid, targetid) => {
    if (senderid === targetid) {
        throw new Error("Cannot send friend request to yourself.");
    }
    const existingFriendship = await Friendship.findOne({
        where: {
            [Op.or]: [
                { senderid: senderid, targetid: targetid },
                { senderid: targetid, targetid: senderid }
            ]
        }
    });

    if (existingFriendship) {
        throw new Error("Friend request already sent or you are already friends.");
    }
    return await Friendship.create({ senderid, targetid, status: 'pending' });
};

// ดูสถานะเพื่อนทั้งหมด
exports.getFriendshipStatus = async (userid) => {
    const friendships = await Friendship.findAll({
        where: {
            [Op.or]: [
                { senderid: userid },
                { targetid: userid }
            ]
        },
        include: [
            { model: User, as: 'sender', attributes: ['userid', 'username'] },
            { model: User, as: 'receiver', attributes: ['userid', 'username'] }
        ]
    });
    
    const response = {
        friends: friendships.filter(f => f.status === 'accepted'),
        pendingSent: friendships.filter(f => f.status === 'pending' && f.senderid == userid),
        pendingReceived: friendships.filter(f => f.status === 'pending' && f.targetid == userid),
    };

    return response;
};

// ตอบรับ/ปฏิเสธคำขอ
exports.respondToRequest = async (friendshipid, response, userid) => {
    const request = await Friendship.findByPk(friendshipid);

    if (!request) {
        throw new Error("Friend request not found.");
    }
    
    // บรรทัดนี้ที่ต้องแก้ไขให้ถูกต้อง
    if (request.targetid !== userid){ 
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
exports.unfriend = async (friendshipid, userid) => {
    const friendship = await Friendship.findByPk(friendshipid);

    if (!friendship) {
        throw new Error("Friendship not found.");
    }

    // เพิ่มการตรวจสอบสิทธิ์: ต้องเป็นหนึ่งในคู่เพื่อนเท่านั้นถึงจะลบได้
    if (friendship.senderid !== userid && friendship.targetid !== userid) {
        throw new Error("You are not authorized to remove this friendship.");
    }
    
    await friendship.destroy();
    return { message: "Friend removed successfully." };
};