const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  members: { type: [String], required: true }, // usernames
  createdBy: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
