const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');
const User = require('../model/User');
const Error = require('../model/Error');
const { authenticateUser } = require('./middleware/authentication');
const { validateProject } = require('./middleware/validation');

router.post('/', authenticateUser, validateProject, async (req, res) => {
  try {
    console.log(req.user);
    const { name } = req.body;

    const randomStr = randomstring.generate(5);
    const projectName = name.toLowerCase().replace(/\s/g, '-');
    const token = `${projectName}-${randomStr}`;

    const newProject = {
      ...req.body,
      token
    };

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        project_list: {
          $each: [newProject],
          $position: 0
        }
      }
    });

    res.json({ result: 'ok', projectToken: token });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log(req.user);
    const {
      project_list: projectList
    } = req.user;

    if (!projectList.length) {
      return res.json({ result: 'ok', projectList });
    }

    const { page } = req.query;
    const PAGE_ITEM_LENGTH = 10;
    let startIndex = PAGE_ITEM_LENGTH * Number(page);
    let endIndex = startIndex + PAGE_ITEM_LENGTH;

    return res.json({
      result: 'ok',
      projectList: projectList.slice(startIndex, endIndex),
      totalProjectsLength: projectList.length
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

module.exports = router;
