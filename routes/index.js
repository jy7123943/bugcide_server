const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { authenticateUser } = require('./middleware/authentication');

router.post('/login', async (req, res, next) => {
  try {
    const { socialId, name, profileUrl } = req.body;

    const jwtoken = jwt.sign({ socialId }, process.env.JWT_SECRET_KEY);

    await new User({
      social_id: socialId,
      profile_url: profileUrl,
      name
    }).save();

    res.json({ result: 'ok', jwtoken });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

module.exports = router;
