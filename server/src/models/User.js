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
    // NGO-Specific Fields
    operatingSchedule: {
      type: String,
      default: '',
      trim: true
    },
    servingCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Serving capacity cannot be negative']
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
