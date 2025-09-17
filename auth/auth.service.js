const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../users/users.model");

const SECRET_KEY = "MY_SECRET_KEY";

async function register(req, res) {
  try {
    const { username, password, originallang } = req.body;

    const existing = await User.findOne({ 
        where: { username } 
    });
    if (existing) return res.status(400).json({ error: "Username exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword, originallang });

    res.status(201).json({ message: "User registered", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
        where: { username } 
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userid: user.userid, username: user.username }, SECRET_KEY);

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function logout(req, res) {
  res.json({ message: "Logout success. Discard token on client" });
}

module.exports = { register, login, logout };