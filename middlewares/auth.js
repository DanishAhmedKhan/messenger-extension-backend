const jwt = require('jsonwebtoken');

const auth = function (req, res, next) {
  const token = req.header('x-user-auth-token');
  if (!token) {
    console.log('Access denied. No token provided.');
    return res.status(401).send('Access denied. No token provided.');
  }

  try {
    const privateKey = process.env.userAuthToken;
    const decoded = jwt.verify(token, privateKey);
    if ('_id' in decoded) req.body.userId = decoded._id;
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).send('Invalid token.');
  }
};

module.exports = auth;
