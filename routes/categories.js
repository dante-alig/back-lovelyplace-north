const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
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

module.exports = router;
