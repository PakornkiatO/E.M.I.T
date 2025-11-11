const Message = require("../models/messageModel");
const User = require("../models/userModel");

function roomKeyFor(a, b) {
  return [a, b].sort((x, y) => x.localeCompare(y)).join("|");
}

exports.getHistory = async (req, res) => {
  try {
    const me = req.user?.username;
    const other = req.params.other;
    if (!me || !other || me === other) {
      return res.status(400).json({ message: "invalid_participants" });
    }

    // optional check that other exists
    const otherExists = await User.findOne({ username: other }).lean();
    if (!otherExists) return res.status(404).json({ message: "user_not_found" });

    const room = roomKeyFor(me, other);
    const history = await Message.find({ room }).sort({ createdAt: 1 }).limit(200).lean();
    res.json({ room, messages: history });
  } catch (err) {
    console.error("getHistory error:", err);
    res.status(500).json({ message: "server_error" });
  }
};

// Delete a single message by id (only sender can delete)
exports.deleteMessage = async (req, res) => {
  try {
    const me = req.user?.username;
    const { id } = req.params;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: "not_found" });
    if (msg.sender !== me) return res.status(403).json({ message: "forbidden" });

    await Message.deleteOne({ _id: id });

    const io = req.app.get('io');
    if (io) {
      io.to(msg.room).emit('message_deleted', { room: msg.room, id });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

// Clear all messages in a 1:1 chat (both participants allowed)
exports.clearHistory = async (req, res) => {
  try {
    const me = req.user?.username;
    const other = req.params.other;
    if (!me || !other || me === other) return res.status(400).json({ message: 'invalid_participants' });

    const otherExists = await User.findOne({ username: other }).lean();
    if (!otherExists) return res.status(404).json({ message: 'user_not_found' });

    const room = roomKeyFor(me, other);
    await Message.deleteMany({ room });

    const io = req.app.get('io');
    if (io) {
      io.to(room).emit('chat_cleared', { room });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('clearHistory error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};
