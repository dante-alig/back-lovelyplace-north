const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connecté à MongoDB");
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
