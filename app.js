// app.js
const express = require("express");
const morgan = require('morgan');
const { connect, sync } = require("./config/database");
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// เรียกใช้โมเดลทั้งหมดที่ต้องการ
const User = require('./users/users.model');
const ChatRoom = require('./chatRoom/chatRoom.model');
const Message = require('./messages/messages.model');
const { Friendship } = require('./friends/friend.model');

const app = express();
app.use(morgan('tiny'));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./auth/auth.controller");
const userRoutes = require("./users/users.controller");
const chatRoomRouter = require('./chatRoom/chatRoom.controller');
const friendRouter = require('./friends/friend.controller');
const messagesRoutes = require('./messages/messages.controller');

app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use('/v1/chatrooms', chatRoomRouter);
app.use('/v1/friends', friendRouter);
app.use('/v1/messages', messagesRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Chat Application Backend!' });
});

async function initializeDatabase() {
  await connect();
  await sync();
}
initializeDatabase()

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});