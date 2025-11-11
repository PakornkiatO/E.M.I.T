const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Group = require("../models/groupModel");
const CensorWord = require("../models/censorWordModel");

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

// ===== Group APIs =====
exports.listGroups = async (req, res) => {
  try {
    const groups = await Group.find({}).sort({ createdAt: -1 }).lean();
    res.json({ groups });
  } catch (err) {
    console.error('listGroups error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const me = req.user?.username;
    const { name, members } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'invalid_name' });
    }
    const uniqueMembers = Array.from(new Set((Array.isArray(members) && members.length ? members : [me]).concat(me)));
    const doc = await Group.create({ name: name.trim(), members: uniqueMembers, createdBy: me });

    // Emit groups_updated
    const io = req.app.get('io');
    if (io) {
      const groups = await Group.find({}, { name: 1, members: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();
      io.emit('groups_updated', { groups });
    }

    res.status(201).json({ group: doc });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'group_name_taken' });
    }
    console.error('createGroup error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const me = req.user?.username;
    const { id } = req.params;
    // Atomic add to set to avoid duplicate membership on concurrent joins
    const group = await Group.findByIdAndUpdate(
      id,
      { $addToSet: { members: me } },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: 'group_not_found' });

    const io = req.app.get('io');
    if (io) {
      const groups = await Group.find({}, { name: 1, members: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();
      io.emit('groups_updated', { groups });
    }

    res.json({ group });
  } catch (err) {
    console.error('joinGroup error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

// Delete a single message in a group (only sender can delete)
exports.deleteGroupMessage = async (req, res) => {
  try {
    const me = req.user?.username;
    const { id, msgId } = req.params; // group id and message id
    const room = `group:${id}`;
    const msg = await Message.findOne({ _id: msgId, room });
    if (!msg) return res.status(404).json({ message: 'not_found' });
    if (msg.sender !== me) return res.status(403).json({ message: 'forbidden' });

    await Message.deleteOne({ _id: msgId });
    const io = req.app.get('io');
    if (io) io.to(room).emit('group_message_deleted', { groupId: id, id: msgId });
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteGroupMessage error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

// Clear entire group chat (allow any member)
exports.clearGroupHistory = async (req, res) => {
  try {
    const me = req.user?.username;
    const { id } = req.params;
    const group = await Group.findById(id).lean();
    if (!group) return res.status(404).json({ message: 'group_not_found' });
    if (!group.members.includes(me)) return res.status(403).json({ message: 'not_member' });

    const room = `group:${id}`;
    await Message.deleteMany({ room });
    const io = req.app.get('io');
    if (io) io.to(room).emit('group_chat_cleared', { groupId: id });
    res.json({ ok: true });
  } catch (err) {
    console.error('clearGroupHistory error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

// ===== Censorship APIs =====
exports.listCensorWords = async (req, res) => {
  try {
    const words = await CensorWord.find({}, { word: 1, createdAt: 1 }).sort({ word: 1 }).lean();
    res.json({ words });
  } catch (err) {
    console.error('listCensorWords error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

exports.addCensorWord = async (req, res) => {
  try {
    const me = req.user?.username;
    const { word } = req.body || {};
    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({ message: 'invalid_word' });
    }
    const lower = word.trim().toLowerCase();
    const doc = await CensorWord.create({ word: lower, createdBy: me });
    // Emit update
    const io = req.app.get('io');
    if (io) {
      const words = await CensorWord.find({}, { word: 1 }).sort({ word: 1 }).lean();
      io.emit('censor_updated', { words });
    }
    res.status(201).json({ word: doc });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'word_exists' });
    }
    console.error('addCensorWord error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};

exports.deleteCensorWord = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await CensorWord.findById(id);
    if (!existing) return res.status(404).json({ message: 'not_found' });
    await CensorWord.deleteOne({ _id: id });
    const io = req.app.get('io');
    if (io) {
      const words = await CensorWord.find({}, { word: 1 }).sort({ word: 1 }).lean();
      io.emit('censor_updated', { words });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteCensorWord error:', err);
    res.status(500).json({ message: 'server_error' });
  }
};
