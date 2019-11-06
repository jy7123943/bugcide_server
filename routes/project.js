const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');
const User = require('../model/User');
const ErrorList = require('../model/ErrorList');
const { authenticateUser, authenticateBugcideModule } = require('./middleware/authentication');
const { validateProject } = require('./middleware/validation');

router.post('/', authenticateUser, validateProject, async (req, res) => {
  try {
    const { name } = req.body;

    const randomStr = randomstring.generate(5);
    const projectName = name.toLowerCase().replace(/\s/g, '-');
    const token = `${projectName}-${randomStr}`;

    const newErrorList = await new ErrorList().save();

    const newProject = {
      ...req.body,
      token,
      error_id: newErrorList._id
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
    const PAGE_ITEM_LIMIT = 10;
    let startIndex = PAGE_ITEM_LIMIT * Number(page);
    let endIndex = startIndex + PAGE_ITEM_LIMIT;

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

router.get('/:token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.params;
    const { page, sort } = req.query;
    const { project_list: projectList } = req.user;

    const targetProject = projectList.find(project => project.token === token);
    const { error_id: errorId } = targetProject;

    if (!errorId) {
      return res.json({ result: 'Project not started', targetProject });
    }

    let PAGE_ITEM_LIMIT = 20;
    let startIndex = PAGE_ITEM_LIMIT * Number(page);

    const [{ totalErrorListLength }] = await ErrorList.aggregate()
      .match({ _id: errorId })
      .project({
        totalErrorListLength: {
          $size: '$error_list'
        }
      });

    let errorList;
    if (sort === 'desc') {
      startIndex = Number(totalErrorListLength) - (PAGE_ITEM_LIMIT * (Number(page) + 1));
      if (startIndex < 0) {
        PAGE_ITEM_LIMIT = 20 + startIndex;
        startIndex = 0
      }

      [{ errorList }] = await ErrorList.aggregate()
        .match({ _id: errorId })
        .project({
          errorList: {
            $reverseArray: {
              $slice: ['$error_list', startIndex, PAGE_ITEM_LIMIT]
            }
          }
        });
    } else {
      [{ errorList }] = await ErrorList.aggregate()
        .match({ _id: errorId })
        .project({
          errorList: {
            $slice: ['$error_list', startIndex, PAGE_ITEM_LIMIT]
          }
        });
    }

    res.json({
      result: 'ok',
      errorList: errorList,
      targetProject,
      totalErrorListLength
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

router.delete('/:token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.params;
    const { project_list: projectList } = req.user;

    const targetProject = projectList.find(project => project.token === token);
    const { error_id: errorId } = targetProject;

    if (errorId) {
      console.log('error Id: ', errorId);
      await ErrorList.findByIdAndDelete(errorId);
    }

    await User.updateOne({ _id: req.user._id }, {
      $pull: {
        project_list: { _id: targetProject._id }
      }
    }, {
      safe: true,
      multi: true
    });

    res.json({ result: 'ok' });
  } catch (err) {
    console.log(err);
    res.json({ result: 'failed '});
  }
});

router.post('/:token/error', authenticateBugcideModule, async (req, res) => {
  try {
    const { errorInfo } = req.body;
    let { error_id: errorId } = req.project;

    if (!errorInfo.length) {
      return res.json({ result: 'not changed' });
    }

    const updatedError = await ErrorList.findByIdAndUpdate(errorId, {
      $push: {
        error_list: {
          $each: errorInfo,
          $position: 0
        }
      }
    }, { new : true });

    const updateCollection = errorInfo.map(error => {
      const hour = new Date(error.created_at).getHours();
      const errorName = error.name;

      return ErrorList.updateOne({ _id: errorId }, {
        $inc: {
          [`time_statistics.${hour}`]: error.duplicate_count,
          [`name_statistics.${errorName}`]: error.duplicate_count
        },
      });
    });

    await Promise.all(updateCollection);

    res.json({ result: 'ok' });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: 'failed' });
  }
});

module.exports = router;
