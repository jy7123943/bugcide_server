const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { authenticateUser } = require('./middleware/authentication');

router.get('/login', async (req, res, next) => {
  try {
    const { socialId, name } = req.body;
    const jwtoken = jwt.sign({ socialId }, process.env.JWT_SECRET_KEY);

    await new User({ social_id: socialId, name }).save();

    res.json({ result: 'ok', jwtoken });
  } catch (err) {
    res.status(400).json({ result: 'failed' });
  }
});

router.get('/', authenticateUser, (req, res, next) => {

  res.json({hello: 'hello'});
});

module.exports = router;
