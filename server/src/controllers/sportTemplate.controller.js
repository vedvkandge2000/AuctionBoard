const SportTemplate = require('../models/SportTemplate');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const CONFIG_FIELDS = [
  'name', 'sport', 'icon', 'description',
  'playerRoles', 'currency', 'currencySymbol', 'currencyUnit',
  'defaultPursePerTeam', 'minSquadSize', 'maxSquadSize', 'maxOverseasPlayers',
  'minMalePlayers', 'minFemalePlayers', 'bidIncrementTiers',
  'rtmEnabled', 'rtmCardsPerTeam', 'playerCategories', 'categoryBasePrices',
];

// List all templates (any authenticated user — needed for auction creation dropdown)
const listTemplates = asyncHandler(async (req, res) => {
  const templates = await SportTemplate.find().sort({ createdAt: 1 });
  res.json({ success: true, templates });
});

// Get single template
const getTemplate = asyncHandler(async (req, res) => {
  const template = await SportTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Sport template not found');
  res.json({ success: true, template });
});

// Create template (admin only)
const createTemplate = asyncHandler(async (req, res) => {
  const data = {};
  CONFIG_FIELDS.forEach((key) => { if (req.body[key] !== undefined) data[key] = req.body[key]; });

  // Ensure sport slug is unique
  const existing = await SportTemplate.findOne({ sport: data.sport?.toLowerCase() });
  if (existing) throw new ApiError(409, `A template for sport "${data.sport}" already exists`);

  const template = await SportTemplate.create(data);
  res.status(201).json({ success: true, template });
});

// Update template (admin only)
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await SportTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Sport template not found');

  // If sport slug is changing, check for conflicts
  if (req.body.sport && req.body.sport.toLowerCase() !== template.sport) {
    const conflict = await SportTemplate.findOne({ sport: req.body.sport.toLowerCase(), _id: { $ne: template._id } });
    if (conflict) throw new ApiError(409, `A template for sport "${req.body.sport}" already exists`);
  }

  CONFIG_FIELDS.forEach((key) => { if (req.body[key] !== undefined) template[key] = req.body[key]; });
  await template.save();
  res.json({ success: true, template });
});

// Delete template (admin only; seeded templates are protected)
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await SportTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Sport template not found');
  if (template.isSeeded) throw new ApiError(403, 'Built-in templates cannot be deleted. Clone and customise instead.');

  await template.deleteOne();
  res.json({ success: true });
});

// Clone a template (admin only)
const cloneTemplate = asyncHandler(async (req, res) => {
  const source = await SportTemplate.findById(req.params.id);
  if (!source) throw new ApiError(404, 'Sport template not found');

  const data = source.toObject();
  delete data._id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.__v;
  data.isSeeded = false;
  data.name = `${source.name} (copy)`;
  data.sport = `${source.sport}_copy_${Date.now()}`;

  const clone = await SportTemplate.create(data);
  res.status(201).json({ success: true, template: clone });
});

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, cloneTemplate };
