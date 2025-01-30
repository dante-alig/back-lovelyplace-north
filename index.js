const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
require("dotenv").config();

const connectDB = require("./config/db");
const locationRoutes = require("./routes/location");
const searchRoutes = require("./routes/search");
const userRoutes = require("./routes/user");
const specialRoutes = require("./routes/special");
const apiRoutes = require("./routes/api");
const categoriesRoutes = require("./routes/categories");
const filtersRoutes = require("./routes/filters");
const nearbyRoutes = require("./routes/nearby");
const placesRoutes = require("./routes/places");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Connexion à MongoDB
connectDB()
  .then(() => {
    // Routes
    app.use("/location", locationRoutes);
    app.use("/search", searchRoutes);
    app.use("/user", userRoutes);
    app.use("/", specialRoutes);
    app.use("/api", apiRoutes);
    app.use("/categories", categoriesRoutes);
    app.use("/filters", filtersRoutes);
    app.use("/nearby", nearbyRoutes);
    app.use("/places", placesRoutes);

    // Démarrage du serveur
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT} 🚀🚀🚀`);
    });
  })
  .catch((error) => {
    console.error("Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  });
