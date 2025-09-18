const ChatRooms = require('./chatRoom.model');
const User = require('../users/users.model');
const { Op } = require('sequelize');

const createRoom = async (targetuserid, loggedInUser) => {
    return await ChatRooms.create({ 
        headuserid: loggedInUser.userid, 
        targetuserid 
    });
};

const getRoomById = async (roomid, userid) => { 
    const room = await ChatRooms.findOne({
        where: { roomid },
        include: [
            { model: User, as: 'HeadUser', attributes: ['userid', 'username', 'originallang'] },
            { model: User, as: 'TargetUser', attributes: ['userid', 'username', 'originallang'] }
        ]
    });

    if (room && (room.headuserid === userid || room.targetuserid === userid)) {
        return room;
    }
    return null;
};

const getAllRooms = async (userid) => { 
    return await ChatRooms.findAll({
        where: {
            [Op.or]: [
                { headuserid: userid },
                { targetuserid: userid }
            ]
        },
        include: [
            { model: User, as: 'HeadUser', attributes: ['userid', 'username', 'originallang'] },
            { model: User, as: 'TargetUser', attributes: ['userid', 'username', 'originallang'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const deleteRoom = async (roomid, userid) => { 
    const room = await ChatRooms.findByPk(roomid);
    if (!room) return null;
    
    // ต้องเป็นผู้สร้างห้อง หรือผู้ร่วมแชท ถึงจะลบไ้ด้
    if (room.headuserid !== userid && room.targetuserid !== userid) {
      throw { statusCode: 403, message: 'Forbidden: you are not authorized to delete this room' };
    }
    
    await room.destroy();
    return room;
};

module.exports = {
    createRoom,
    getRoomById,
    getAllRooms,
    deleteRoom
};