const jwt = require('jsonwebtoken');
const User = require('../../model/User');

exports.authenticateUser = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    console.log(authorization);

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({ result: 'invalid request' });
    }

    const token = authorization.split(' ')[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ result: 'unauthorized' });
    }

    const user = await User.findOne({ social_id: decoded.socialId });

    if (!user) {
      return res.status(401).json({ result: 'unauthorized' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(400).json({ result: 'failed' });
  }
};
