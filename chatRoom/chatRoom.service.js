// chatRoom.service.js
const ChatRoom = require('./chatRoom.model');
const User = require('../users/users.model');
const { Op } = require('sequelize');

const createRoom = async (targetuserid, loggedInUser) => {
    return await ChatRoom.create({ 
        headuserid: loggedInUser.userid, 
        targetuserid 
    });
};

const getRoomById = async (roomid, userid) => { // รับ userid เข้ามา
    const room = await ChatRoom.findOne({
        where: { roomid },
        include: [
            { model: User, as: 'HeadUser', attributes: ['userid', 'username', 'originallang'] },
            { model: User, as: 'TargetUser', attributes: ['userid', 'username', 'originallang'] }
        ]
    });

    // ตรวจสอบว่าผู้ใช้ที่ล็อกอินเป็นสมาชิกของห้องแชทนั้นหรือไม่
    if (room && (room.headuserid === userid || room.targetuserid === userid)) {
        return room;
    }
    
    // ถ้าไม่ใช่สมาชิก ให้ return null หรือ throw error
    return null;
};

const getAllRooms = async (userid) => { // รับ userid เข้ามา
    return await ChatRoom.findAll({
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

const deleteRoom = async (roomid, userid) => { // รับ userid เข้ามา
    const room = await ChatRoom.findByPk(roomid);
    if (!room) return null;
    
    // ตรวจสอบสิทธิ์ก่อนลบ: ต้องเป็นผู้สร้างห้อง (headuserid) หรือผู้ร่วมแชท (targetuserid)
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