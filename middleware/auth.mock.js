// middleware/auth.mock.js
module.exports = function mockAuth(req, res, next) {
  const userid = Number(req.header('x-user-id'));
  if (!userid) return res.status(401).json({ error: 'Missing x-user-id header' });
  req.user = { userid };
  next();
};
