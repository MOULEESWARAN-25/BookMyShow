const { UniqueConstraintError } = require("sequelize");
const { Theatre } = require("../models");
const { isNonEmptyString } = require("../utils/validation");

const createTheatre = async (req, res) => {
  const { name, city } = req.body || {};

  if (![name, city].every(isNonEmptyString)) {
    return res.status(400).json({ message: "name and city are required" });
  }

  let theatre;
  try {
    theatre = await Theatre.create({
      adminId: req.user.userId,
      name: name.trim(),
      city: city.trim(),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({ message: "You already have a theatre with this name" });
    }
    throw error;
  }

  res.status(201).json({
    message: "Theatre created successfully",
    theatre: { id: theatre.id, name: theatre.name, city: theatre.city },
  });
};

module.exports = {
  createTheatre,
};
