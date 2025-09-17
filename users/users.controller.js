const express = require("express");
const router = express.Router();
const { getAllUsers, getUser, getMe, updateUser, deleteUser } = require("./users.service");
const { authenticateToken } = require("../utils/authMiddleware");

router.get("/", authenticateToken, getAllUsers);
router.get("/me", authenticateToken, getMe);
router.get("/:userid", authenticateToken, getUser);
router.put("/:userid", authenticateToken, updateUser);
router.delete("/:userid", authenticateToken, deleteUser);

module.exports = router;