require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/User.js");
const propertyRoutes = require("./routes/property.js");


const app = express();
// app.use(cors());

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173/0", // change to frontend url later after deployment of frontend is done
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  const contentType = req.get('content-type');
  if (contentType) {
    console.log("Content-Type:", contentType);
  }
  if (req.body !== undefined && Object.keys(req.body || {}).length > 0) {
    console.log("req.body:", req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log("req.query:", req.query);
  }
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