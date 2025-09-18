
const { Sequelize } = require('sequelize');
const Message = require('./messages.model');
const User = require('../users/users.model');
const ChatRoom = require('../chatRoom/chatRoom.model');
const { translate } = require('../translate/translate.service');

//จัดรูป response ของ messages
function shapeRow(m) {
    if (!m || !m.ChatRoom || !m.ChatRoom.HeadUser || !m.ChatRoom.TargetUser) {
        throw new Error('ChatRoom or User data is missing from the message object.');
    }
    const isHead = m.senderid === m.ChatRoom.headuserid;
    const originallang = isHead ? m.ChatRoom.HeadUser.originallang : m.ChatRoom.TargetUser.originallang;
    const targetuserid = isHead ? m.ChatRoom.targetuserid : m.ChatRoom.headuserid;
    const targetlang = isHead ? m.ChatRoom.TargetUser.originallang : m.ChatRoom.HeadUser.originallang;
    return {
        messageid: m.messageid,
        roomid: m.roomid,
        senderuserid: m.senderid,
        originalmessage: m.originalmessage,
        translatemessage: m.translatemessage,
        created_at: m.created_at,
        originallang,
        targetuserid,
        targetlang
    };
}
//สร้างข้อความโดย roomid 
async function createMessage({ me, originalmessage, roomid }) {
    const room = await ChatRoom.findOne({
        where: { roomid },
        include: [
            { model: User, as: 'HeadUser', attributes: ['userid', 'originallang'] },
            { model: User, as: 'TargetUser', attributes: ['userid', 'originallang'] },
        ],
    });
    if (!room) {
        throw { statusCode: 404, message: 'Chat room not found' };
    }
    if (room.headuserid !== me && room.targetuserid !== me) {
        throw { statusCode: 403, message: 'Forbidden: You are not a member of this chat room' };
    }
    const sourceLang = room.headuserid === me ? room.HeadUser.originallang : room.TargetUser.originallang;
    const targetLang = room.headuserid === me ? room.TargetUser.originallang : room.HeadUser.originallang;
    const translated = await translate(originalmessage, sourceLang, targetLang);
    const msg = await Message.create({
        roomid,
        senderid: me,
        originalmessage,
        translatemessage: translated,
    });


    const fullMsg = await getMessageById(msg.messageid, me);
    return shapeRow(fullMsg);
}

// UPDATE แก้ไขข้อความของฉัน 
async function updateMyMessage(messageid, me, originalmessage) {

    const msg = await Message.findOne({
        where: { messageid },
        include: [
            {
                model: ChatRoom,
                as: 'ChatRoom',
                include: [
                    { model: User, as: 'HeadUser', attributes: ['userid', 'originallang'] },
                    { model: User, as: 'TargetUser', attributes: ['userid', 'originallang'] },
                ],
            },
            { model: User, as: 'Sender', attributes: ['originallang'] },
        ],
    });

    if (!msg) throw { statusCode: 404, message: 'Message not found' };
    if (msg.senderid !== me) throw { statusCode: 403, message: 'Forbidden: not your message' };
    if (![msg.ChatRoom.headuserid, msg.ChatRoom.targetuserid].includes(me))
        throw { statusCode: 403, message: 'Forbidden: not a room member' };

    const senderLang = msg.Sender.originallang;
    const targetLang = msg.ChatRoom.headuserid === me ? msg.ChatRoom.TargetUser.originallang : msg.ChatRoom.HeadUser.originallang;
    const translated = await translate(originalmessage, senderLang, targetLang);

    msg.originalmessage = originalmessage;
    msg.translatemessage = translated;
    await msg.save();

    
    return shapeRow(msg);
}

// DELETE  ลบข้อความของฉัน 
async function deleteMyMessage(messageid, me) {
    const msg = await Message.findOne({
        where: { messageid },
        include: [{ model: ChatRoom, as: 'ChatRoom' }],
    });
    if (!msg) throw { statusCode: 404, message: 'Message not found' };
    if (msg.senderid !== me) throw { statusCode: 403, message: 'Forbidden: not your message' };
    if (![msg.ChatRoom.headuserid, msg.ChatRoom.targetuserid].includes(me))
        throw { statusCode: 403, message: 'Forbidden: not a room member' };
    await msg.destroy();
    return { success: true };
}

// GET ข้อความตาม messageid 
async function getMessageById(messageid, me) {
    const msg = await Message.findOne({
        where: { messageid },
        include: [
            {
                model: ChatRoom,
                as: 'ChatRoom',
                include: [
                    { model: User, as: 'HeadUser', attributes: ['userid', 'originallang'] },
                    { model: User, as: 'TargetUser', attributes: ['userid', 'originallang'] },
                ],
            },
            { model: User, as: 'Sender', attributes: ['originallang'] },
        ],
    });
    if (!msg) throw { statusCode: 404, message: 'Message not found' };
    if (![msg.ChatRoom.headuserid, msg.ChatRoom.targetuserid].includes(me))
        throw { statusCode: 403, message: 'Forbidden: not a room member' };
    return msg;
}

// GET: ข้อความทั้งหมดในห้องที่ระบุ 
async function listAllWithRoom(me, roomid) {
    const room = await ChatRoom.findOne({
        where: { roomid },
    });
    if (!room || (room.headuserid !== me && room.targetuserid !== me)) {
        throw { statusCode: 403, message: 'Forbidden: You are not a member of this chat room' };
    }
    const msgs = await Message.findAll({
        where: { roomid: roomid },
        order: [['created_at', 'ASC']],
        include: [
            {
                model: ChatRoom,
                as: 'ChatRoom',
                include: [
                    { model: User, as: 'HeadUser', attributes: ['userid', 'originallang'] },
                    { model: User, as: 'TargetUser', attributes: ['userid', 'originallang'] },
                ],
            },
        ],
    });
    return msgs.map((m) => shapeRow(m));
}

// GET ข้อความของฉันทั้งหมดในห้องที่ระบุ 
async function listSentWithRoom(me, roomid) {
    const all = await listAllWithRoom(me, roomid);
    return all.filter((m) => m.senderuserid === me);
}

// GET: ข้อความของอีกฝ่ายในห้องที่ระบุ 
async function listReceivedWithRoom(me, roomid) {
    const all = await listAllWithRoom(me, roomid);
    return all.filter((m) => m.senderuserid !== me);
}

module.exports = {
    createMessage,
    updateMyMessage,
    deleteMyMessage,
    listAllWithRoom,
    listSentWithRoom,
    listReceivedWithRoom,
    getMessageById
};