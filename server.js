const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
require("dotenv").config();

const connectDB = require("./config/db");
const locationRoutes = require("./routes/location");
const searchRoutes = require("./routes/search");
const authRoutes = require("./routes/auth");
const specialRoutes = require("./routes/special");
const paymentRoutes = require("./routes/payment");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Connexion à la base de données
connectDB();

// Routes
app.use("/location", locationRoutes);
app.use("/search", searchRoutes);
app.use("/auth", authRoutes);
app.use("/", specialRoutes);
app.use("/api", paymentRoutes);

// Route d'accueil
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Bienvenue sur l'API des Locations !",
    endpoints: [
      {
        method: "POST",
        path: "/location",
        description: "Créer une nouvelle location",
      },
      {
        method: "GET",
        path: "/location",
        description: "Récupérer toutes les locations",
      },
      {
        method: "GET",
        path: "/location/:id",
        description: "Récupérer une location par ID",
      },
      {
        method: "PUT",
        path: "/location/:id/description",
        description: "Mettre à jour la description d'une location",
      },
      {
        method: "PUT",
        path: "/location/:id/price",
        description: "Mettre à jour le prix d'une location",
      },
      {
        method: "GET",
        path: "/search",
        description: "Recherche globale",
      },
      {
        method: "GET",
        path: "/search/nearby",
        description: "Recherche par proximité",
      },
      {
        method: "POST",
        path: "/auth/signup",
        description: "Créer un nouveau compte",
      },
      {
        method: "POST",
        path: "/auth/login",
        description: "Se connecter",
      },
      {
        method: "GET",
        path: "/fun",
        description: "Obtenir les lieux fun",
      },
      {
        method: "POST",
        path: "/geocode",
        description: "Géocoder une adresse",
      },
      {
        method: "POST",
        path: "/api/create-checkout-session",
        description: "Créer une session de paiement Stripe",
      }
    ],
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
