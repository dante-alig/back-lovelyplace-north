const express = require("express");
const router = express.Router();
const axios = require("axios");

// Route pour obtenir les horaires d'un lieu via Google Places API
router.post("/hours", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Adresse requise" });
    }

    // Vérifier si la clé API est configurée
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res
        .status(500)
        .json({ error: "Clé API Google Places non configurée" });
    }

    // D'abord, on utilise l'API Geocoding pour obtenir le place_id
    const geocodingResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (
      !geocodingResponse.data.results ||
      geocodingResponse.data.results.length === 0
    ) {
      return res.status(404).json({ error: "Adresse non trouvée" });
    }

    const placeId = geocodingResponse.data.results[0].place_id;

    // Ensuite, on utilise l'API Places pour obtenir les horaires
    const placesResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    // Vérifier si la requête a réussi et si les horaires sont disponibles
    if (
      placesResponse.data.result &&
      placesResponse.data.result.opening_hours
    ) {
      return res.json({
        opening_hours: placesResponse.data.result.opening_hours,
      });
    } else {
      return res
        .status(404)
        .json({ message: "Horaires non disponibles pour ce lieu" });
    }
  } catch (error) {
    console.error("Erreur:", error);
    return res.status(500).json({
      error:
        error.response?.data?.error_message ||
        "Erreur lors de la récupération des horaires",
    });
  }
});

module.exports = router;
