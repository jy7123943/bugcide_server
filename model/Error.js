
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const errorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  lineno: {
    type: Number,
    required: true
  },
  colno: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    required: true
  },
  memo: {
    type: String
  },
  related_resources: {
    type: [String]
  }
});

module.exports = mongoose.model('Error', errorSchema);
