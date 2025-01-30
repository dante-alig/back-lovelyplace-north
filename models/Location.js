const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  locationName: { type: String, required: true },
  locationAddress: { type: String, required: true },
  locationDescription: { type: String, required: true },
  tips: String,
  socialmedia: String,
  mediaLink: Object,
  hours: Object,
  priceRange: String,
  keywords: [String],
  filters: [String],
  postalCode: String,
  placeCategory: String,
  photo: String,
  location: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model("Location", locationSchema);
