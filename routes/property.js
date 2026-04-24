const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.js");
const { protect, authorize } = require("../middleware/authMiddleware.js");

// 🏠 PUBLIC ROUTES
// Anyone can search or view a single property (Privacy is handled in the controller)
router.get("/", propertyController.getProperties);
// router.get("/nearby", propertyController.getNearbyProperties);
router.get("/:id", propertyController.getProperty);

// 🔐 PROTECTED ROUTES (Requires Login)
router.post("/", protect, propertyController.createProperty);
router.put("/:id", protect, propertyController.updateProperty);
router.delete("/:id", protect, propertyController.deleteProperty);

// 🛡️ ADMIN ONLY ROUTES
router.patch("/:id/verify", protect, authorize("admin"), propertyController.verifyProperty);
router.patch("/:id/toggle-featured", protect, authorize("admin"), propertyController.toggleFeatured);

module.exports = router;