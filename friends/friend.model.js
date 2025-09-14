// friend.model.js
const { Sequelize, DataTypes, Model } = require('sequelize');
const process = require('process');
const config = require(__dirname + '/../config/config.json')[process.env.NODE_ENV || 'development'];
const { Op } = require('sequelize');

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
      foreignKey: 'senderId',
      as: 'sentRequests'
    });
    User.hasMany(models.Friendship, {
      foreignKey: 'receiverId',
      as: 'receivedRequests'
    });
  }
}
User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalLang: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
});

// Model Friendship
class Friendship extends Model {
  static associate(models) {
    Friendship.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    Friendship.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver'
    });
  }
}
Friendship.init({
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  sequelize,
  modelName: 'Friendship',
});

// Set up associations
const models = { User, Friendship };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export objects
module.exports = {
  sequelize,
  Op,
  User,
  Friendship
};