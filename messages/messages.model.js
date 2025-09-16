// messages/messages.model.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const ChatRoom = require('../chatRoom/chatRoom.model');
const User = require('../users/users.model');

class Message extends Model {
    static associate(models) {
        Message.belongsTo(models.ChatRoom, { foreignKey: 'roomid' });
        Message.belongsTo(models.User, { foreignKey: 'senderid' });
    }
}

Message.init({
  messageid: { 
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true 
  },
  roomid: { 
    type: DataTypes.INTEGER, allowNull: false 
  },
  senderid: { 
    type: DataTypes.INTEGER, allowNull: false 
  },
  originalmessage: { 
    type: DataTypes.TEXT, allowNull: false 
  },
  translatemessage: { 
    type: DataTypes.TEXT, allowNull: true 
  },
  created_at: { 
    type: DataTypes.DATE, defaultValue: DataTypes.NOW 
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: false
});

// กำหนดความสัมพันธ์ในไฟล์นี้
Message.belongsTo(ChatRoom, { foreignKey: 'roomid', as: 'ChatRoom' });
Message.belongsTo(User, { foreignKey: 'senderid', as: 'Sender' });


module.exports = Message;