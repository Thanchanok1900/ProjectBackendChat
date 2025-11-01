const { Op, Friendship, User } = require('./friend.model');
const { createRoom } = require('../chatRoom/chatRoom.service');
const ChatRoom = require('../chatRoom/chatRoom.model');

// Check if a chat room already exists between two users
const chatRoomExists = async (userid1, userid2) => {
    const room = await ChatRoom.findOne({
        where: {
            [Op.or]: [
                { headuserid: userid1, targetuserid: userid2 },
                { headuserid: userid2, targetuserid: userid1 }
            ]
        }
    });
    return room !== null;
};

// Send friend request
const sendFriendRequest = async (senderid, targetid) => {
    if (senderid === targetid) {
        throw new Error("Cannot send friend request to yourself.");
    }

    // Check if target user exists
    const targetUser = await User.findByPk(targetid);
    if (!targetUser) {
        throw new Error("Target user does not exist.");
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

// Get all friendship statuses
const getFriendshipStatus = async (userid) => {
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

// Accept/decline friend request
const respondToRequest = async (friendshipid, response, userid) => {
    const request = await Friendship.findByPk(friendshipid);

    if (!request) {
        throw new Error("Friend request not found.");
    }
    
    if (request.targetid !== userid){ 
        throw new Error("You are not authorized to respond to this request.");
    }

    if (response === 'accept') {
        request.status = 'accepted';
        const updatedRequest = await request.save();
        
        // Auto-create a chat room between the two users when the request is accepted
        // Only create if a room doesn't already exist between these users
        const senderId = request.senderid;
        
        const roomExists = await chatRoomExists(userid, senderId);
        if (!roomExists) {
            // Create a chat room where the user accepting the request (userid) is the head user
            // and the sender of the request is the target user of the chat room
            await createRoom(senderId, { userid: userid });
        }
        
        return updatedRequest;
    } else if (response === 'decline') {
        await request.destroy();
        return { message: "Friend request declined and removed." };
    } else {
        throw new Error("Invalid response. Please use 'accept' or 'decline'.");
    }
};

// Unfriend
const unfriend = async (friendshipid, userid) => {
    const friendship = await Friendship.findByPk(friendshipid);

    if (!friendship) {
        throw new Error("Friendship not found.");
    }

    // Must be one of the friend pair to be able to remove
    if (friendship.senderid !== userid && friendship.targetid !== userid) {
        throw new Error("You are not authorized to remove this friendship.");
    }
    
    await friendship.destroy();
    return { message: "Friend removed successfully." };
};

// Create chat rooms for all existing accepted friendships
const createChatRoomsForExistingFriends = async () => {
    // Find all accepted friendships
    const acceptedFriendships = await Friendship.findAll({
        where: { status: 'accepted' }
    });

    // For each accepted friendship, ensure a chat room exists
    for (const friendship of acceptedFriendships) {
        const { senderid, targetid } = friendship;
        
        // Check if a chat room already exists between these users
        const roomExists = await chatRoomExists(senderid, targetid);
        if (!roomExists) {
            // Create a chat room where sender is the head user and target is the target user
            await createRoom(targetid, { userid: senderid });
        }
    }
    
    return `Processed ${acceptedFriendships.length} existing friendships`;
};

module.exports = {
    sendFriendRequest,
    getFriendshipStatus,
    respondToRequest,
    unfriend,
    createChatRoomsForExistingFriends
};
