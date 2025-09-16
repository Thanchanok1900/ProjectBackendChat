const ChatRoom = require('./chatRoom.model');
const User = require('../users/users.model');

const createRoom = async (headuserid, targetuserid) => {
    return await ChatRoom.create({ headuserid, targetuserid });
};

const getRoomById = async (roomid) => {
    return await ChatRoom.findOne({
        where: { roomid },
        include: [
            { model: User, as: 'HeadUser', attributes: ['userid', 'username', 'originallang'] },
            { model: User, as: 'TargetUser', attributes: ['userid', 'username', 'originallang'] }
        ]
    });
};

const getAllRooms = async () => {
    return await ChatRoom.findAll({
        include: [
            { model: User, as: 'HeadUser', attributes: ['userid', 'username', 'originallang'] },
            { model: User, as: 'TargetUser', attributes: ['userid', 'username', 'originallang'] }
        ],
        order: [['created_at', 'DESC']]
    });
};


const deleteRoom = async (roomid) => {
    const room = await ChatRoom.findByPk(roomid);
    if (!room) return null;
    await room.destroy();
    return room;
};

module.exports = {
    createRoom,
    getRoomById,
    getAllRooms,
    deleteRoom
};
