const express = require("express");
const router = express.Router();

// Route GET pour filtrer et afficher les catégories
router.get("/filterCategories", async (req, res) => {
  try {
    const { placeCategory, postalCode, keywords, priceRange, filters } =
      req.query;

    // Construction du filtre dynamique
    const selecFilters = {};
    if (placeCategory) selecFilters.placeCategory = placeCategory;
    if (postalCode) selecFilters.postalCode = postalCode;
    if (keywords) selecFilters.keywords = { $in: keywords.split(",") }; // Recherche parmi les mots-clés
    if (priceRange) selecFilters.priceRange = priceRange;
    if (filters) {
      // Convertir la chaîne des filtres en tableau et rechercher les correspondances dans le tableau "filters" des documents
      const filterArray = filters.split(","); // Exemple : "Décoration:Cosy,Ambiance:Branchée"
      selecFilters.filters = { $all: filterArray }; // Tous les filtres doivent être présents
    }

    // Recherche dans la base de données
    const locations = await Location.find(selecFilters);

    if (locations.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun lieu trouvé avec ces critères." });
    }

    res.status(200).json(locations);
  } catch (error) {
    console.error("Erreur lors du filtrage des catégories :", error);
    res.status(500).json({
      error: "Une erreur est survenue lors du filtrage des catégories.",
      details: error.message,
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Le terme de recherche est requis",
      });
    }

    // Création du pattern de recherche
    // Insensible à la casse avec 'i'
    const searchRegex = new RegExp(query, "i");

    // Recherche dans plusieurs champs
    const locations = await Location.find({
      $or: [
        { locationName: searchRegex },
        { locationDescription: searchRegex },
        { locationAddress: searchRegex },
        { keywords: searchRegex },
        { placeCategory: searchRegex },
        { tips: searchRegex },
        // Recherche dans les filtres (qui sont au format "clé:valeur")
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

module.exports = router;
