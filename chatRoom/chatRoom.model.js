const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../users/users.model');

const ChatRoom = sequelize.define('ChatRoom', {
    roomid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    headuserid: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    targetuserid: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'chat_rooms',
    timestamps: false
});

// Associations
ChatRoom.belongsTo(User, { as: 'HeadUser', foreignKey: 'headuserid' });
ChatRoom.belongsTo(User, { as: 'TargetUser', foreignKey: 'targetuserid' });

module.exports = ChatRoom;
