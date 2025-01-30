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
    if (keywords) selecFilters.keywords = { $in: keywords.split(",") };
    if (priceRange) selecFilters.priceRange = priceRange;
    if (filters) {
      const filterArray = filters.split(",");
      selecFilters.filters = { $all: filterArray };
    }

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

module.exports = router;
