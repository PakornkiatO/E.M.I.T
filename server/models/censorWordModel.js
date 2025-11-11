const mongoose = require('mongoose');

const CensorWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

// Always store lowercase for consistent matching
CensorWordSchema.pre('save', function (next) {
  if (this.word) this.word = this.word.toLowerCase();
  next();
});

module.exports = mongoose.model('CensorWord', CensorWordSchema);
