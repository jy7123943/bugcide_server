const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');
const User = require('../model/User');
const ErrorList = require('../model/ErrorList');
const { authenticateUser, authenticateBugcideModule } = require('./middleware/authentication');
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

    res.json({ result: 'ok', projectToken: token, newProject });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log(req.user);
    const {
      name,
      profile_url: profileUrl,
      project_list: projectList
    } = req.user;

    const userInfo = { name, profileUrl };

    if (!projectList.length) {
      return res.json({
        result: 'ok',
        userInfo,
        projectList
      });
    }

    const { page } = req.query;
    const PAGE_ITEM_LENGTH = 10;
    let startIndex = PAGE_ITEM_LENGTH * Number(page);
    let endIndex = startIndex + PAGE_ITEM_LENGTH;

    return res.json({
      result: 'ok',
      userInfo,
      projectList: projectList.slice(startIndex, endIndex),
      totalProjectsLength: projectList.length
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

router.post('/:token/error', authenticateBugcideModule, async (req, res) => {
  try {
    const { token } = req.params;
    const { errorInfo } = req.body;
    let { error_id: errorId } = req.project;

    if (!errorId) {
      const newErrorList = await new ErrorList().save();
      errorId = newErrorList._id;

      await User.updateOne({ 'project_list.token': token }, {
        $set: {
          'project_list.$.error_id': newErrorList._id
        }
      });
    }

    if (!errorInfo.length) {
      return res.json({ result: 'not changed' });
    }

    await ErrorList.findByIdAndUpdate(errorId, {
      $push: {
        error_list: {
          $each: errorInfo,
          $position: 0
        }
      }
    });

    return res.json({ result: 'ok' });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

module.exports = router;
