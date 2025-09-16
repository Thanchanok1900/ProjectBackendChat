const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const Message = require('./messages.model');
const { translate } = require('../translate/translate.service');

/** หา “ห้องล่าสุดที่ผู้ใช้ me อยู่” */
async function getMyActiveRoom(me) {
  const rows = await sequelize.query(`
    SELECT cr.roomid, cr.headuserid, cr.targetuserid, cr.created_at,
           u1.userid AS head_id,   u1.originallang AS head_lang,
           u2.userid AS target_id, u2.originallang AS target_lang
    FROM chat_rooms cr
    JOIN users u1 ON u1.userid = cr.headuserid
    JOIN users u2 ON u2.userid = cr.targetuserid
    WHERE cr.headuserid = :me OR cr.targetuserid = :me
    ORDER BY cr.created_at DESC, cr.roomid DESC
    LIMIT 1
  `, { type: QueryTypes.SELECT, replacements: { me } });
  return rows[0] || null;
}

/** หา “ห้องระหว่าง me ↔ target” (ทั้งสองทิศทาง) */
async function getRoomByPair(me, target) {
  const rows = await sequelize.query(`
    SELECT cr.roomid, cr.headuserid, cr.targetuserid, cr.created_at,
           u1.userid AS head_id,   u1.originallang AS head_lang,
           u2.userid AS target_id, u2.originallang AS target_lang
    FROM chat_rooms cr
    JOIN users u1 ON u1.userid = cr.headuserid
    JOIN users u2 ON u2.userid = cr.targetuserid
    WHERE (cr.headuserid = :me AND cr.targetuserid = :target)
       OR (cr.headuserid = :target AND cr.targetuserid = :me)
    ORDER BY cr.created_at DESC, cr.roomid DESC
    LIMIT 1
  `, { type: QueryTypes.SELECT, replacements: { me, target } });
  return rows[0] || null;
}

/** จัดรูป response ของ message */
function shapeRow(m, headUser, targetUser) {
  const isHead = m.senderid === headUser.userid;
  return {
    messageid: m.messageid,
    roomid: m.roomid,
    senderuserid: m.senderid,
    originalmessage: m.originalmessage,
    originallang: isHead ? headUser.originallang : targetUser.originallang,
    targetuserid:  isHead ? targetUser.userid : headUser.userid,
    targetlang:    isHead ? targetUser.originallang : headUser.originallang,
    translatemessage: m.translatemessage
  };
}

/** POST: ส่งข้อความโดย “ไม่ต้องใส่ roomid/senderid” → ใช้ห้องล่าสุดของผู้ใช้ */
async function createMessageAutoRoom({ me, originalmessage }) {
  if (!originalmessage) { const e = new Error('originalmessage is required'); e.statusCode = 400; throw e; }

  const room = await getMyActiveRoom(me);
  if (!room) { const e = new Error('No active chat room found for this user'); e.statusCode = 404; throw e; }

  const isHead = me === room.headuserid;
  const fromLang = isHead ? room.head_lang : room.target_lang;
  const toLang   = isHead ? room.target_lang : room.head_lang;

  let translated = originalmessage;
  try { translated = await translate(originalmessage, fromLang, toLang); } catch {}

  const saved = await Message.create({
    roomid: room.roomid,
    senderid: me,
    originalmessage,
    translatemessage: translated
  });

  return shapeRow(saved,
    { userid: room.head_id, originallang: room.head_lang },
    { userid: room.target_id, originallang: room.target_lang }
  );
}

/** ดึงข้อความทั้งหมดของ “ห้อง” ที่กำหนด (ภายใน) */
async function _listByRoom(room) {
  const list = await Message.findAll({
    where: { roomid: room.roomid },
    order: [['created_at', 'ASC'], ['messageid', 'ASC']]
  });
  return list.map(m => shapeRow(m,
    { userid: room.head_id, originallang: room.head_lang },
    { userid: room.target_id, originallang: room.target_lang }
  ));
}

/** GET: ข้อความกับ target ที่กำหนด (me ↔ target) */
async function listAllWithTarget(me, target) {
  const room = await getRoomByPair(me, target);
  if (!room) { const e = new Error('Chat room not found'); e.statusCode = 404; throw e; }
  if (![room.headuserid, room.targetuserid].includes(me)) { const e = new Error('Forbidden: not a room member'); e.statusCode = 403; throw e; }
  return _listByRoom(room);
}

/** GET: ข้อความใน “ห้องล่าสุดของฉัน” (ไม่ระบุ target) */
async function listAllMyActiveRoom(me) {
  const room = await getMyActiveRoom(me);
  if (!room) { const e = new Error('No active chat room found for this user'); e.statusCode = 404; throw e; }
  if (![room.headuserid, room.targetuserid].includes(me)) { const e = new Error('Forbidden: not a room member'); e.statusCode = 403; throw e; }
  return _listByRoom(room);
}

/** GET: เฉพาะที่ฉันส่ง (กับ target) */
async function listSentWithTarget(me, target) {
  const all = await listAllWithTarget(me, target);
  return all.filter(m => m.senderuserid === me);
}
/** GET: เฉพาะที่อีกฝั่งส่งถึงฉัน (กับ target) */
async function listReceivedWithTarget(me, target) {
  const all = await listAllWithTarget(me, target);
  return all.filter(m => m.senderuserid !== me);
}

/** GET: เฉพาะที่ฉันส่ง (ห้องล่าสุด) */
async function listSentMyActiveRoom(me) {
  const all = await listAllMyActiveRoom(me);
  return all.filter(m => m.senderuserid === me);
}
/** GET: เฉพาะที่อีกฝั่งส่ง (ห้องล่าสุด) */
async function listReceivedMyActiveRoom(me) {
  const all = await listAllMyActiveRoom(me);
  return all.filter(m => m.senderuserid !== me);
}

/** PUT: แก้ข้อความของฉัน */
async function updateMyMessage(messageid, me, originalmessage) {
  if (!messageid || !originalmessage) { const e = new Error('messageid and originalmessage are required'); e.statusCode = 400; throw e; }
  const msg = await Message.findOne({ where: { messageid } });
  if (!msg) { const e = new Error('Message not found'); e.statusCode = 404; throw e; }
  if (msg.senderid !== me) { const e = new Error('Forbidden: not your message'); e.statusCode = 403; throw e; }

  // โหลดภาษาคู่ห้อง
  const room = await sequelize.query(`
    SELECT cr.roomid, cr.headuserid, cr.targetuserid,
           u1.userid AS head_id,   u1.originallang AS head_lang,
           u2.userid AS target_id, u2.originallang AS target_lang
    FROM chat_rooms cr
    JOIN users u1 ON u1.userid = cr.headuserid
    JOIN users u2 ON u2.userid = cr.targetuserid
    WHERE cr.roomid = :roomid
    LIMIT 1
  `, { type: QueryTypes.SELECT, replacements: { roomid: msg.roomid } }).then(r => r[0]);

  if (!room) { const e = new Error('Chat room not found'); e.statusCode = 404; throw e; }
  if (![room.headuserid, room.targetuserid].includes(me)) { const e = new Error('Forbidden: not a room member'); e.statusCode = 403; throw e; }

  const isHead = me === room.headuserid;
  const fromLang = isHead ? room.head_lang : room.target_lang;
  const toLang   = isHead ? room.target_lang : room.head_lang;

  let translated = originalmessage;
  try { translated = await translate(originalmessage, fromLang, toLang); } catch {}

  msg.originalmessage = originalmessage;
  msg.translatemessage = translated;
  await msg.save();

  return shapeRow(msg,
    { userid: room.head_id, originallang: room.head_lang },
    { userid: room.target_id, originallang: room.target_lang }
  );
}

/** DELETE: ลบข้อความของฉัน */
async function deleteMyMessage(messageid, me) {
  if (!messageid) { const e = new Error('messageid is required'); e.statusCode = 400; throw e; }
  const msg = await Message.findOne({ where: { messageid } });
  if (!msg) { const e = new Error('Message not found'); e.statusCode = 404; throw e; }
  if (msg.senderid !== me) { const e = new Error('Forbidden: not your message'); e.statusCode = 403; throw e; }

  // ยืนยันว่า me เป็นสมาชิกห้อง
  const rows = await sequelize.query(`
    SELECT headuserid, targetuserid FROM chat_rooms WHERE roomid = :roomid LIMIT 1
  `, { type: QueryTypes.SELECT, replacements: { roomid: msg.roomid } });
  if (!rows.length) { const e = new Error('Chat room not found'); e.statusCode = 404; throw e; }
  const { headuserid, targetuserid } = rows[0];
  if (![headuserid, targetuserid].includes(me)) { const e = new Error('Forbidden: not a room member'); e.statusCode = 403; throw e; }

  await msg.destroy();
  return { success: true };
}


/** GET: อ่านข้อความตาม messageid */
async function getMessageById(messageid, me) {
  const msg = await Message.findOne({ where: { messageid } });
  if (!msg) {
    const e = new Error('Message not found');
    e.statusCode = 404;
    throw e;
  }

  const room = await sequelize.query(`
    SELECT cr.roomid, cr.headuserid, cr.targetuserid,
           u1.userid AS head_id, u1.originallang AS head_lang,
           u2.userid AS target_id, u2.originallang AS target_lang
    FROM chat_rooms cr
    JOIN users u1 ON u1.userid = cr.headuserid
    JOIN users u2 ON u2.userid = cr.targetuserid
    WHERE cr.roomid = :roomid
    LIMIT 1
  `, {
    type: QueryTypes.SELECT,
    replacements: { roomid: msg.roomid }
  }).then(r => r[0]);

  if (!room) {
    const e = new Error('Chat room not found');
    e.statusCode = 404;
    throw e;
  }

  if (![room.headuserid, room.targetuserid].includes(me)) {
    const e = new Error('Forbidden: not a room member');
    e.statusCode = 403;
    throw e;
  }

  return shapeRow(msg,
    { userid: room.head_id, originallang: room.head_lang },
    { userid: room.target_id, originallang: room.target_lang }
  );
}


module.exports = {
  // POST
  createMessageAutoRoom,

  // GET (เลือก target หรือใช้ active room)
  listAllWithTarget,
  listSentWithTarget,
  listReceivedWithTarget,
  listAllMyActiveRoom,
  listSentMyActiveRoom,
  listReceivedMyActiveRoom,

  // PUT / DELETE
  updateMyMessage,
  deleteMyMessage,
  getMessageById
};