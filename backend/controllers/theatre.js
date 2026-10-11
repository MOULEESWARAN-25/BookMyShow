const { UniqueConstraintError } = require("sequelize");
const { sequelize, Theatre, Show } = require("../models");
const { isNonEmptyString, parseId } = require("../utils/validation");

const theatreJson = (theatre) => ({ id: theatre.id, name: theatre.name, city: theatre.city });

const duplicateName = (res) =>
  res.status(409).json({ message: "You already have a theatre with this name" });

const findOwnTheatre = async (req, res) => {
  const theatreId = parseId(req.params.theatreId);
  if (!theatreId) {
    res.status(400).json({ message: "theatreId must be a positive integer" });
    return null;
  }
  const theatre = await Theatre.findByPk(theatreId);
  if (!theatre) {
    res.status(404).json({ message: "Theatre not found" });
    return null;
  }
  if (theatre.adminId !== req.user.userId) {
    res.status(403).json({ message: "You can only manage your own theatres" });
    return null;
  }
  return theatre;
};

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
      return duplicateName(res);
    }
    throw error;
  }

  res.status(201).json({ message: "Theatre created successfully", theatre: theatreJson(theatre) });
};

const listMyTheatres = async (req, res) => {
  const theatres = await sequelize.query(
    `SELECT t.id, t.name, t.city,
            count(s.id) FILTER (WHERE s.starts_at > now() AND s.cancelled_at IS NULL)::int AS "upcomingShows"
       FROM theatres t
       LEFT JOIN shows s ON s.theatre_id = t.id
      WHERE t.admin_id = :adminId
      GROUP BY t.id
      ORDER BY t.name`,
    { replacements: { adminId: req.user.userId }, type: "SELECT" },
  );
  res.status(200).json({ theatres });
};

const updateTheatre = async (req, res) => {
  const { name, city } = req.body || {};
  if (name === undefined && city === undefined) {
    return res.status(400).json({ message: "Send name and/or city" });
  }
  if ((name !== undefined && !isNonEmptyString(name)) || (city !== undefined && !isNonEmptyString(city))) {
    return res.status(400).json({ message: "name and city cannot be empty" });
  }

  const theatre = await findOwnTheatre(req, res);
  if (!theatre) return;

  try {
    await theatre.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(city !== undefined && { city: city.trim() }),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return duplicateName(res);
    }
    throw error;
  }
  res.status(200).json({ message: "Theatre updated successfully", theatre: theatreJson(theatre) });
};

const deleteTheatre = async (req, res) => {
  const theatre = await findOwnTheatre(req, res);
  if (!theatre) return;

  const shows = await Show.count({ where: { theatreId: theatre.id } });
  if (shows > 0) {
    return res.status(409).json({
      message: `This theatre has ${shows} show(s), so it is kept for booking history. Delete or cancel its upcoming shows instead.`,
    });
  }
  await theatre.destroy();
  res.status(200).json({ message: "Theatre deleted" });
};

module.exports = {
  createTheatre,
  listMyTheatres,
  updateTheatre,
  deleteTheatre,
};
