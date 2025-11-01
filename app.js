require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connect, sync } = require("./config/database");

require("./messages/messages.model");
const friendService = require('./friend/friend.service');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./auth/auth.controller");
const userRoutes = require("./users/users.controller");
const chatRoomRouter = require("./chatRoom/chatRoom.controller");
const friendRouter = require("./friend/friend.controller");
const messagesRoutes = require("./messages/messages.controller");

app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/chatrooms", chatRoomRouter);
app.use("/v1/friend", friendRouter);
app.use("/v1/messages", messagesRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Chat Application Backend!" });
});

app.get("/health", (_, res) => res.json({ ok: true }));

async function initializeDatabase() {
  await connect();
  await sync();
  
  // Create chat rooms for all existing accepted friendships
  try {
    const result = await friendService.createChatRoomsForExistingFriends();
    console.log(result);
  } catch (error) {
    console.error('Error creating chat rooms for existing friends:', error);
  }
}
initializeDatabase();

// error handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});
