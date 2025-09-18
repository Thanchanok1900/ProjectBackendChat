const jwt = require("jsonwebtoken");
const { SECRET_KEY } = process.env;

function authenticateToken(req, res, next) {
  console.log("authenticateToken called");
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  //ตรวจสอบ token
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };