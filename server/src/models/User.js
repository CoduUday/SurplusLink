import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Excluded from query results by default
    },
    role: {
      type: String,
      enum: {
        values: ['DONOR', 'NGO'],
        message: '{VALUE} is not a valid role. Allowed roles are DONOR or NGO'
      },
      required: [true, 'Please specify a role (DONOR or NGO)']
    },
    organization: {
      type: String,
      required: [true, 'Please provide an organization name'],
      trim: true
    },
    contact: {
      type: String,
      required: [true, 'Please provide a contact number'],
      trim: true
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      zipCode: { type: String, trim: true, default: '' },
      fullAddress: { type: String, trim: true, default: '' }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      // [longitude, latitude] format for MongoDB geospatial queries
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      locationName: {
        type: String,
        default: ''
      }
    },
    // Account Status & Verification
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    // NGO-Specific & Matching Profile Fields
    operatingSchedule: {
      type: String,
      default: '',
      trim: true
    },
    operatingHours: {
      start: { type: String, default: '', trim: true },
      end: { type: String, default: '', trim: true },
      days: { type: [String], default: [] }
    },
    servingCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Serving capacity cannot be negative']
    },
    minServingCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Minimum serving capacity cannot be negative']
    },
    maxServingCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Maximum serving capacity cannot be negative']
    },
    serviceRadiusKm: {
      type: Number,
      default: 20,
      min: [0, 'Service radius cannot be negative']
    },
    acceptedFoodTypes: {
      type: [String],
      enum: ['VEGETARIAN', 'NON_VEGETARIAN'],
      default: ['VEGETARIAN', 'NON_VEGETARIAN']
    },
    acceptedCategories: {
      type: [String],
      default: []
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

// 2dsphere index for future geospatial queries (Haversine distance & NGO radius)
userSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save hook: Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: Compare candidate password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
