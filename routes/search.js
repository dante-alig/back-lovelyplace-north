const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const { geocodeAddress, haversineDistance } = require("../utils/geocoding");

// Recherche globale
router.get("/", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Le terme de recherche est requis",
      });
    }

    const searchRegex = new RegExp(query, "i");

    const locations = await Location.find({
      $or: [
        { locationName: searchRegex },
        { locationDescription: searchRegex },
        { locationAddress: searchRegex },
        { keywords: searchRegex },
        { placeCategory: searchRegex },
        { tips: searchRegex },
        { filters: searchRegex },
      ],
    });

    if (locations.length === 0) {
      return res.status(404).json({
        message: "Aucun résultat trouvé pour cette recherche",
      });
    }

    res.status(200).json(locations);
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la recherche.",
      details: error.message,
    });
  }
});

// Recherche par proximité
router.get("/nearby", async (req, res) => {
  try {
    const { address, maxDistance = 5 } = req.query; // maxDistance en km, par défaut 5km

    if (!address) {
      return res.status(400).json({
        message: "L'adresse est requise pour la recherche par proximité",
      });
    }

    // Géocodage de l'adresse de recherche
    const userCoords = await geocodeAddress(address);

    // Récupération de toutes les locations
    const locations = await Location.find();

    // Calcul des distances et filtrage
    const nearbyLocations = locations
      .map(location => {
        if (location.location && location.location.lat && location.location.lng) {
          const distance = haversineDistance(
            userCoords.lat,
            userCoords.lng,
            location.location.lat,
            location.location.lng
          );
          return { ...location.toObject(), distance };
        }
        return null;
      })
      .filter(location => location && location.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyLocations.length === 0) {
      return res.status(404).json({
        message: "Aucun lieu trouvé dans ce rayon",
      });
    }

    res.json(nearbyLocations);
  } catch (error) {
    console.error("Erreur lors de la recherche par proximité:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
