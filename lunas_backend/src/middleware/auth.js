const User = require('../models/User');
const { canSignIn } = require('../utils/accountPolicy');
const { createAuditLog } = require('../utils/auditLogger');
const { isCurrentTokenVersion, verifyAccessToken } = require('../utils/authTokens');

// Verify JWT token and attach user to request
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Refresh tokens are intentionally rejected here; only short-lived
      // access tokens can authorize an API request.
      const decoded = verifyAccessToken(token);
      if (decoded.tokenType !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid or has expired'
        });
      }

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password +tokenVersion');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!canSignIn(req.user)) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      if (!isCurrentTokenVersion(decoded, req.user)) {
        return res.status(401).json({
          success: false,
          message: 'Your session is no longer valid. Please log in again.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid or has expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      createAuditLog({
        action: 'permission_changed',
        performedBy: req.user._id,
        details: {
          attemptedRole: roles,
          userRole: req.user.role,
          path: req.path
        },
        status: 'failure',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional auth - attach user if token present, but don't require it
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (decoded.tokenType !== 'access') {
          req.user = null;
        } else {
          const user = await User.findById(decoded.id).select('-password +tokenVersion');
          req.user = canSignIn(user) && isCurrentTokenVersion(decoded, user) ? user : null;
        }
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check if user owns the resource or has admin privileges
exports.ownerOrAdmin = (resourceOwnerField = 'reporter') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resource = req.resource; // Should be set by previous middleware
    if (resource && resource[resourceOwnerField]) {
      const ownerId = resource[resourceOwnerField]._id || resource[resourceOwnerField];
      if (ownerId.toString() === req.user._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  };
};

// Barangay jurisdiction check
exports.checkBarangayJurisdiction = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Admin and city engineers can access all barangays
    if (['admin', 'city_engineer'].includes(req.user.role)) {
      return next();
    }

    // Barangay officials can only access their own barangay
    if (req.user.role === 'barangay_official') {
      const resource = req.resource;
      if (resource && resource.location && resource.location.address) {
        if (resource.location.address.barangay !== req.user.barangay) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access incidents from other barangays'
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during jurisdiction check'
    });
  }
};
