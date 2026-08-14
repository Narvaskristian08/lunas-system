const Category = require('../models/Category');
const {
  DEFAULT_INCIDENT_CATEGORIES,
  isIncidentCategory
} = require('../utils/incidentCategories');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get reportable infrastructure categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const configuredCategories = await Category.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  const categories = configuredCategories
    .map((category) => ({
      id: category._id,
      code: String(category.code || '').toLowerCase(),
      name: category.name,
      description: category.description,
      subcategories: category.subcategories || [],
      icon: category.icon,
      color: category.color
    }))
    .filter((category) => isIncidentCategory(category.code));

  res.status(200).json({
    success: true,
    // The Incident schema's established category codes are a real source of
    // truth until a Category collection is seeded in a deployment.
    data: categories.length ? categories : DEFAULT_INCIDENT_CATEGORIES
  });
});
