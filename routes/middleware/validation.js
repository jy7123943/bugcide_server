const REQUIRED_NAME_FIELD = 'project name is required.';
const UNIQUE_NAME_FIELD = 'Project with the same name already exist. Project should have a unique name.';

exports.validateProject = async (req, res, next) => {
  try {
    const { name } = req.body;

    const { project_list: projectList } = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({ result: 'validation failed', message: REQUIRED_NAME_FIELD });
    }

    if (projectList && projectList.length > 0) {
      const isProjectNameUnique = projectList.every(project => project.name !== name);

      if (!isProjectNameUnique) {
        return res.status(400).json({ result: 'validation failed', message: UNIQUE_NAME_FIELD });
      }
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({ result: 'failed' });
  }
};
