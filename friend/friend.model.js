const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require("../config/database");
const User = require('../users/users.model');

// Model Friendship
class Friendship extends Model {
  static associate(models) {
    Friendship.belongsTo(models.User, { foreignKey: 'senderid', as: 'sender' });
    Friendship.belongsTo(models.User, { foreignKey: 'targetid', as: 'receiver' });
  }
}
Friendship.init({
  friendshipid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'userid' }
  },
  targetid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'userid' }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  sequelize,
  modelName: 'Friendship',
  tableName: 'friends',
  timestamps: false
});

// กำหนด associations โดยใช้ User model ที่ import เข้ามา
const models = { User, Friendship };
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