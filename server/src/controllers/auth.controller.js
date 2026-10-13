import User from '../models/User.js';
import { generateToken } from '../utils/token.js';

/**
 * @desc    Register a new user (DONOR or NGO)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      organization,
      contact,
      address,
      location,
      operatingSchedule,
      servingCapacity
    } = req.body;

    // Basic common field validation
    if (!name || !email || !password || !role || !organization || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, role, organization, and contact.'
      });
    }

    // Role validation
    const normalizedRole = role.toUpperCase();
    if (!['DONOR', 'NGO'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either DONOR or NGO.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Format address
    let formattedAddress = { street: '', city: '', state: '', zipCode: '', fullAddress: '' };
    if (typeof address === 'string') {
      formattedAddress.fullAddress = address;
    } else if (typeof address === 'object' && address !== null) {
      formattedAddress = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        fullAddress: address.fullAddress || [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')
      };
    }

    // Prepare user payload
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: normalizedRole,
      organization: organization.trim(),
      contact: contact.trim(),
      address: formattedAddress
    };

    // Role-specific field processing
    if (normalizedRole === 'DONOR') {
      // Process location for Donor (coordinates: [longitude, latitude])
      if (location) {
        let coords = [0, 0];
        let locName = '';

        if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
          coords = [Number(location.coordinates[0]), Number(location.coordinates[1])];
        } else if (location.longitude !== undefined && location.latitude !== undefined) {
          coords = [Number(location.longitude), Number(location.latitude)];
        }

        if (location.locationName) {
          locName = location.locationName;
        }

        userData.location = {
          type: 'Point',
          coordinates: coords,
          locationName: locName || formattedAddress.fullAddress
        };
      } else {
        userData.location = {
          type: 'Point',
          coordinates: [0, 0],
          locationName: formattedAddress.fullAddress
        };
      }
    } else if (normalizedRole === 'NGO') {
      // Validate NGO specific fields
      if (!servingCapacity && servingCapacity !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide serving capacity (number of people/meals served per day) for NGO registration.'
        });
      }

      userData.operatingSchedule = operatingSchedule ? operatingSchedule.trim() : 'Mon-Sat 9AM-7PM';
      userData.servingCapacity = Number(servingCapacity) || 0;

      // Also support optional location for NGO if provided
      if (location && Array.isArray(location.coordinates)) {
        userData.location = {
          type: 'Point',
          coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])],
          locationName: location.locationName || formattedAddress.fullAddress
        };
      }
    }

    // Create user (password is automatically hashed by pre-save hook)
    const user = await User.create(userData);

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Prepare response without password
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    res.status(201).json({
      success: true,
      message: `${normalizedRole === 'DONOR' ? 'Donor' : 'NGO'} registration successful!`,
      token,
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while registering user.'
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare password using bcrypt method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Prepare response without password
    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred during login.'
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // req.user was populated by protect middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
};
