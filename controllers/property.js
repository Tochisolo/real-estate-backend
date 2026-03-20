const Property = require("../models/Property");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");


//Helper: Build owner view (works with lean objects)
const formatOwner = (property, req) => {
  const isAdmin = req.user?.role === "admin";
  const isOwner = property.owner?._id?.toString() === req.user?.id;

  // TODO: Replace with real booking check
  const hasBooked = req.user?.hasBooked === true;

  if (isAdmin || isOwner || hasBooked) {
    return {
      fullName: property.owner.fullName,
      email: property.owner.email,
      phoneNumber: property.owner.phoneNumber
    };
  }

  return {
    fullName: property.owner.fullName
  };
};



// CREATE PROPERTY
exports.createProperty = async (req, res) => {
  try {

    const { title, description, propertyType, listingType, price } = req.body;

    if (!title || !description || !propertyType || !listingType || !price) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    const property = await Property.create({
      ...req.body,
      owner: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// GET ALL PROPERTIES 
exports.getProperties = async (req, res) => {
  try {

    let filter = {};

    // 🔍 Case-insensitive filters
    if (req.query.city) {
      filter["address.city"] = { $regex: req.query.city, $options: "i" };
    }

    if (req.query.propertyType) {
      filter.propertyType = { $regex: req.query.propertyType, $options: "i" };
    }

    if (req.query.listingType) {
      filter.listingType = { $regex: req.query.listingType, $options: "i" };
    }

    if (req.query.isFeatured) {
      filter.isFeatured = req.query.isFeatured === "true";
    }

    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    }

    // Price filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Amenities filter
    if (req.query.amenities) {
      const amenitiesArray = req.query.amenities.split(",");
      filter.amenities = { $all: amenitiesArray };
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // LEAN QUERY (optimized)
    const properties = await Property.find(filter)
      .populate("owner", "fullName email phoneNumber")
      .skip(skip)
      .limit(limit)
      .lean();

    // Format owner view (now directly modifying plain objects)
    const formatted = properties.map(p => {
      p.owner = formatOwner(p, req);
      return p;
    });

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Properties fetched successfully",
      count: formatted.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: formatted
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};



// GET SINGLE PROPERTY (LEAN)
exports.getProperty = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID"
      });
    }

    const property = await Property.findById(id)
      .populate("owner", "fullName email phoneNumber")
      .lean();

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    property.owner = formatOwner(property, req);

    res.status(200).json({
      success: true,
      data: property
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};



// UPDATE PROPERTY (STRICT AUTH)
exports.updateProperty = async (req, res) => {
  try {

    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    const isOwner = property.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this property"
      });
    }

    const updated = await Property.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: updated
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};



// DELETE PROPERTY (BULK CLOUDINARY DELETE)
exports.deleteProperty = async (req, res) => {
  try {

    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    const isOwner = property.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // BULK DELETE
    if (property.images && property.images.length > 0) {

      const publicIds = property.images
        .map(img => img.public_id)
        .filter(Boolean);

      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }
    }

    await Property.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Property deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};



// VERIFY PROPERTY (ADMIN ONLY)
exports.verifyProperty = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only"
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["pending", "verified", "rejected"];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification status"
      });
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { verificationStatus: status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Verification status updated",
      data: property
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};



// TOGGLE FEATURED (ADMIN ONLY)
exports.toggleFeatured = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only"
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    property.isFeatured = !property.isFeatured;
    await property.save();

    res.status(200).json({
      success: true,
      message: "Feature status updated",
      data: property
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};