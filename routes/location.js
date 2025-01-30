const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const { geocodeAddress } = require("../utils/geocoding");
const { cloudinary, convertToBase64 } = require("../utils/cloudinary");

// Créer une nouvelle location
router.post("/", async (req, res) => {
  try {
    const {
      locationName,
      locationAddress,
      locationDescription,
      tips,
      socialmedia,
      mediaLink,
      hours,
      priceRange,
      keywords,
      filters,
      postalCode,
      placeCategory,
    } = req.body;

    const parsedMediaLink =
      typeof mediaLink === "string" ? JSON.parse(mediaLink) : mediaLink;
    const parsedHours = typeof hours === "string" ? JSON.parse(hours) : hours;
    const parsedKeywords =
      typeof keywords === "string" ? JSON.parse(keywords) : keywords;
    const parsedFilters =
      typeof filters === "string" ? JSON.parse(filters) : filters;

    const newLocation = new Location({
      locationName,
      locationAddress,
      locationDescription,
      tips,
      socialmedia,
      mediaLink: parsedMediaLink,
      hours: parsedHours,
      priceRange,
      keywords: parsedKeywords,
      filters: parsedFilters,
      postalCode,
      placeCategory,
    });

    // Géocodage de l'adresse
    const coordinates = await geocodeAddress(locationAddress);
    newLocation.location = coordinates;

    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Point de terminaison pour enregistrer les informations
router.post("/save", async (req, res) => {
  try {
    const {
      locationName,
      locationAddress,
      locationDescription,
      tips,
      socialmedia,
      mediaLink,
      hours,
      priceRange,
      keywords,
      filters,
      postalCode,
      placeCategory,
    } = req.body;

    // Conversion JSON des champs mediaLink, hours, keywords, et filters s'ils sont envoyés sous forme de chaîne
    const parsedMediaLink =
      typeof mediaLink === "string" ? JSON.parse(mediaLink) : mediaLink;
    const parsedHours = typeof hours === "string" ? JSON.parse(hours) : hours;
    const parsedKeywords =
      typeof keywords === "string" ? JSON.parse(keywords) : keywords;
    const parsedFilters =
      typeof filters === "string" ? JSON.parse(filters) : filters;

    const extractHref = (htmlString) => {
      const hrefRegex = /href=["']([^"']+)["']/;
      const match = htmlString.match(hrefRegex);
      return match ? match[1] : null;
    };

    // Appliquer extractHref à chaque élément de mediaLink s'il s'agit d'un tableau
    const processedMediaLink = Array.isArray(parsedMediaLink)
      ? parsedMediaLink.map((link) => extractHref(link))
      : parsedMediaLink;

    const newLocation = new Location({
      locationName,
      locationAddress,
      locationDescription,
      tips,
      socialmedia,
      mediaLink: processedMediaLink,
      hours: parsedHours,
      priceRange,
      keywords: parsedKeywords,
      filters: parsedFilters,
      postalCode,
      placeCategory,
    });

    // Gestion des fichiers photos
    console.log("req.files>>>>>", req.files);
    if (req.files && req.files.photos) {
      console.log("les photos>>>>", req.files.photos);
      const photoFiles = Array.isArray(req.files.photos)
        ? req.files.photos
        : [req.files.photos];
      newLocation.photos = [];

      for (const photo of photoFiles) {
        const convertedPhoto = convertToBase64(photo);
        try {
          const uploadResult = await cloudinary.uploader.upload(convertedPhoto);
          newLocation.photos.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error("Erreur lors de l'upload Cloudinary:", uploadError);
          return res
            .status(500)
            .json({ error: "Échec de l'upload des photos." });
        }
      }
    }

    await newLocation.save();
    res.status(201).json({ message: "Données enregistrées avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des données:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de l'enregistrement des données.",
      details: error.message,
    });
  }
});

// Point de terminaison pour enregistrer les informations avec une image prédéfinie
router.post("/location-with-image", async (req, res) => {
  try {
    const {
      locationName,
      locationAddress,
      locationDescription,
      tips,
      socialmedia,
      mediaLink,
      hours,
      priceRange,
      keywords,
      filters,
      postalCode,
      placeCategory,
    } = req.body;

    // Conversion JSON des champs mediaLink, hours, keywords, et filters s'ils sont envoyés sous forme de chaîne
    const parsedMediaLink =
      typeof mediaLink === "string" ? JSON.parse(mediaLink) : mediaLink;
    const parsedHours = typeof hours === "string" ? JSON.parse(hours) : hours;
    const parsedKeywords =
      typeof keywords === "string" ? JSON.parse(keywords) : keywords;
    const parsedFilters =
      typeof filters === "string" ? JSON.parse(filters) : filters;

    // URL de l'image prédéfinie
    const predefinedImageUrl =
      "https://www.peninsula.com/-/media/images/paris/new/dining/loiseau-blanc/ppr-oiseau-blanc-interior-evening-1074/ppr-oiseaublanc.png?mw=987&hash=58953560C2A423F8B8D6B9EE0D7271CC";

    // Création d'une nouvelle instance de Location avec l'image prédéfinie
    const newLocation = new Location({
      locationName,
      locationAddress,
      locationDescription,
      tips,
      socialmedia,
      mediaLink: parsedMediaLink,
      hours: parsedHours,
      priceRange,
      keywords: parsedKeywords,
      filters: parsedFilters,
      postalCode,
      placeCategory,
      photo: predefinedImageUrl, // Ajout de l'image prédéfinie
    });

    // Géocodage de l'adresse
    const coordinates = await geocodeAddress(locationAddress);

    // Ajout des coordonnées à l'instance
    newLocation.location = coordinates;

    // Sauvegarde de l'instance
    await newLocation.save();

    res.status(201).json(newLocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Route GET pour récupérer toutes les locations
router.get("/items", async (req, res) => {
  try {
    const locations = await Location.find();
    res.status(200).json(locations);
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des données.",
      details: error.message,
    });
  }
});

// Route GET pour récupérer une location par _id
router.get("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);

    if (!location) {
      return res.status(404).json({ error: "Location non trouvée." });
    }

    res.status(200).json(location);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'élément:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération de l'élément.",
      details: error.message,
    });
  }
});

// Route PUT pour éditer une location et ajouter des photos
router.put("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    // Récupérer l'élément existant
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ error: "Location non trouvée." });
    }

    // Gestion des fichiers photos
    if (req.files && req.files.photos) {
      const photoFiles = Array.isArray(req.files.photos)
        ? req.files.photos
        : [req.files.photos];

      for (const photo of photoFiles) {
        const convertedPhoto = convertToBase64(photo);
        try {
          // Upload sur Cloudinary
          const uploadResult = await cloudinary.uploader.upload(convertedPhoto);
          // Ajouter l'URL de la photo à la liste des photos existantes
          location.photos.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error("Erreur lors de l'upload Cloudinary:", uploadError);
          return res
            .status(500)
            .json({ error: "Échec de l'upload des photos." });
        }
      }
    }

    // Mise à jour des autres champs si fournis
    Object.assign(location, updatedFields);

    // Sauvegarder les modifications
    await location.save();
    res.status(200).json({
      message: "Location mise à jour avec succès.",
      location,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la location:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la mise à jour.",
      details: error.message,
    });
  }
});

// Route DELETE pour supprimer une photo spécifique
router.delete("/items/:id/photo", async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body; // URL de la photo à supprimer

    // Récupérer la location par son _id
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ error: "Location non trouvée." });
    }

    // Vérifier si la photo existe dans la liste des photos
    const photoIndex = location.photos.indexOf(photoUrl);
    if (photoIndex === -1) {
      return res.status(404).json({ error: "Photo non trouvée." });
    }

    // Supprimer la photo de Cloudinary
    const publicId = photoUrl.split("/").pop().split(".")[0]; // Extraire le public_id
    await cloudinary.uploader.destroy(publicId);

    // Supprimer la photo de la liste
    location.photos.splice(photoIndex, 1);

    // Sauvegarder les modifications
    await location.save();

    res.status(200).json({
      message: "Photo supprimée avec succès.",
      photos: location.photos,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la photo:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la suppression de la photo.",
      details: error.message,
    });
  }
});

// Mettre à jour la description
router.put("/:id/description", async (req, res) => {
  try {
    const { id } = req.params;
    const { locationDescription } = req.body;

    if (!locationDescription) {
      return res.status(400).json({
        message: "La description est requise",
      });
    }

    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ message: "Instance non trouvée" });
    }

    location.locationDescription = locationDescription;
    await location.save();

    res.json({
      message: "Description mise à jour avec succès",
      locationDescription: location.locationDescription,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la description:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Mettre à jour le prix
router.put("/:id/price", async (req, res) => {
  try {
    const { id } = req.params;
    const { priceRange } = req.body;

    if (!priceRange) {
      return res.status(400).json({
        message: "Le prix est requis",
      });
    }

    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ message: "Instance non trouvée" });
    }

    location.priceRange = priceRange;
    await location.save();

    res.json({
      message: "Prix mis à jour avec succès",
      priceRange: location.priceRange,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du prix:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer toutes les locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer une location par ID
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: "Location non trouvée" });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
