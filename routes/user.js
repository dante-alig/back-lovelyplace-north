const express = require("express");
const router = express.Router();
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Route d'inscription
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "Cet email est déjà utilisé" });
    }

    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    const newUser = new User({
      email,
      username,
      token,
      hash,
      salt,
    });

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      username: newUser.username,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route de connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const hash = SHA256(password + user.salt).toString(encBase64);
    if (hash !== user.hash) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    res.json({
      _id: user._id,
      token: user.token,
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
