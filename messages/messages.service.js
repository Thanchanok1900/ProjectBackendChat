// messages.service.js
const { Sequelize } = require('sequelize');
const Message = require('./messages.model');
const User = require('../users/users.model');
const ChatRoom = require('../chatRoom/chatRoom.model');
const { translate } = require('../translate/translate.service');

/** จัดรูป response ของ message */
function shapeRow(m) {
  const isHead = m.senderid === m.ChatRoom.headuserid;
  const originallang = isHead ? m.ChatRoom.HeadUser.originallang : m.ChatRoom.TargetUser.originallang;
  const targetuserid = isHead ? m.ChatRoom.targetuserid : m.ChatRoom.headuserid;
  return {
    messageid: m.messageid,
    roomid: m.roomid,
    senderuserid: m.senderid,
    originalmessage: m.originalmessage,
    translatemessage: m.translatemessage,
    created_at: m.created_at,
    originallang,
    targetuserid
  };
}

/** หา “ห้องล่าสุดที่ผู้ใช้ me อยู่” */
async function getMyActiveRoom(me) {
  try {
    const room = await ChatRoom.findOne({
      where: {
        [Sequelize.Op.or]: [{ headuserid: me }, { targetuserid: me }],
      },
      include: [
        { model: User, as: 'HeadUser', attributes: ['userid', 'originallang'] },
        { model: User, as: 'TargetUser', attributes: ['userid', 'originallang'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return room;
  } catch (err) {
    throw { statusCode: 500, message: err.message };
  }
}


/** สร้างข้อความโดยระบุ roomid */
async function createMessage({ me, originalmessage, roomid }) {
  // 1. ตรวจสอบว่าห้องแชทมีอยู่จริง
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

  // 2. ตรวจสอบว่าผู้ใช้เป็นสมาชิกของห้องแชท
  if (room.headuserid !== me && room.targetuserid !== me) {
    throw { statusCode: 403, message: 'Forbidden: You are not a member of this chat room' };
  }

  // 3. แปลข้อความ
  const sourceLang = room.headuserid === me ? room.HeadUser.originallang : room.TargetUser.originallang;
  const targetLang = room.headuserid === me ? room.TargetUser.originallang : room.HeadUser.originallang;

  // *** แก้ไขบรรทัดนี้: ส่งค่า sourceLang และ targetLang เป็นพารามิเตอร์แยกกัน ***
  const translated = await translate(originalmessage, sourceLang, targetLang);

  // 4. บันทึกข้อความลงในฐานข้อมูล
  const msg = await Message.create({
    roomid,
    senderid: me,
    originalmessage,
    translatemessage: translated,
  });

  // 5. ส่งข้อมูลที่สมบูรณ์กลับไป
  return await getMessageById(msg.messageid, me);
}

/** UPDATE: แก้ไขข้อความของฉัน */
async function updateMyMessage(messageid, me, originalmessage) {
  const msg = await Message.findOne({
    where: { messageid },
    include: [
      {
        model: ChatRoom,
        as: 'ChatRoom',
        include: [
          { model: User, as: 'HeadUser', attributes: ['originallang'] },
          { model: User, as: 'TargetUser', attributes: ['originallang'] },
        ],
      },
      { model: User, as: 'Sender', attributes: ['originallang'] },
    ],
  });

  if (!msg) throw { statusCode: 404, message: 'Message not found' };
  if (msg.senderid !== me) throw { statusCode: 403, message: 'Forbidden: not your message' };
  if (![msg.ChatRoom.headuserid, msg.ChatRoom.targetuserid].includes(me))
    throw { statusCode: 403, message: 'Forbidden: not a room member' };

  const targetlang = msg.ChatRoom.headuserid === me ? msg.ChatRoom.TargetUser.originallang : msg.ChatRoom.HeadUser.originallang;
  
  // *** แก้ไขบรรทัดนี้ ***
  const translated = await translate(originalmessage, msg.Sender.originallang, targetlang);

  msg.originalmessage = originalmessage;
  msg.translatemessage = translated;
  await msg.save();

  return shapeRow(await getMessageById(msg.messageid, me));
}

/** DELETE: ลบข้อความของฉัน */
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

/** GET: อ่านข้อความตาม messageid */
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

  return shapeRow(msg);
}

/** GET: ข้อความทั้งหมดในห้องที่ระบุ */
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

/** GET: ข้อความของฉันทั้งหมดในห้องที่ระบุ */
async function listSentWithRoom(me, roomid) {
  const all = await listAllWithRoom(me, roomid);
  return all.filter((m) => m.senderuserid === me);
}

/** GET: ข้อความของอีกฝ่ายในห้องที่ระบุ */
async function listReceivedWithRoom(me, roomid) {
  const all = await listAllWithRoom(me, roomid);
  return all.filter((m) => m.senderuserid !== me);
}

/** GET: ข้อความทั้งหมดในห้องล่าสุดของฉัน */
async function listAllMyActiveRoom(me) {
  const room = await getMyActiveRoom(me);
  if (!room) return [];
  const msgs = await Message.findAll({
    where: { roomid: room.roomid },
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

/** GET: ข้อความของฉันในห้องล่าสุด */
async function listSentMyActiveRoom(me) {
  const all = await listAllMyActiveRoom(me);
  return all.filter((m) => m.senderuserid === me);
}

/** GET: ข้อความของอีกฝ่ายในห้องล่าสุด */
async function listReceivedMyActiveRoom(me) {
  const all = await listAllMyActiveRoom(me);
  return all.filter((m) => m.senderuserid !== me);
}

module.exports = {
  createMessage,
  updateMyMessage,
  deleteMyMessage,
  getMessageById,
  listAllWithRoom,
  listSentWithRoom,
  listReceivedWithRoom,
  listAllMyActiveRoom,
  listSentMyActiveRoom,
  listReceivedMyActiveRoom,
};