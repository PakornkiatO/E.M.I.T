const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExist = await User.findOne({ username });
    if (userExist) return res.status(400).json({ message: "This username already used" });

    const user = await User.create({ username, password });
    
    // Emit updated user list to all connected clients
    const io = req.app.get('io');
    if (io) {
      const allUsers = await User.find({}, { username: 1, _id: 0 });
      io.emit('users_updated', { users: allUsers.map(u => u.username) });
    }
    
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, _id: 0 });
    res.json({ users: users.map(u => u.username) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find and delete the user
    const user = await User.findOneAndDelete({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Emit updated user list to all connected clients
    const io = req.app.get('io');
    if (io) {
      const allUsers = await User.find({}, { username: 1, _id: 0 });
      io.emit('users_updated', { users: allUsers.map(u => u.username) });
      
      // Also notify if this user was online and force them to logout
      io.emit('user_deleted', { deletedUsername: username });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
