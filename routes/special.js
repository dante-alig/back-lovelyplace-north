const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const { geocodeAddress, haversineDistance } = require("../utils/geocoding");

// Route pour géocoder une adresse
router.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ message: "L'adresse est requise" });
    }

    const coordinates = await geocodeAddress(address);
    res.json(coordinates);
  } catch (error) {
    console.error("Erreur de géocodage:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
