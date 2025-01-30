const express = require("express");
const router = express.Router();
const axios = require("axios");
const Location = require("../models/Location");

// -------------------- TROUVER ADRESSE A PROXIMITE -----------------------

router.get("/filter-nearby", async (req, res) => {
  try {
    const { address, maxDistance, placeCategory, typeOfSeason } = req.query; // Utilisation de req.query au lieu de req.body

    if (!address) {
      return res.status(400).json({ error: "Adresse manquante." });
    }

    if (!placeCategory) {
      return res.status(400).json({ error: "placeCategory manquant." });
    }

    // Fonction pour géocoder une adresse
    async function geocodeAddress(address) {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: address,
            key: apiKey,
          },
        }
      );
      if (!response.data.results || response.data.results.length === 0) {
        throw new Error("Adresse introuvable.");
      }
      return response.data.results[0].geometry.location; // { lat, lng }
    }

    // Calcul de la distance (formule Haversine)
    function haversineDistance(lat1, lon1, lat2, lon2) {
      const toRadians = (deg) => (deg * Math.PI) / 180;
      const R = 6371; // Rayon de la Terre en km
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Géocodez l'adresse de l'utilisateur
    const { lat: userLat, lng: userLng } = await geocodeAddress(address);

    const selecFilters = {};
    if (placeCategory) selecFilters.placeCategory = placeCategory;
    // if (typeOfSeason) {
    //   // Convertir la chaîne des filtres en tableau et rechercher les correspondances dans le tableau "filters" des documents
    //   selecFilters.typeOfSeason = {
    //     filters: {
    //       $elemMatch: { $regex: `/^Type d’espace:${typeOfSeason}$/` },
    //     },
    //   };
    // }

    // Passez selecFilters directement sans envelopper
    const locations = await Location.find(selecFilters);
    console.log("locations", locations);
    console.log("selecFilters", selecFilters);
    console.log("typeOfSeason", typeOfSeason);

    // Géocodez chaque adresse et calculez la distance
    const nearbyLocations = [];
    for (const location of locations) {
      try {
        const { lat, lng } = await geocodeAddress(location.locationAddress);
        const distance = haversineDistance(userLat, userLng, lat, lng);

        if (distance <= maxDistance) {
          nearbyLocations.push({
            ...location.toObject(),
            distance,
            latitude: lat,
            longitude: lng,
          });
        }
      } catch (err) {
        console.error(
          `Erreur lors du géocodage de l'adresse ${location.locationAddress}:`,
          err.message
        );
      }
    }

    // Trier les emplacements par ordre croissant de distance
    nearbyLocations.sort((a, b) => a.distance - b.distance);

    // Retourner les emplacements filtrés et triés
    res.status(200).json(nearbyLocations);
  } catch (err) {
    console.error("Erreur lors du filtrage des emplacements :", err.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

module.exports = router;
