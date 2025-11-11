const express = require("express");
const router = express.Router();
const { register, login, getAllUsers, deleteUser } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/users", getAllUsers);
router.delete("/users/:username", deleteUser);

module.exports = router;