const { Theatre } = require("../models");
const { isNonEmptyString } = require("../utils/validation");

const createTheatre = async (req, res) => {
  const { name, city } = req.body || {};

  if (![name, city].every(isNonEmptyString)) {
    return res.status(400).json({ message: "name and city are required" });
  }

  const theatre = await Theatre.create({
    adminId: req.user.userId,
    name: name.trim(),
    city: city.trim(),
  });

  res.status(201).json({
    message: "Theatre created successfully",
    theatre: { id: theatre.id, name: theatre.name, city: theatre.city },
  });
};

module.exports = {
  createTheatre,
};
