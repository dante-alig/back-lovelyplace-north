const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const { geocodeAddress, haversineDistance } = require("../utils/geocoding");
const axios = require("axios");

// Route pour les lieux fun
router.get("/fun", async (req, res) => {
  try {
    const { postalCode, keywords, priceRange, filters } = req.query;

    const query = {
      placeCategory: "partager_une_activité",
    };

    if (postalCode) query.postalCode = postalCode;
    if (priceRange) query.priceRange = priceRange;
    if (keywords)
      query.keywords = { $in: Array.isArray(keywords) ? keywords : [keywords] };
    if (filters)
      query.filters = { $in: Array.isArray(filters) ? filters : [filters] };

    const locations = await Location.find(query);

    if (locations.length === 0) {
      return res.status(404).json({ message: "Aucun lieu trouvé" });
    }

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/drink", async (req, res) => {
  try {
    const { postalCode, keywords, priceRange, filters } = req.query;

    // Recherche initiale pour placeCategory === "prendre_un_verre"
    const baseFilter = { placeCategory: "prendre_un_verre" };

    // Ajout des autres filtres dynamiques
    if (postalCode) baseFilter.postalCode = postalCode;
    if (keywords) baseFilter.keywords = { $in: keywords.split(",") };
    if (priceRange) baseFilter.priceRange = priceRange;
    if (filters) {
      // Convertir la chaîne de filtres en tableau
      const filterArray = filters.split(","); // Exemple : "Décoration:Cosy,Ambiance:Branchée"
      baseFilter.filters = { $all: filterArray }; // Tous les filtres doivent être présents
    }

    // Recherche avec les filtres combinés
    const locations = await Location.find(baseFilter);

    if (locations.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun lieu trouvé avec ces critères." });
    }

    res.status(200).json(locations);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération et du filtrage des données :",
      error
    );
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération et du filtrage.",
      details: error.message,
    });
  }
});

// Route GET pour récupérer les locations avec placeCategory === "manger_ensemble"
router.get("/eat", async (req, res) => {
  try {
    const { postalCode, keywords, priceRange, filters } = req.query;

    // Recherche initiale pour placeCategory === "manger_ensemble"
    const baseFilter = { placeCategory: "manger_ensemble" };

    // Ajout des autres filtres dynamiques
    if (postalCode) baseFilter.postalCode = postalCode;
    if (keywords) baseFilter.keywords = { $in: keywords.split(",") };
    if (priceRange) baseFilter.priceRange = priceRange;
    if (filters) {
      // Convertir la chaîne de filtres en tableau
      const filterArray = filters.split(","); // Exemple : "Décoration:Cosy,Ambiance:Branchée"
      baseFilter.filters = { $all: filterArray }; // Tous les filtres doivent être présents
    }

    // Recherche avec les filtres combinés
    const locations = await Location.find(baseFilter);

    if (locations.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun lieu trouvé avec ces critères." });
    }

    res.status(200).json(locations);
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des données.",
      details: error.message,
    });
  }
});

// Recherche par proximité
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
