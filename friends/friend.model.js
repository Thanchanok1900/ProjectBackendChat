const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require("../config/database"); // ใช้ instance เดียวจาก config/database

// Model User
class User extends Model {
  static associate(models) {
    User.hasMany(models.Friendship, {
      foreignKey: 'senderid',
      as: 'sentRequests'
    });
    User.hasMany(models.Friendship, {
      foreignKey: 'targetid',
      as: 'receivedRequests'
    });
  }
}
User.init({
  userid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  originallang: {
    type: DataTypes.STRING(10),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: false
});

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

// Set up associations
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
