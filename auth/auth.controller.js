const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../utils/authMiddleware");
const { register, login, logout } = require("./auth.service");

router.post("/signup", register);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);

module.exports = router;