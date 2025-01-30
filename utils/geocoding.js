require("dotenv").config();
const axios = require("axios");

const geocodeAddress = async (address) => {
  try {
    console.log(" Géocodage de l'adresse:", address);
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    console.log(" Réponse Google Maps:", {
      status: response.data.status,
      resultCount: response.data.results?.length || 0,
      firstResult: response.data.results?.[0]?.formatted_address || "Aucun résultat"
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(" Coordonnées trouvées:", {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: response.data.results[0].formatted_address
      });
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }
    throw new Error("Adresse non trouvée");
  } catch (error) {
    console.error(" Erreur de géocodage:", error.message);
    if (error.response) {
      console.error("Détails de l'erreur:", {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
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
};

module.exports = { geocodeAddress, haversineDistance };
