const blockAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return res.status(403).json({ message: "Admins cannot access this resource" });
  }

  next();
};

module.exports = blockAdmin;
