const mongoose = require("mongoose");
const slugify = require("slugify");

// Image sub-schema
const imageSchema = new mongoose.Schema(
{
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  }
},
{ _id: false }
);

const propertySchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    lowercase: true,
    index: true
  },

  description: {
    type: String,
    required: true
  },

  propertyType: {
    type: String,
    enum: ["apartment", "house", "land", "commercial"],
    required: true
  },

  listingType: {
    type: String,
    enum: ["rent", "sale"],
    required: true
  },

  price: {
    type: Number,
    required: true,
    index: true
  },

  address: {
    city: {
      type: String,
      index: true
    },
    state: String,
    country: String
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: "2dsphere"
    }
  },

  //Embedded images
  images: [imageSchema],

  //Amenities (important for filtering)
  amenities: [
    {
      type: String,
      trim: true,
      index: true
    }
  ],

  //Featured property flag
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
    index: true
  },

  isAvailable: {
    type: Boolean,
    default: true
  }

},
{
  timestamps: true
}
);



//Generate slug on CREATE
propertySchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});



// Dynamic slug update (findByIdAndUpdate, etc.)
propertySchema.pre("findOneAndUpdate", function (next) {

  const update = this.getUpdate();

  if (update.title) {
    update.slug = slugify(update.title, { lower: true, strict: true });
  }

  next();
});



module.exports = mongoose.model("Property", propertySchema);