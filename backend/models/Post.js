const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, default: '작성자' },
  createdAt: { type: Date, default: Date.now },

  departments: [{
    deptName: { type: String, required: true },
    currentMembers: { type: Number, default: 0 },
    maxMembers: { type: Number, required: true }
  }],

  deadline: { type: String, required: true }
});

module.exports = mongoose.model('Post', PostSchema);