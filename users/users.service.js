const User = require("./users.model");

// Get all users
async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ['userid','username','originallang'] 
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get user by id
async function getUser(req, res) {
  try {
    const { userid } = req.params;
    const user = await User.findOne({
      where: { userid },
      attributes: ['userid','username','originallang']
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    const { userid } = req.params;
    const { username, originallang } = req.body;

    // ตรวจสอบสิทธิ์ ต้องเป็นเจ้าของ account เท่านั้น
    if (parseInt(userid) !== req.user.userid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const user = await User.findOne({ 
        where: { userid } 
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username) user.username = username;
    if (originallang) user.originallang = originallang;
    await user.save();  
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const { userid } = req.params;

    if (parseInt(userid) !== req.user.userid) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const count = await User.destroy({ 
        where: { userid } 
    });
    if (count === 0) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAllUsers, getUser, updateUser, deleteUser };