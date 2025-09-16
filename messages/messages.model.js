// messages/messages.model.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  messageid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  roomid: { type: DataTypes.INTEGER, allowNull: false },
  senderid: { type: DataTypes.INTEGER, allowNull: false },
  originalmessage: { type: DataTypes.TEXT, allowNull: false },
  translatemessage: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'messages',
  timestamps: false
});

module.exports = Message;
