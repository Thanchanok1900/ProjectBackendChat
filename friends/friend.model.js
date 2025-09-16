const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const process = require('process');
const path = require('path');
const config = require(path.join(__dirname, '../config/config.json'))[process.env.NODE_ENV || 'development'];

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Model User
class User extends Model {
  static associate(models) {
    User.hasMany(models.Friendship, {
      foreignKey: 'senderid',
      as: 'sentRequests'
    });
    User.hasMany(models.Friendship, {
      foreignKey: 'targetid', // แก้ไขชื่อคอลัมน์เป็น 'targetid'
      as: 'receivedRequests'
    });
  }
}
User.init({
  userid: { // แก้ไข Primary Key เป็น 'userid'
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
    type: DataTypes.TEXT, // แก้ไข Type เป็น TEXT
    allowNull: false
  },
  originallang: {
    type: DataTypes.STRING(10), // แก้ไข Type เป็น STRING(10)
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users', // กำหนดชื่อตาราง
  timestamps: false // ลบ timestamps
});

// Model Friendship
class Friendship extends Model {
  static associate(models) {
    Friendship.belongsTo(models.User, {
      foreignKey: 'senderid',
      as: 'sender'
    });
    Friendship.belongsTo(models.User, {
      foreignKey: 'targetid', // แก้ไขชื่อคอลัมน์เป็น 'targetid'
      as: 'receiver'
    });
  }
}
Friendship.init({
  friendshipid: { // แก้ไข Primary Key เป็น 'friendshipid'
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderid: { // แก้ไขชื่อคอลัมน์เป็น 'senderid'
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // ชี้ไปที่ตาราง users
      key: 'userid' // ชี้ไปที่ Primary Key ใหม่ของตาราง users
    }
  },
  targetid: { // แก้ไขชื่อคอลัมน์เป็น 'targetid'
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'userid'
    }
  },
  status: {
    type: DataTypes.STRING(20), // แก้ไข Type เป็น STRING(20)
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  sequelize,
  modelName: 'Friendship',
  tableName: 'friends', // กำหนดชื่อตาราง
  timestamps: false // ลบ timestamps
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