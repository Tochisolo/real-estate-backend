const mongoose = require("mongoose");
const slugify = require("slugify");

// media sub-schema
const mediaSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    resource_type: {
      type: String,
      enum: ["image", "video"],
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
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      index: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },

   media: {
      images: {
        type: [mediaSchema],
        default: []
      },
      videos: {
        type: [mediaSchema],
        default: []
      }
    },


  location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },


  //Amenities (important for filtering)
   amenities: {
      type: [String],
      default: []
    },

    bedrooms: {
      type: Number,
      min: 0
    },

    bathrooms: {
      type: Number,
      min: 0
    },

    area: {
      type: Number, // square meters
      min: 0
    },

  //Featured property flag
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  landlord: {
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
propertySchema.pre("save", function () {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});



// Dynamic slug update (findByIdAndUpdate, etc.)
propertySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update.title) {
    update.slug = slugify(update.title, { lower: true, strict: true });
  }
});



module.exports = mongoose.model("Property", propertySchema);