const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ message: 'no_token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return res.status(401).json({ message: 'invalid_token' });

    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ message: 'user_not_found' });

    req.user = { id: user._id.toString(), username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'unauthorized' });
  }
};