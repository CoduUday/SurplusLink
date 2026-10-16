import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
      index: true
    },
    foodName: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      maxlength: [150, 'Food name cannot exceed 150 characters']
    },
    category: {
      type: String,
      required: [true, 'Food category is required'],
      enum: {
        values: [
          'Cooked Meals',
          'Bakery & Bread',
          'Fresh Produce',
          'Dairy & Eggs',
          'Packaged Food',
          'Beverages',
          'Other'
        ],
        message: '{VALUE} is not a valid category'
      }
    },
    quantity: {
      type: Number,
      required: [true, 'Food quantity is required'],
      min: [0.01, 'Quantity must be a positive number']
    },
    quantityUnit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: {
        values: ['kg', 'grams', 'litres', 'packets', 'servings', 'boxes'],
        message: '{VALUE} is not a valid quantity unit'
      },
      default: 'kg'
    },
    foodType: {
      type: String,
      required: [true, 'Food type (VEGETARIAN or NON_VEGETARIAN) is required'],
      enum: {
        values: ['VEGETARIAN', 'NON_VEGETARIAN'],
        message: 'Food type must be either VEGETARIAN or NON_VEGETARIAN'
      }
    },
    servings: {
      type: Number,
      required: [true, 'Number of people served is required'],
      min: [1, 'Servings must be at least 1 person'],
      validate: {
        validator: Number.isInteger,
        message: 'Servings must be a whole integer value'
      }
    },
    allergenInfo: {
      allergensDeclared: {
        type: [String],
        default: []
      },
      ingredientNotes: {
        type: String,
        trim: true,
        default: ''
      },
      declarationStatus: {
        type: String,
        enum: {
          values: ['DECLARED_ALLERGENS', 'ALLERGEN_FREE_VERIFIED', 'UNKNOWN_UNVERIFIED'],
          message: '{VALUE} is not a valid allergen declaration status'
        },
        default: 'UNKNOWN_UNVERIFIED'
      }
    },
    location: {
      address: {
        type: String,
        required: [true, 'Pickup address is required'],
        trim: true
      },
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Pickup coordinates [longitude, latitude] are required for geographic matching'],
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            if (typeof lng !== 'number' || typeof lat !== 'number') return false;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: 'Coordinates must be valid [longitude, latitude] in degrees'
        }
      }
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline date and time is required']
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    pickupInstructions: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'ACCEPTED', 'COLLECTED', 'DELIVERED', 'CANCELLED', 'EXPIRED'],
        message: '{VALUE} is not a valid donation status'
      },
      default: 'AVAILABLE',
      index: true
    },
    // Acceptance & Pickup Coordination Fields
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    estimatedPickupTime: {
      type: String,
      trim: true,
      default: ''
    },
    acceptNotes: {
      type: String,
      trim: true,
      default: ''
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for NGO available queries, donor history, and geospatial matching
donationSchema.index({ status: 1, pickupDeadline: 1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ category: 1, foodType: 1 });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
