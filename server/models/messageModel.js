const mongoose = require("mongoose");

// Room id for one-on-one chat will be a deterministic key from usernames
// Example: roomKeyFor('alice','bob') => 'alice|bob' (sorted)
const messageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true }, // deterministic room key
  participants: { type: [String], required: true }, // [usernameA, usernameB]
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  content: { type: String, required: true },
  readBy: { type: [String], default: [] }, // usernames who've read
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
