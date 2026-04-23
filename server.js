require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/User.js");
const propertyRoutes = require("./routes/property.js");


const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  console.log("Content-Type:", req.get('content-type'));
  console.log("req.body:", req.body);
  console.log("---");
  next();
});

// Connect to MongoDB
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
console.log("MONGO_URI is:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("Real Estate API running");
});
// middleware
app.use("/api/users", userRoutes);
app.use("/api/property", propertyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));