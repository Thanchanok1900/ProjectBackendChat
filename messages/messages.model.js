<<<<<<< Updated upstream
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

=======
// friend.model.js
const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require("../config/database");

// Import User model
const User = require('../users/users.model'); // แก้ไข path ให้ถูกต้อง

// Model Friendship
class Friendship extends Model {
  static associate(models) {
    Friendship.belongsTo(models.User, { foreignKey: 'senderid', as: 'sender' });
    Friendship.belongsTo(models.User, { foreignKey: 'targetid', as: 'receiver' });
  }
}
Friendship.init({
  // ...
}, {
  sequelize,
  modelName: 'Friendship',
  tableName: 'friends',
  timestamps: false
});

// Set up associations
const models = { User, Friendship }; // ต้องมี User ในนี้ด้วย
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Op,
  User,
  Friendship
};
>>>>>>> Stashed changes
