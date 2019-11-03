const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config();

const indexRouter = require('./routes/index');
const projectRouter = require('./routes/project');
const app = express();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_ATLAS_URL, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection-error:'));

db.once('open', function () {
  console.log('Bugcide DB connected');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const WHITE_LIST = [
  process.env.CLIENT_URL,
  process.env.MODULE_URL
];
const CORS_OPTION = {
  origin: (origin, callback) => {
    if (WHITE_LIST.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}
app.use(cors(CORS_OPTION));

app.use('/', indexRouter);
app.use('/project', projectRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({ result: 'Something went wrong' });
});

module.exports = app;
